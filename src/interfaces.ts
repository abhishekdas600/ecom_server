

export interface JWTUser{
    id: string
    email: string
    
}
export interface Context {
    user?: JWTUser
}
export interface JWTEmail{
    email: string
}

