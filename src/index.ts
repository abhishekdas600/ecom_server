import express, {  Request, Response,NextFunction } from "express";
import bodyParser from "body-parser";
import authRouter from "./api/auth";
import cors from "cors";
import JWTService from "./api/authentication/jwt";
import { Context, JWTUser } from "./interfaces";
import userRouter from "./api/user";
import itemRouter from "./api/item";
import * as dotenv from "dotenv";
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


