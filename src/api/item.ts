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
        const products = await axios.get('https://fakestoreapi.com/products');
        if(!products){
            res.status(404).json({message: "Products not found"})
        }
        res.status(200).json(products.data);
    } catch (error) {
        res.status(400).json(error);
    }

})

router.get('/productsById/:id', async(req,res)=>{
     try {
       const id = req.params.id
       if(!id){
        res.status(404).json({message: "ID not found"})
       }
        const item = await axios.get(`https://fakestoreapi.com/products/${id}`)
        res.status(200).json(item.data);
        if(!item){
            res.status(400).json({message: "Item of this ID not found"})
        }
     } catch (error) {
        res.status(400).json(error);
     }
})


export default router;