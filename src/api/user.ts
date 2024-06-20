import express from "express";
import { prismaClient } from "../db";
import { FakeItem, JWTUser } from "../interfaces";
import axios from "axios";
import { PrismaClientValidationError } from "@prisma/client/runtime/library";
import {redisClient} from "../db/redis";

const router = express.Router();

router.get("/currentuser", async (req, res) => {
    try {
        const currentUser = req.context.user;
        
        if (!currentUser) {
            return res.status(400).json({ message: "No User found" });
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

router.get("/cart", async (req, res) => {
    const currentUser = req.context.user;
    if (!currentUser) {
        return res.status(400).json({ message: "User not found" });
    }

    try {
        const cartKey = `cart:${currentUser.id}`;
        const cartItems = await redisClient.hgetall(cartKey);
        
        if (Object.keys(cartItems).length === 0) {
            return res.status(200).json([]);
        }
        const itemIds = Object.keys(cartItems);

        const itemFormDatabase = await prismaClient.item.findMany({
            where:{
                id:{
                    in: itemIds
                }
            },
            select:{
                id: true,
                title: true,
                price: true,
                image: true
            }
        })

        const parsedItems = itemFormDatabase.map(item =>({
            id: item.id,
            title: item.title,
            price: item.price,
            image: item.image,
            quantity: cartItems[item.id]
        }))
       
        return res.json(parsedItems);
    } catch (error) {
        console.error("Error fetching cart items:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/addtocart", async (req, res) => {
    const currentUser = req.context.user;
    if (!currentUser) {
        return res.status(400).json({ message: "User not found" });
    }

    try {
        const itemId = req.body.itemId;
        const quantity = req.body.quantity;
        const item = await prismaClient.item.findUnique({
            where: { id: itemId }
        });

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
         
        const cartKey = `cart:${currentUser.id}`;
        await redisClient.hincrby(cartKey, itemId, quantity);

        return res.status(200).json({ message: "Item added to cart" });
    } catch (error) {
        console.error("Error creating item connection:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.delete("/removefromcart/:itemId", async (req, res) => {
    const currentUser = req.context.user;
    if (!currentUser) {
        return res.status(400).json({ message: "User not found" });
    }

    try {
        const itemId = req.params.itemId;

        const item = await prismaClient.item.findUnique({
            where: { id: itemId }
        });

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }
        const cartKey = `cart:${currentUser.id}`
        await redisClient.hdel(cartKey, item.id);

        return res.status(200).json({ message: "Removed from the cart" });
    } catch (error) {
        console.error("Error deleting item connection:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/update_profile", async (req, res) => {
    const currentUser = req.context.user;
    if (!currentUser) {
        return res.status(400).json({ message: "No user found" });
    }

    try {
        const updatedUser = await prismaClient.user.update({
            where: { id: currentUser?.id },
            data: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                profileImageUrl: req.body.profileImageUrl
            }
        });
        return res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(404).json({ error: error, message: "Update failed" });
    }
});

router.get("/addresses", async (req, res) => {
    const currentUser = req.context.user;
    if (!currentUser) {
        return res.status(400).json({ message: "No user found" });
    }

    try {
        const result = await prismaClient.address.findMany({
            where: { userId: currentUser?.id }
        });
        return res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching addresses:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.post("/createaddress", async (req, res) => {
    const currentUser = req.context.user;
    if (!currentUser) {
        return res.status(400).json({ message: "No user found" });
    }

    const { addressLine, pincode, district, state, number } = req.body;

    if (!addressLine || !pincode || !district || !state || !number) {
        return res.status(400).json({ message: "All fields are required" });
    }

    if (isNaN(pincode) || isNaN(number)) {
        return res.status(400).json({ message: "Invalid pincode or number" });
    }

    try {
        const parsedPincode = parseInt(pincode);

        await prismaClient.address.create({
            data: {
                addressLine,
                pincode: parsedPincode,
                district,
                state,
                number,
                userId: currentUser?.id
            }
        });

        return res.status(200).json({ message: "Address created successfully" });
    } catch (error) {
        console.error("Error creating address:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

router.delete("/deleteaddress/:id", async (req, res) => {
    const currentUser = req.context.user;
    if (!currentUser) {
        return res.status(400).json({ message: "No user found" });
    }

    try {
        const address = await prismaClient.address.delete({
            where: { id: req.params.id }
        });

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        return res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
        console.error("Error deleting address:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;