import { User } from "@prisma/client";
import nodemailer from "nodemailer";
import JWTService from "./jwt";
import express from "express";
const router= express.Router();

const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth:{
        user: 'rosalyn43@ethereal.email',
        pass: 'bA4Mn1CfzguTQnR9v5'
    }
})

class NodemailService {
    public static async sendEmail(email: string): Promise<void> {
        

        try {
            const emailToken = JWTService.generateTokenForEmail(email); 
            const url = `http://localhost:8000/confirmation/${emailToken}`;

            
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
}

export default NodemailService;