import express from "express";
import Stripe from "stripe";
import bodyParser from "body-parser"; 

import { redisClient } from "../db/redis";
import { prismaClient } from "../db";
import { RequestWithRawBody } from "..";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);





router.post("/webhook", async (req: RequestWithRawBody, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        console.error('Stripe webhook secret not defined');
        return res.status(500).send('Webhook secret not configured.');
    }

    let event: Stripe.Event;

    try {
        console.log('Request Headers:', req.headers);
        event = stripe.webhooks.constructEvent(req.rawBody as string , sig as string, webhookSecret);
        
    } catch (error) {
        console.error(`Webhook signature verification failed. Error: ${error}`);
        return res.status(400).send(`Webhook signature verification failed. Error: ${error}`);
    }

    console.log(`Received event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            const cartKey = `cart:${session.metadata?.userId}`;
            const cartItems = await redisClient.hGetAll(cartKey);

            const itemUserEntries = Object.keys(cartItems).map(itemId => ({
                userId: session.metadata?.userId as string,
                addressId: session.metadata?.addressId as string,
                itemId: itemId,
                quantity: parseInt(cartItems[itemId], 10),
            }));

            await Promise.all(itemUserEntries.map(entry =>
                prismaClient.itemUser.upsert({
                    where: {
                        userId_itemId_addressId: {
                            userId: entry.userId,
                            itemId: entry.itemId,
                            addressId: entry.addressId,
                        },
                    },
                    update: {
                        quantity: {
                            increment: entry.quantity,
                        },
                    },
                    create: {
                        userId: entry.userId,
                        itemId: entry.itemId,
                        addressId: entry.addressId,
                        quantity: entry.quantity,
                    },
                })
            ));

            await redisClient.del(cartKey);

            console.log(`Checkout session completed for user: ${session.metadata?.userId}`);
        } catch (error) {
            console.error(`Error processing checkout session: ${error}`);
            return res.status(500).send(`Internal Server Error: ${error}`);
        }
    }

    res.status(200).json({ received: true });
});



router.post("/payment-session", async (req, res) => {
    const currentUser = req.context.user;
    if (!currentUser) {
        return res.status(400).json({ message: "User not found" });
    }

    try {
        const cartKey = `cart:${currentUser.id}`;
        const cartItems = await redisClient.hGetAll(cartKey);
        if (Object.keys(cartItems).length === 0) {
            return res.status(200).json({ message: "Cart is empty" });
        }

        const itemIds = Object.keys(cartItems);
        const itemsList = await prismaClient.item.findMany({
            where: {
                id: { in: itemIds },
            },
            select: {
                id: true,
                title: true,
                price: true,
            },
        });

        const addressId = req.body.addressId;
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: itemsList.map((item) => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.title,
                    },
                    unit_amount: item.price * 100,
                },
                quantity: parseInt(cartItems[item.id]),
            })),
            success_url: "http://localhost:3000",
            cancel_url: "http://localhost:3000",
            metadata: {
                userId: currentUser.id,
                addressId: addressId
            }
        });

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error("Error creating payment session:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

export default router;