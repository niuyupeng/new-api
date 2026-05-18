import type { MessageRole } from '@/features/playground/types'

export type ChatConsoleMode = 'chat' | 'image'

export type ImageGenerationAdapter = 'auto' | 'images' | 'chat'

export type ChatMessageStatus = 'idle' | 'streaming' | 'complete' | 'error'

export interface ChatConsoleMessage {
  id: string
  role: MessageRole
  mode?: ChatConsoleMode
  content: string
  status: ChatMessageStatus
  reasoning?: string
  error?: string
  createdAt: number
}

export interface ChatSession {
  id: string
  title: string
  model: string
  mode: ChatConsoleMode
  messages: ChatConsoleMessage[]
  updatedAt: number
}

export interface ImageArtifact {
  id: string
  prompt: string
  model: string
  size: string
  url: string
  revisedPrompt?: string
  createdAt: number
}

export interface ChatConsoleSettings {
  model: string
  imageModel: string
  imageAdapter: ImageGenerationAdapter
  group: string
  temperature: number
  topP: number
  maxTokens: number
  imageSize: string
  imageCount: number
  imageStyle: string
  negativePrompt: string
  stream: boolean
}

export interface ImageGenerationResponse {
  data?: Array<{
    b64_json?: string
    url?: string
    revised_prompt?: string
  }>
  error?: {
    message?: string
    code?: string
  }
  message?: string
}

export type ChatImageContentPart = {
  type?: string
  text?: string
  image_url?: string | { url?: string }
}

export interface ChatImageGenerationResponse {
  choices?: Array<{
    message?: {
      content?: string | ChatImageContentPart[]
      reasoning_content?: string
    }
  }>
  data?: ImageGenerationResponse['data']
  error?: {
    message?: string
    code?: string
  }
  message?: string
}
