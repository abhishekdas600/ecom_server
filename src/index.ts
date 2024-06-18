import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import authRouter from "./api/auth";
import cors from "cors";
import JWTService from "./api/services/jwt";
import { Context, JWTEmail, JWTUser } from "./interfaces";
import userRouter from "./api/user";
import itemRouter from "./api/item";
import stripeRouter from "./api/stripe";
import * as dotenv from "dotenv";
import { prismaClient } from "./db";
import Encryption from "./api/services/bcrypt";
import getRawBody from "raw-body"

import Stripe from "stripe";
import { redisClient } from "./db/redis";

const app = express();
const port = 8000;



dotenv.config();

declare global {
  namespace Express {
    interface Request {
      context: Context;
    }
  }
}




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).json({ message: "ok" });
});






const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split('Bearer ')[1];
    const user = JWTService.decodeToken(token);
    req.context = {
      user: user as JWTUser,
    };
    next();
  } else {
    req.context = {};
    next();
  }
};




app.use(jwtMiddleware);


app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/item", itemRouter);
app.use("/api/stripe", stripeRouter)
app.listen(port, () => {
  console.log(`Server has started at port ${port}`);
});



