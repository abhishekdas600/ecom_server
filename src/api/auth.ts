import express, { Router } from "express";
import { prismaClient } from "../db";
import Encryption from "./authentication/bcrypt";
import JWTService from "./authentication/jwt";
import NodemailService from "./authentication/nodemailer";


const router = express.Router()



router.post("/signup", async(req,res)=>{
    const currentUser = req.context.user;
    if(!currentUser){
        const user = await prismaClient.user.findUnique({
            where:{
                email: req.body.email,
            }
        })
        if(!user){
           const newUser = await prismaClient.user.create({
                    data:{
                        firstName: req.body.firstName,
                        lastName: req.body.lastName,
                        email: req.body.email,
                        password: await Encryption.hashPassword(req.body.password)
                    }
                })
            //     const token = JWTService.generateTokenForUser(newUser);
            // res.json(token);
           await NodemailService.sendEmail(newUser.email);

            res.json(newUser);
            
            
        }
       else{
        res.status(400).json({message:"Email already Used"});
       }
    }
    else{
        res.status(400).json({message: `Already logged as ${currentUser.email}`})
    }
   
})

router.post("/login", async(req,res)=>{
    const currentUser = req.context.user;
    if(!currentUser){
        const user = await prismaClient.user.findUnique({
            where:{
                email : req.body.email        
            }
            
           })
           if(!user || !await Encryption.comparePasswords(req.body.password, user.password) ) {
            res.status(400).json({message: "User not found"})
           }
           else if(!user.isVerified){
            res.status(400).json({message:"Please Confirm Your Email"});
           }
           else{
            const token = JWTService.generateTokenForUser(user);
            res.json(token);
           }
        
    }
   
   else{
    res.status(400).json({message: `Already logged as ${currentUser.email}`})
   }
   
})

export default router;