// Kanban Types
export interface KanbanAssignee {
  src: string
  name: string
}

export interface KanbanTask {
  id: number
  title: string
  badgeText: string[]
  attachments: number
  comments: number
  assigned: KanbanAssignee[]
  image?: string
  dueDate: Date
}

export interface KanbanColumn {
  id: number
  title: string
  taskIds: number[]
}

export interface KanbanType {
  columns: KanbanColumn[]
  tasks: KanbanTask[]
  currentTaskId?: number
}

// Tipos usados en el slice de kanban
export type TaskType = {
  id: number
  title: string
  badgeText?: string[]
  dueDate?: Date
  attachments?: number
  comments?: number
  assigned?: KanbanAssignee[]
  image?: string
}

export type ColumnType = {
  id: number
  title: string
  taskIds: number[]
} 
