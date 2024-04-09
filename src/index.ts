import express, {  Request, Response,NextFunction } from "express";
import bodyParser from "body-parser";
import authRouter from "./api/auth";
import cors from "cors";
import JWTService from "./api/authentication/jwt";
import { Context, JWTEmail, JWTUser } from "./interfaces";
import userRouter from "./api/user";
import itemRouter from "./api/item";
import * as dotenv from "dotenv";
import { prismaClient } from "./db";
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
app.use(cors());


app.get("/", (req,res)=>{
    res.status(200).json({messsage:"ok"});
})

app.get("/confirmation/:token", async (req, res) => {
  const emailToken = req.params.token;
  const email = await JWTService.decodeTokenForEmail(emailToken) as JWTEmail;

  if (email) {
      const currentUser = await prismaClient.user.findUnique({
          where: { email: email.email}
      });

      if (currentUser) {
          
          await prismaClient.user.update({
              where: { id: currentUser.id },
              data: { isVerified: true }
          });

         
          const token = await JWTService.generateTokenForUser(currentUser);

          
          res.status(200).json({ token: token, message: "Email Verified" });
      } else {
          res.status(400).json({ message: `User not found for ${email}` });
      }
  } else {
      res.status(404).json({ message: "Email Token Invalid" });
  }
});
const jwtMiddleware = (req: Request, res: Response, next: NextFunction) => {
   
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    
      const token = req.headers.authorization.split('Bearer ')[1];

     const user = JWTService.decodeToken(token);
      req.context ={
        user : user as JWTUser,
      }
      next();
    }
    else{
        req.context={};
        next();
    }
};

    app.use(jwtMiddleware);

app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/item",itemRouter );
app.listen(port, ()=>{
    console.log(`Server has started at port ${port}`);
})


