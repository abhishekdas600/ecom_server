import { User } from "@prisma/client";
import JWT from "jsonwebtoken";
import { JWTEmail, JWTUser } from "../../interfaces";

const JWT_SECRET = process.env.JWT_secret || "";

class JWTService {
    public static generateTokenForUser(user: User){
        
        const payload: JWTUser= {
            id: user?.id,
            email: user?.email,
            isVerified: user?.isVerified,
        };
        const token = JWT.sign(payload, JWT_SECRET );
        return token;
    }
    public static decodeToken(token: string){
        try {
            return JWT.verify(token, JWT_SECRET) as  JWTUser;
        } catch (error) {
            return null;
        }
        
    }
    public static generateTokenForEmail(email: string){
        const payload: JWTEmail={
            email: email,
        };
        const token = JWT.sign(payload, JWT_SECRET, {expiresIn: '1d'});
        return token;
    }
    public static decodeTokenForEmail(token: string){
        try {
            return JWT.verify(token, JWT_SECRET) as  JWTEmail;
        } catch (error) {
            return null;
        }
        
    }
}

export default JWTService;