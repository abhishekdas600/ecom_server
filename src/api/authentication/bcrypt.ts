import bcrypt from "bcrypt";
class Encryption {

    public static async hashPassword(password: string): Promise<string>{
             const saltRounds = 10;
             const hashedPassword = await bcrypt.hash(password, saltRounds);
             return hashedPassword;
         }

    public static async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    }
}

export default Encryption;



