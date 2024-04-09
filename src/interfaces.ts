export interface JWTUser{
    id: string
    email: string
    isVerified: Boolean 
}
export interface Context {
    user?:JWTUser
}
export interface JWTEmail{
    email: string
}