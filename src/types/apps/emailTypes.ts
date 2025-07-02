// Email Types
export interface EmailUser {
  email: string
  name: string
  avatar?: string
}

export interface Attachment {
  fileName: string
  thumbnail: string
  url: string
  size: string
}

export interface Email {
  id: number
  from: EmailUser
  to: EmailUser[]
  subject: string
  cc: EmailUser[] | string[]
  bcc: EmailUser[] | string[]
  message: string
  attachments: Attachment[]
  isStarred: boolean
  labels: string[]
  time: string | Date
  replies: Email[]
  folder: string
  isRead: boolean
}

export interface EmailType {
  emails: Email[]
}

export interface EmailState {
  emails: Email[]
  filteredEmails: Email[]
  currentEmailId?: number
} 
