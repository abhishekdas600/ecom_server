import { User } from "@prisma/client";
import nodemailer from "nodemailer";
import JWTService from "./jwt";
import express from "express";
const router= express.Router();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth:{
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

class NodemailService {
    public static async sendEmail(email: string): Promise<void> {
        

        try {
            const emailToken = JWTService.generateTokenForEmail(email); 
            const url = `${process.env.AWS_URL}/confirmation/${emailToken}`;

            
            await transporter.sendMail({
                to: email,
                subject: 'Confirm email',
                html: `Please click this link to confirm your email: <a href="${url}">${url}</a>`
            });

           
            console.log('Email sent successfully');
        } catch (error) {
            
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }
    public static async resetEmail(email : string){
        try {
            const emailToken = JWTService.generateTokenForEmail(email);
            const url = `${process.env.AWS_URL}/resetpassword/${emailToken}`

            await transporter.sendMail({
                to: email,
                subject: 'Reset Password',
                html:`Please click this link to reset your Password: <a href="${url}">${url}</a>`
            });

            console.log("Reset Email sent successfully")
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error('Failed to send email');
        }
    }
}

export default NodemailService;