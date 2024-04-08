import express from "express";
import { prismaClient } from "../db";

const router = express.Router();

router.post("/add", async(req,res)=>{
    const currentUser = req.context.user;
    if(!currentUser){
        res.status(400).json({message: "User not found"})
    }
    const newItem = await prismaClient.item.create({
        data:{
            itemName: req.body.itemName,
            itemQuantity: req.body.itemQuantity,
            price: req.body.price,
            category: req.body.category
        }
    })
    res.json(newItem);
})

router.delete("/remove", async(req,res)=>{
    const currentUser = req.context.user;
    if(!currentUser){
        res.status(400).json({message: "User not found"})
    }
    if(!req.body.id){
        return res.status(400).json({ message: "Item ID is required" })
    }
    await prismaClient.item.delete({
        where:{id: req.body.id},
        
    })
    res.status(200).json({message: "Item removed"});
})

export default router;