import express from "express";
import { prismaClient } from "../db";
import axios from "axios";

const router = express.Router();

// router.post("/add", async(req,res)=>{
//     const currentUser = req.context.user;
//     if(!currentUser){
//         res.status(400).json({message: "User not found"})
//     }
//     const newItem = await prismaClient.item.create({
//         data:{
//             itemName: req.body.itemName,
//             itemQuantity: req.body.itemQuantity,
//             price: req.body.price,
//             category: req.body.category
//         }
//     })
//     res.json(newItem);
// })

// router.delete("/remove", async(req,res)=>{
//     const currentUser = req.context.user;
//     if(!currentUser){
//         res.status(400).json({message: "User not found"})
//     }
//     if(!req.body.id){
//         return res.status(400).json({ message: "Item ID is required" })
//     }
//     await prismaClient.item.delete({
//         where:{id: req.body.id},
        
//     })
//     res.status(200).json({message: "Item removed"});
// })

router.get('/products', async(req,res)=>{
    try {
        const products = await prismaClient.item.findMany({
           
        })
        if(!products){
           return res.status(404).json({message: "Products not found"})
        }
       return res.status(200).json(products);
    } catch (error) {
       return res.status(400).json(error);
    }

})

router.get('/productsById/:id', async(req,res)=>{
     try {
       const id = req.params.id
       if(!id){
       return res.status(404).json({message: "ID not found"})
       }
        const item = await prismaClient.item.findUnique({
            where:{id: id}
        })
       
        if(!item){
           return res.status(400).json({message: "Item of this ID not found"})
        }
          return  res.status(200).json(item);
     } catch (error) {
       return res.status(400).json(error);
     }
})

router.get("/prev-orders", async(req,res)=>{
   const currentUser = req.context.user;
   if(!currentUser){
      return res.status(400).json({ message: "No User found" })
   }
   try {
      const prevOrders = await prismaClient.itemUser.findMany({
         where:{userId: currentUser.id},
        select:{
         item: true
        }
      })
      return res.status(200).json(prevOrders)
   } catch (error) {
      return res.status(400).json(error)
   }
})



export default router;