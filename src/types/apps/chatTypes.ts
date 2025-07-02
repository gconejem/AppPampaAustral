// Chat types
export interface ChatMessage {
  message: string
  time: string
  senderId: number
  msgStatus?: {
    isSent: boolean
    isDelivered: boolean
    isSeen: boolean
  }
}

export interface UserSettings {
  isTwoStepAuthVerificationEnabled: boolean
  isNotificationsOn: boolean
}

export type StatusType = 'online' | 'offline' | 'busy' | 'away'

export interface User {
  id: number
  avatar?: string
  fullName: string
  role: string
  about: string
  status: StatusType
  avatarColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  settings?: UserSettings
}

export interface Chat {
  id: number
  userId: number
  unseenMsgs: number
  chat: ChatMessage[]
}

export interface ChatDataType {
  profileUser: User
  contacts: User[]
  chats: Chat[]
  activeUser?: User
} 
