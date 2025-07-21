export interface UsersType {
    id: number
    avatar?: string
    rut: string
    fullName: string
    username: string
    email: string
    role: string
    currentPlan: string
    status: string
    company: string
    country: string
    contact: string
}

export interface UsersTypeWithAction extends UsersType {
    action?: string
}
