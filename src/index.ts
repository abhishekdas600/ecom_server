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

export interface RequestWithRawBody extends Request {
  rawBody?: string;
}



app.use(bodyParser.json({
  
  verify: function(req: RequestWithRawBody, res: Response, buf: Buffer) {
  var url = req.originalUrl;
  if (url.startsWith('/api/stripe/webhook')) {
  req.rawBody = buf.toString()
  }
  }}));
  app.use(cors());

  app.get("/", (req,res)=>{
    res.status(200).json({messsage:"ok"});
})

app.get("/confirmation/:token", async (req, res) => {
  const emailToken = req.params.token;
  const email = JWTService.decodeTokenForEmail(emailToken) as JWTEmail;

  if (email) {
      const currentUser = await prismaClient.user.findUnique({
          where: { email: email.email}
      });

      if (currentUser) {

          await prismaClient.user.update({
              where: { id: currentUser.id },
              data: { isVerified: true }
          });


          const token = JWTService.generateTokenForUser(currentUser);


          res.status(200).redirect(`${process.env.CLIENT_URL}/confirmation/${token}`)
      } else {
          res.status(400).json({ message: `User not found for ${email}` });
      }
  } else {
      res.status(404).json({ message: "Email Token Invalid" });
  }
});

app.get("/resetpassword/:token", async(req,res)=>{
  const token = req.params.token;
  const userEmail =  JWTService.decodeTokenForEmail(token);

  if(userEmail){
    const user = await prismaClient.user.findUnique({
      where:{email: userEmail.email}
    })
   if(user){

    res.status(200).redirect(`${process.env.CLIENT_URL}/resetpassword/${token}`)

   }else{
    res.status(404).json({message: "User not found"});
   }

  }else{
    res.status(400).json({message: "Email not found"})
  }

})

















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



