export interface JWTUser{
    id: string
    email: string
}
export interface Context {
    user?:JWTUser
}