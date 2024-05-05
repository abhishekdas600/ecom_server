import express, { Router } from "express";
import { prismaClient } from "../db";
import Encryption from "./authentication/bcrypt";
import JWTService from "./authentication/jwt";
import NodemailService from "./authentication/nodemailer";


const router = express.Router()

function isValidEmail(email: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

router.post("/signup", async(req,res)=>{
    const currentUser = req.context.user;
    if(!currentUser){
        const email = req.body.email;
        if(!isValidEmail(email)){
            console.error("Invalid email address provided:", email);
                return res.status(400).json({ message: "Invalid email address" });
        }
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
                
           await NodemailService.sendEmail(newUser.email);

            
            
            
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
           const email = req.body.email;
        if(!isValidEmail(email)){
            console.error("Invalid email address provided:", email);
                return res.status(400).json({ message: "Invalid email address" });
        }
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

router.post("/forgotpassword", async(req,res)=>{
    const currentUser = req.context.user;
    if(currentUser){
        res.status(400).json({message: "User already Logged in"});
    }
    const user = await prismaClient.user.findUnique({
        where:{
            email: req.body.email
        }
    })
    const email = req.body.email;
   
    if(email){
        if(!isValidEmail(email)){
            console.error("Invalid email address provided:", email);
                return res.status(400).json({ message: "Invalid email address" });
        }
        else{
            await NodemailService.resetEmail(user?.email as string);
        res.status(200).json({message: "Email Sent Successfully"})
        }
        
    }
   
    if(!user){
    res.status(400).json({message: "User not Found"});
    }
    
})

router.post("/resetpassword/:token",async(req,res)=>{
    const currentUser = req.context.user;
    if(currentUser){
       res.status(400).json({message: "User already found"});
    }
    const token = req.params.token;
    if(token){
        const email = JWTService.decodeTokenForEmail(token);
        const dbUser = await prismaClient.user.update({
            where: {email: email?.email},
            data:{password: await Encryption.hashPassword(req.body.password)}
        })
        if(!dbUser){
            res.status(404).json({message:"User not found in Database"})
        }else{
            res.status(200).json({message: "Password saved successfully"})
        }
       
    }else{
        res.status(400).json({message: "Invalid Token"})
    }
    
})

export default router;