export type Prompt = {
  id: string
  title: string
  description: string
  promptText: string
  category: PromptCategory
  tags: string[]
  models: string[]
  sourceUrl?: string
  creatorId: string
  upvoteCount: number
  saveCount: number
  createdAt: Date
  updatedAt: Date
}

export type PromptCategory =
  | 'coding'
  | 'architecture'
  | 'debugging'
  | 'devops'
  | 'startup'
  | 'writing'
  | 'automation'
  | 'business'

export type User = {
  id: string
  username: string
  email: string
  avatarUrl?: string
  createdAt: Date
}
