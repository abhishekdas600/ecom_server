

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

export interface FakeItem {
    id: string,
    title: string,
    description: string,
    category: string,
    image: string,
    price: number
}
