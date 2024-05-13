import express from "express";
import { prismaClient } from "../db";
import { JWTUser } from "../interfaces";

const router = express.Router();


router.get("/currentuser", async (req, res) => {
    try {
        const currentUser = req.context.user;
        
        if (!currentUser) {
            return res.status(400).json({message: "No User found"});
        }

        const user = await prismaClient.user.findUnique({
            where: { id: currentUser?.id }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found in DB" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "User email is not verified" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching current user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/cart", async(req,res)=>{
   const currentUser = req.context.user;
   if(!currentUser){
    res.status(400).json({message: "User not found"})
}
   const result = await prismaClient.itemUser.findMany({
    where:{userId: currentUser?.id},
    include:{item: true}
   })
   res.json(result.map(el=> el.item));
})

router.post("/add_to_cart", async(req,res)=>{
    const currentUser = req.context.user;
    if(!currentUser){
     res.status(400).json({message: "User not found"})
 }else{
    try {
        const item = await prismaClient.item.findUnique({
            where: { id: req.body.itemId },
            select: {id:true, itemQuantity: true }
        });
       if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }       
        if (item.itemQuantity < req.body.quantity) {
            return res.status(400).json({ message: "Not enough quantity in stock" });
        }        
        await prismaClient.item.update({
            where: { id: req.body.itemId },
            data: { itemQuantity: { decrement: req.body.quantity } }
        });
        await prismaClient.itemUser.create({
            data: {
                userId: currentUser.id,
                itemId: req.body.itemId,
                quantity: req.body.quantity
            }
        });
        res.status(200).json({message: "Connected"})
    } catch (error) {
        console.error("Error creating item connection:", error);
        res.status(500).json({ message: "Internal server error" });
    }
 }
    
})
router.delete("/remove_from_cart", async(req,res)=>{
    const currentUser = req.context.user;
    if(!currentUser){
     res.status(400).json({message: "User not found"})
 }else{
    try{
        const item = await prismaClient.item.findUnique({
            where:{id: req.body.itemId},
            select:{itemQuantity: true}
        })
        if(!item){
            return res.status(404).json({ message: "Item not found" });
        }
        const removedItem = await prismaClient.itemUser.delete({
            where:{userId_itemId: {userId:currentUser.id, itemId:req.body.itemId}},
            select:{quantity: true}
        })
      
        await prismaClient.item.update({
            where:{id: req.body.itemId},
            data:{itemQuantity: {increment: removedItem.quantity}}
        })

       res.status(200).json({message:"Removed from the cart"})
    }
    catch (error) {
        console.error("Error deleting item connection:", error);
        res.status(500).json({ message: "Internal server error" });
    }
    
 }
})

router.post("/update_profile", async(req,res)=>{
    const currentUser = req.context.user;
    if(!currentUser){
        res.status(400).json({message: "No user found"})
    }
    try{
        const updatedUser = await prismaClient.user.update({
            where:{id: currentUser?.id},
            data:{
               firstName: req.body.firstName,
               lastName: req.body.lastName,
               profileImageUrl: req.body.profileImageUrl
            }
        })
        res.status(200).json(updatedUser);
    }
    catch(error){
      res.status(404).json({error: error, message:"Update failed"});
    }
    
    
    
})

export default router;