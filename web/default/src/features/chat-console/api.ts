import { isAxiosError } from 'axios'
import { api, getCommonHeaders, getSelf } from '@/lib/api'
import type { ChatCompletionRequest } from '@/features/playground/types'
import type {
  ChatImageGenerationResponse,
  ImageGenerationResponse,
} from './types'

type ApiErrorBody = {
  error?: {
    message?: string
  }
  message?: string
}

type StreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string
      reasoning_content?: string
    }
  }>
}

function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') return fallback
  const body = data as ApiErrorBody
  return body.error?.message || body.message || fallback
}

export async function getChatConsoleSelf() {
  const res = await getSelf()
  return res?.data ?? null
}

export async function sendImageGeneration(
  payload: {
    model: string
    prompt: string
    size: string
    n: number
  },
  signal?: AbortSignal
): Promise<ImageGenerationResponse> {
  const res = await fetch('/pg/images/generations', {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...getCommonHeaders(),
    },
    body: JSON.stringify(payload),
    signal,
  })

  const data = (await res.json().catch(() => ({}))) as ImageGenerationResponse
  if (!res.ok) {
    const message = extractErrorMessage(data, `HTTP ${res.status}`)
    throw new Error(message)
  }

  return data
}

export async function sendChatImageGeneration(
  payload: ChatCompletionRequest,
  signal?: AbortSignal
): Promise<ChatImageGenerationResponse> {
  const res = await fetch('/pg/chat/completions', {
    method: 'POST',
    credentials: 'include',
    headers: getCommonHeaders(),
    body: JSON.stringify(payload),
    signal,
  })

  const data = (await res
    .json()
    .catch(() => ({}))) as ChatImageGenerationResponse
  if (!res.ok) {
    const message = extractErrorMessage(data, `HTTP ${res.status}`)
    throw new Error(message)
  }

  return data
}

export function streamChatCompletion(
  payload: ChatCompletionRequest,
  handlers: {
    onReasoning: (chunk: string) => void
    onContent: (chunk: string) => void
    onComplete: () => void
    onError: (message: string) => void
  }
): () => void {
  const controller = new AbortController()

  void fetch('/pg/chat/completions', {
    method: 'POST',
    credentials: 'include',
    headers: getCommonHeaders(),
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null)
        const message = extractErrorMessage(data, `HTTP ${response.status}`)
        throw new Error(message)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let didComplete = false

      const handlePart = (part: string) => {
        const raw = part
          .split('\n')
          .filter((line) => line.trim().startsWith('data:'))
          .map((line) => line.trim().replace(/^data:\s*/, ''))
          .join('\n')
          .trim()

        if (!raw) return
        if (raw === '[DONE]') {
          if (!didComplete) {
            didComplete = true
            handlers.onComplete()
          }
          return
        }

        const parsed = JSON.parse(raw) as StreamChunk
        const delta = parsed.choices?.[0]?.delta
        if (delta?.reasoning_content) {
          handlers.onReasoning(delta.reasoning_content)
        }
        if (delta?.content) {
          handlers.onContent(delta.content)
        }
      }

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          try {
            handlePart(part)
          } catch {
            throw new Error('Error parsing stream response')
          }
        }
      }

      const tail = decoder.decode()
      if (tail) buffer += tail
      if (buffer.trim()) {
        try {
          handlePart(buffer)
        } catch {
          throw new Error('Error parsing stream response')
        }
      }

      if (!didComplete && !controller.signal.aborted) {
        handlers.onComplete()
      }
    })
    .catch((error: unknown) => {
      if (controller.signal.aborted) return
      const message = error instanceof Error ? error.message : 'Request error'
      handlers.onError(message)
    })

  return () => controller.abort()
}

export async function sendNonStreamingChat(payload: ChatCompletionRequest) {
  try {
    const res = await api.post('/pg/chat/completions', payload, {
      headers: getCommonHeaders(),
      skipErrorHandler: true,
    } as Record<string, unknown>)
    return res.data
  } catch (error) {
    if (isAxiosError(error)) {
      const message = extractErrorMessage(error.response?.data, error.message)
      throw new Error(message, { cause: error })
    }
    throw error
  }
}
