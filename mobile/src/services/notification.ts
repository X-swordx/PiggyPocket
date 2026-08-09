import { request } from './request'
import { getCurrentUser } from './foodieBuddy'

export interface Message {
  id: number
  title: string
  content: string
  icon: string
  bgColor: string
  sort: number
  enabled: number
  isRead: boolean
  createdAt: string
  updatedAt: string
}

const getUserId = async () => {
  const user = await getCurrentUser()
  return user.id
}

export const getMessages = async () => {
  const userId = await getUserId()
  return request<Message[]>({
    url: '/foodie-buddy/messages',
    query: { userId }
  })
}

export const markMessagesAsRead = async () => {
  const userId = await getUserId()
  return request<{ success: boolean }>({
    url: '/foodie-buddy/messages/read',
    method: 'POST',
    query: { userId }
  })
}
