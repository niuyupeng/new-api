import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  Box,
  CheckCircle2,
  Copy,
  CreditCard,
  Download,
  Eraser,
  FileJson,
  FlaskConical,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  Loader2,
  ListTodo,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  ReceiptText,
  Search,
  Send,
  Settings,
  Square,
  Ticket,
  Trash2,
  Users,
  WalletCards,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  getCcapiDisplayName,
  getCcapiLogoForLightSurface,
} from '@/lib/ccapi-brand'
import { formatQuota } from '@/lib/format'
import { ROLE } from '@/lib/roles'
import { cn } from '@/lib/utils'
import { useSystemConfig } from '@/hooks/use-system-config'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Response } from '@/components/ai-elements/response'
import { getUserGroups, getUserModels } from '@/features/playground/api'
import { getTopupInfo } from '@/features/wallet/api'
import {
  getChatConsoleSelf,
  sendChatImageGeneration,
  sendImageGeneration,
  sendNonStreamingChat,
  streamChatCompletion,
} from './api'
import type {
  ChatImageContentPart,
  ChatImageGenerationResponse,
  ChatConsoleMessage,
  ChatConsoleMode,
  ChatConsoleSettings,
  ChatSession,
  ImageArtifact,
  ImageGenerationAdapter,
  ImageGenerationResponse,
} from './types'

interface ChatConsoleProps {
  initialMode?: ChatConsoleMode
}

const STORAGE_KEYS = {
  sessions: 'ccapi_chat_sessions',
  gallery: 'ccapi_chat_gallery',
  settings: 'ccapi_chat_settings',
  defaultChatModel: 'ccapi_default_chat_model',
  defaultImageModel: 'ccapi_default_image_model',
} as const

const ACCOUNT_DEFAULT_GROUP = ''
const DEFAULT_CHAT_MODEL = 'LongCat-Flash-Chat'
const LEGACY_DEFAULT_CHAT_MODEL = 'gpt-5.3-codex-spark'

const DEFAULT_SETTINGS: ChatConsoleSettings = {
  model: DEFAULT_CHAT_MODEL,
  imageModel: 'gpt-image-2',
  imageAdapter: 'auto',
  group: ACCOUNT_DEFAULT_GROUP,
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
  imageSize: '1024x1024',
  imageCount: 1,
  imageStyle: 'product',
  negativePrompt: '',
  stream: true,
}

const QUICK_PROMPTS: Record<ChatConsoleMode, string[]> = {
  chat: [
    '用 Node.js 写一个 ccapi 接入示例',
    '帮我把这段需求拆成 Claude Code 可执行任务',
    '检查这个 API 报错可能是什么原因',
  ],
  image: [
    '生成一张模型补给舱风格的控制台海报',
    '画一个简洁高级的 AI API 工作台界面',
    '做一张 ccapi 开发者接入教程封面图',
  ],
}

const IMAGE_STYLES = [
  { value: 'realistic', label: '写实' },
  { value: 'illustration', label: '插画' },
  { value: 'product', label: '产品图' },
  { value: 'science', label: '科研示意图' },
  { value: 'social', label: '社交媒体图' },
  { value: 'logo', label: 'Logo 草案' },
  { value: 'poster', label: '海报' },
  { value: 'avatar', label: '头像' },
]

const IMAGE_ADAPTERS: Array<{
  value: ImageGenerationAdapter
  label: string
  hint: string
}> = [
  {
    value: 'auto',
    label: '自动识别',
    hint: 'gpt-image / imagen 走 Images；nano banana / Gemini image 走 Chat',
  },
  {
    value: 'images',
    label: 'Images API',
    hint: '/v1/images/generations，适合 gpt-image、dall-e、imagen',
  },
  {
    value: 'chat',
    label: 'Chat 生图',
    hint: '/v1/chat/completions，适合 nano banana、Gemini image preview',
  },
]

const IMAGE_MODEL_PRESETS = [
  'gpt-image-2',
  'gpt-image-1',
  'chatgpt-image-latest',
  'dall-e-3',
  'nano-banana-pro-preview',
  'gemini-2.5-flash-image',
  'gemini-3-pro-image-preview',
  'gemini-3.1-flash-image-preview',
  'imagen-4.0-generate-001',
  'imagen-4.0-fast-generate-001',
] as const

const CHAT_NAV_LINKS = [
  { href: '/', labelKey: '首页' },
  { href: '/pricing', labelKey: '模型广场' },
  { href: '/docs', labelKey: '文档' },
  { href: '/dashboard/overview', labelKey: '控制台首页' },
  { href: '/about', labelKey: '关于' },
] as const

type ChatAccountLink = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  external?: boolean
  adminOnly?: boolean
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

function readText(key: string): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() ?? ''
}

function readSettings(): ChatConsoleSettings {
  const rawLocalChatModel = readText(STORAGE_KEYS.defaultChatModel)
  const localChatModel =
    rawLocalChatModel === LEGACY_DEFAULT_CHAT_MODEL
      ? DEFAULT_CHAT_MODEL
      : rawLocalChatModel
  const localImageModel = readText(STORAGE_KEYS.defaultImageModel)
  const storedSettings = readJson<Partial<ChatConsoleSettings>>(
    STORAGE_KEYS.settings,
    {}
  )
  // Older chat-console builds defaulted to "default", which can be a
  // forbidden token group for paid users. Empty means "use account group".
  if (storedSettings.group === 'default') {
    storedSettings.group = ACCOUNT_DEFAULT_GROUP
  }
  if (storedSettings.model === LEGACY_DEFAULT_CHAT_MODEL) {
    storedSettings.model = DEFAULT_CHAT_MODEL
  }
  return {
    ...DEFAULT_SETTINGS,
    ...storedSettings,
    ...(localChatModel ? { model: localChatModel } : {}),
    ...(localImageModel ? { imageModel: localImageModel } : {}),
  }
}

function createSession(mode: ChatConsoleMode, model: string): ChatSession {
  return {
    id: createId('session'),
    title: 'New chat',
    model,
    mode,
    messages: [],
    updatedAt: Date.now(),
  }
}

function titleFromPrompt(prompt: string): string {
  const cleaned = prompt.replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'New chat'
  return cleaned.length > 26 ? `${cleaned.slice(0, 26)}...` : cleaned
}

function imageToUrl(item: { b64_json?: string; url?: string }): string {
  if (item.url) return item.url
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`
  return ''
}

function isLikelyChatImageModel(model: string): boolean {
  const normalized = model.toLowerCase()
  if (normalized.startsWith('imagen')) return false
  if (normalized.includes('nano-banana')) return true
  if (!normalized.startsWith('gemini-')) return false
  return (
    normalized.includes('image') ||
    normalized.includes('flash-exp-image-generation')
  )
}

function isLikelyImagesEndpointModel(model: string): boolean {
  const normalized = model.toLowerCase()
  return (
    normalized.startsWith('gpt-image') ||
    normalized.startsWith('chatgpt-image') ||
    normalized.startsWith('dall-e') ||
    normalized.startsWith('imagen')
  )
}

function isLikelyImageModelName(model: string): boolean {
  return isLikelyChatImageModel(model) || isLikelyImagesEndpointModel(model)
}

function resolveImageAdapter(
  model: string,
  adapter: ImageGenerationAdapter
): Exclude<ImageGenerationAdapter, 'auto'> {
  if (adapter === 'chat') return 'chat'
  if (adapter === 'images') return 'images'
  return isLikelyChatImageModel(model) ? 'chat' : 'images'
}

function getStyleLabel(value: string): string {
  return IMAGE_STYLES.find((style) => style.value === value)?.label ?? value
}

function buildStyledImagePrompt(
  prompt: string,
  settings: ChatConsoleSettings
): string {
  const lines = [prompt]
  if (settings.imageStyle !== 'product') {
    lines.push(`风格：${getStyleLabel(settings.imageStyle)}`)
  }
  if (settings.negativePrompt.trim()) {
    lines.push(`避免：${settings.negativePrompt.trim()}`)
  }
  return lines.join('\n')
}

function buildChatImagePrompt(
  prompt: string,
  settings: ChatConsoleSettings
): string {
  const lines = [
    buildStyledImagePrompt(prompt, settings),
    '',
    '请直接生成图片，不要只返回文字描述。',
    `目标尺寸或比例：${settings.imageSize}`,
  ]
  if (settings.imageCount > 1) {
    lines.push(`需要生成 ${settings.imageCount} 张候选图。`)
  }
  return lines.join('\n')
}

function parseImageMarkdowns(
  content: string
): Array<{ alt: string; url: string }> {
  const images: Array<{ alt: string; url: string }> = []
  const pattern = /!\[([^\]]*)\]\(([^)]+)\)/g
  for (;;) {
    const match = pattern.exec(content)
    if (!match) break
    images.push({
      alt: match[1] || 'generated image',
      url: match[2],
    })
  }
  return images
}

function parseBareImageUrls(
  content: string
): Array<{ alt: string; url: string }> {
  const images: Array<{ alt: string; url: string }> = []
  const pattern =
    /(data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+|https?:\/\/[^\s)"']+)/g
  for (;;) {
    const match = pattern.exec(content)
    if (!match) break
    images.push({
      alt: 'generated image',
      url: match[1],
    })
  }
  return images
}

function contentPartToImageUrl(part: ChatImageContentPart): string {
  if (typeof part.image_url === 'string') return part.image_url
  return part.image_url?.url ?? ''
}

function chatContentToText(
  content: string | ChatImageContentPart[] | undefined
): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  return content
    .map((part) => {
      if (part.text) return part.text
      const imageUrl = contentPartToImageUrl(part)
      if (!imageUrl) return ''
      return `![image](${imageUrl})`
    })
    .filter(Boolean)
    .join('\n')
}

function artifactsFromImageResponse(
  response: ImageGenerationResponse,
  prompt: string,
  settings: ChatConsoleSettings
): ImageArtifact[] {
  const artifacts: ImageArtifact[] = []
  response.data?.forEach((item) => {
    const url = imageToUrl(item)
    if (!url) return
    artifacts.push({
      id: createId('img'),
      prompt,
      model: settings.imageModel,
      size: settings.imageSize,
      url,
      revisedPrompt: item.revised_prompt,
      createdAt: Date.now(),
    })
  })
  return artifacts
}

function artifactsFromChatImageResponse(
  response: ChatImageGenerationResponse,
  prompt: string,
  settings: ChatConsoleSettings
): ImageArtifact[] {
  const artifacts = artifactsFromImageResponse(response, prompt, settings)
  response.choices?.forEach((choice) => {
    const content = chatContentToText(choice.message?.content)
    const imageMatches = [
      ...parseImageMarkdowns(content),
      ...parseBareImageUrls(content),
    ]
    imageMatches.forEach((image) => {
      if (artifacts.some((artifact) => artifact.url === image.url)) return
      artifacts.push({
        id: createId('img'),
        prompt,
        model: settings.imageModel,
        size: settings.imageSize,
        url: image.url,
        revisedPrompt: image.alt,
        createdAt: Date.now(),
      })
    })
  })
  return artifacts
}

function getChatImageText(response: ChatImageGenerationResponse): string {
  return (
    response.choices
      ?.map((choice) => chatContentToText(choice.message?.content))
      .filter(Boolean)
      .join('\n\n') ?? ''
  )
}

function buildMessages(messages: ChatConsoleMessage[]) {
  return messages
    .filter(
      (message) => message.role === 'user' || message.role === 'assistant'
    )
    .filter((message) => message.mode !== 'image')
    .filter((message) => message.content.trim())
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}

export function ChatConsole(props: ChatConsoleProps) {
  const { t } = useTranslation()
  const { systemName, logo } = useSystemConfig()
  const initialMode = props.initialMode ?? 'chat'
  const stopRef = useRef<(() => void) | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const didApplyInitialModeRef = useRef(false)

  const [mode, setMode] = useState<ChatConsoleMode>(initialMode)
  const [input, setInput] = useState('')
  const [settings, setSettings] = useState<ChatConsoleSettings>(() =>
    readSettings()
  )
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const stored = readJson<ChatSession[]>(STORAGE_KEYS.sessions, [])
    return stored.length > 0
      ? stored.map((session) =>
          session.model === LEGACY_DEFAULT_CHAT_MODEL
            ? { ...session, model: DEFAULT_CHAT_MODEL }
            : session
        )
      : [
          createSession(
            initialMode,
            initialMode === 'image' ? settings.imageModel : settings.model
          ),
        ]
  })
  const [activeSessionId, setActiveSessionId] = useState(() => sessions[0]?.id)
  const [gallery, setGallery] = useState<ImageArtifact[]>(() =>
    readJson(STORAGE_KEYS.gallery, [])
  )
  const [sessionSearch, setSessionSearch] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const activeSession = useMemo(() => {
    return sessions.find((session) => session.id === activeSessionId)
  }, [activeSessionId, sessions])

  const filteredSessions = useMemo(() => {
    const keyword = sessionSearch.trim().toLowerCase()
    if (!keyword) return sessions
    return sessions.filter(
      (session) =>
        session.title.toLowerCase().includes(keyword) ||
        session.model.toLowerCase().includes(keyword)
    )
  }, [sessionSearch, sessions])

  const { data: user } = useQuery({
    queryKey: ['chat-console-self'],
    queryFn: getChatConsoleSelf,
    refetchInterval: 30000,
  })

  const { data: topupInfo } = useQuery({
    queryKey: ['chat-console-topup-info'],
    queryFn: getTopupInfo,
    retry: false,
    select: (response) => response.data ?? null,
  })

  const effectiveModelGroup = useMemo(() => {
    if (settings.group) return settings.group
    return user?.group || undefined
  }, [settings.group, user?.group])

  const {
    data: models = [],
    isLoading: isModelsLoading,
    isError: isModelsError,
  } = useQuery({
    queryKey: ['chat-console-models', effectiveModelGroup ?? 'all'],
    queryFn: () => getUserModels(effectiveModelGroup),
  })

  const { data: groups = [] } = useQuery({
    queryKey: ['chat-console-groups'],
    queryFn: getUserGroups,
  })

  const selectedRequestGroup = useMemo(() => {
    if (!settings.group) return undefined
    const canUseGroup = groups.some((group) => group.value === settings.group)
    return canUseGroup ? settings.group : undefined
  }, [groups, settings.group])

  const imageModelOptions = useMemo(() => {
    const candidates = models
      .filter((model) => isLikelyImageModelName(model.value))
      .map((model) => ({ value: model.value, label: model.label }))
    const presetOptions = IMAGE_MODEL_PRESETS.map((model) => ({
      value: model,
      label: model,
    }))
    const currentOption = {
      value: settings.imageModel,
      label: settings.imageModel,
    }
    const optionMap = new Map<string, { value: string; label: string }>()
    ;[currentOption, ...candidates, ...presetOptions].forEach((option) => {
      if (!option.value.trim()) return
      optionMap.set(option.value, option)
    })
    return Array.from(optionMap.values())
  }, [models, settings.imageModel])

  const isSelectedChatModelAvailable = useMemo(() => {
    return models.some((model) => model.value === settings.model)
  }, [models, settings.model])

  useEffect(() => writeJson(STORAGE_KEYS.sessions, sessions), [sessions])
  useEffect(() => writeJson(STORAGE_KEYS.gallery, gallery), [gallery])
  useEffect(() => writeJson(STORAGE_KEYS.settings, settings), [settings])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [activeSession?.messages, gallery.length])

  useEffect(() => {
    if (models.length === 0) return
    const hasChatModel = models.some((model) => model.value === settings.model)
    if (hasChatModel) return
    setSettings((prev) => ({ ...prev, model: models[0].value }))
  }, [models, settings.model])

  useEffect(() => {
    if (!settings.group || isModelsLoading || models.length > 0) return
    setSettings((prev) => ({ ...prev, group: ACCOUNT_DEFAULT_GROUP }))
  }, [isModelsLoading, models.length, settings.group])

  useEffect(() => {
    if (!settings.group || groups.length === 0) return
    const canUseGroup = groups.some((group) => group.value === settings.group)
    if (canUseGroup) return
    setSettings((prev) => ({ ...prev, group: ACCOUNT_DEFAULT_GROUP }))
  }, [groups, settings.group])

  const updateActiveSession = useCallback(
    (updater: (session: ChatSession) => ChatSession) => {
      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== activeSessionId) return session
          return updater(session)
        })
      )
    },
    [activeSessionId]
  )

  useEffect(() => {
    if (!activeSession?.mode) return
    if (props.initialMode && !didApplyInitialModeRef.current) {
      didApplyInitialModeRef.current = true
      setMode(props.initialMode)
      if (activeSession.mode === props.initialMode) return
      updateActiveSession((session) => ({
        ...session,
        mode: props.initialMode ?? session.mode,
        model:
          props.initialMode === 'image' ? settings.imageModel : settings.model,
        updatedAt: Date.now(),
      }))
      return
    }
    setMode(activeSession.mode)
  }, [
    activeSession?.mode,
    props.initialMode,
    settings.imageModel,
    settings.model,
    updateActiveSession,
  ])

  const handleNewSession = useCallback(
    (nextMode: ChatConsoleMode = mode) => {
      const model = nextMode === 'image' ? settings.imageModel : settings.model
      const session = createSession(nextMode, model)
      setSessions((prev) => [session, ...prev])
      setActiveSessionId(session.id)
      setMode(nextMode)
    },
    [mode, settings.imageModel, settings.model]
  )

  const appendMessage = useCallback(
    (message: ChatConsoleMessage) => {
      const messageMode = message.mode ?? mode
      updateActiveSession((session) => ({
        ...session,
        title:
          session.messages.length === 0 && message.role === 'user'
            ? titleFromPrompt(message.content)
            : session.title,
        messages: [...session.messages, message],
        mode: messageMode,
        model: messageMode === 'image' ? settings.imageModel : settings.model,
        updatedAt: Date.now(),
      }))
    },
    [mode, settings.imageModel, settings.model, updateActiveSession]
  )

  const updateMessage = useCallback(
    (
      id: string,
      updater: (message: ChatConsoleMessage) => ChatConsoleMessage
    ) => {
      updateActiveSession((session) => ({
        ...session,
        messages: session.messages.map((message) => {
          if (message.id !== id) return message
          return updater(message)
        }),
        updatedAt: Date.now(),
      }))
    },
    [updateActiveSession]
  )

  const handleStop = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    if (activeSessionId) {
      updateActiveSession((session) => ({
        ...session,
        messages: session.messages.map((message) =>
          message.status === 'streaming'
            ? {
                ...message,
                status: 'error',
                error: t('Generation stopped by user.'),
              }
            : message
        ),
        updatedAt: Date.now(),
      }))
    }
    setIsGenerating(false)
  }, [activeSessionId, t, updateActiveSession])

  const handleDeleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((session) => session.id !== id)
        if (next.length === 0) {
          const fallbackModel =
            mode === 'image' ? settings.imageModel : settings.model
          const session = createSession(mode, fallbackModel)
          setActiveSessionId(session.id)
          return [session]
        }
        if (id === activeSessionId) {
          setActiveSessionId(next[0].id)
        }
        return next
      })
    },
    [activeSessionId, mode, settings.imageModel, settings.model]
  )

  const handleRenameSession = useCallback(
    (id: string) => {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === id
            ? {
                ...session,
                title: titleFromPrompt(
                  window.prompt(t('Rename session'), session.title) ??
                    session.title
                ),
                updatedAt: Date.now(),
              }
            : session
        )
      )
    },
    [t]
  )

  const handleChatSubmit = useCallback(
    async (prompt: string) => {
      if (!activeSession || isGenerating) return
      if (isModelsLoading) {
        toast.error(t('Checking API'))
        return
      }
      if (!isModelsLoading && models.length === 0) {
        toast.error(
          t('No available chat models. Add a channel and enable a model first.')
        )
        return
      }
      if (!isSelectedChatModelAvailable) {
        toast.error(
          t('No available chat models. Add a channel and enable a model first.')
        )
        return
      }

      const userMessage: ChatConsoleMessage = {
        id: createId('msg'),
        role: 'user',
        mode: 'chat',
        content: prompt,
        status: 'complete',
        createdAt: Date.now(),
      }
      const assistantId = createId('msg')
      const assistantMessage: ChatConsoleMessage = {
        id: assistantId,
        role: 'assistant',
        mode: 'chat',
        content: '',
        reasoning: '',
        status: settings.stream ? 'streaming' : 'idle',
        createdAt: Date.now(),
      }

      const nextMessages = [...activeSession.messages, userMessage]
      appendMessage(userMessage)
      appendMessage(assistantMessage)
      setIsGenerating(true)

      const payload = {
        model: settings.model,
        group: selectedRequestGroup,
        messages: buildMessages(nextMessages),
        stream: settings.stream,
        temperature: settings.temperature,
        top_p: settings.topP,
        max_tokens: settings.maxTokens,
      }

      if (settings.stream) {
        stopRef.current = streamChatCompletion(payload, {
          onReasoning: (chunk) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              reasoning: `${message.reasoning ?? ''}${chunk}`,
              status: 'streaming',
            }))
          },
          onContent: (chunk) => {
            updateMessage(assistantId, (message) => ({
              ...message,
              content: `${message.content}${chunk}`,
              status: 'streaming',
            }))
          },
          onComplete: () => {
            updateMessage(assistantId, (message) => ({
              ...message,
              status: 'complete',
            }))
            stopRef.current = null
            setIsGenerating(false)
          },
          onError: (message) => {
            updateMessage(assistantId, (current) => ({
              ...current,
              status: 'error',
              error: message,
            }))
            stopRef.current = null
            setIsGenerating(false)
          },
        })
        return
      }

      try {
        const response = await sendNonStreamingChat(payload)
        const content = response?.choices?.[0]?.message?.content ?? ''
        const reasoning = response?.choices?.[0]?.message?.reasoning_content
        updateMessage(assistantId, (message) => ({
          ...message,
          content,
          reasoning,
          status: 'complete',
        }))
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Request error'
        updateMessage(assistantId, (current) => ({
          ...current,
          status: 'error',
          error: message,
        }))
      } finally {
        setIsGenerating(false)
      }
    },
    [
      activeSession,
      appendMessage,
      isGenerating,
      isModelsLoading,
      isSelectedChatModelAvailable,
      models.length,
      settings.maxTokens,
      settings.model,
      selectedRequestGroup,
      settings.stream,
      settings.temperature,
      settings.topP,
      updateMessage,
      t,
    ]
  )

  const handleImageSubmit = useCallback(
    async (prompt: string) => {
      if (isGenerating) return
      const userMessage: ChatConsoleMessage = {
        id: createId('msg'),
        role: 'user',
        mode: 'image',
        content: prompt,
        status: 'complete',
        createdAt: Date.now(),
      }
      const assistantId = createId('msg')
      const assistantMessage: ChatConsoleMessage = {
        id: assistantId,
        role: 'assistant',
        mode: 'image',
        content: t('Generating image...'),
        status: 'streaming',
        createdAt: Date.now(),
      }
      const controller = new AbortController()
      stopRef.current = () => controller.abort()
      setIsGenerating(true)
      appendMessage(userMessage)
      appendMessage(assistantMessage)

      try {
        const adapter = resolveImageAdapter(
          settings.imageModel,
          settings.imageAdapter
        )
        let artifacts: ImageArtifact[] = []
        let fallbackText = ''

        if (adapter === 'chat') {
          const response = await sendChatImageGeneration(
            {
              model: settings.imageModel,
              group: selectedRequestGroup,
              messages: [
                {
                  role: 'user',
                  content: buildChatImagePrompt(prompt, settings),
                },
              ],
              stream: false,
              temperature: settings.temperature,
              top_p: settings.topP,
              max_tokens: settings.maxTokens,
            },
            controller.signal
          )
          artifacts = artifactsFromChatImageResponse(response, prompt, settings)
          fallbackText = getChatImageText(response)
        } else {
          const response = await sendImageGeneration(
            {
              model: settings.imageModel,
              size: settings.imageSize,
              n: settings.imageCount,
              prompt: buildStyledImagePrompt(prompt, settings),
            },
            controller.signal
          )
          artifacts = artifactsFromImageResponse(response, prompt, settings)
        }

        if (artifacts.length === 0) {
          if (fallbackText.trim()) {
            throw new Error(
              `模型返回了文本，但没有返回可展示的图片。返回内容：${fallbackText.slice(0, 180)}`
            )
          }
          throw new Error(
            adapter === 'chat'
              ? 'Chat 生图模型没有返回图片数据，请确认该模型支持图片输出。'
              : 'Images API 没有返回图片数据，请确认该模型支持 /images/generations。'
          )
        }

        setGallery((prev) => [...artifacts, ...prev])
        updateMessage(assistantId, (message) => ({
          ...message,
          content: artifacts
            .map(
              (artifact, index) =>
                `![${artifact.prompt} ${index + 1}](${artifact.url})`
            )
            .join('\n\n'),
          status: 'complete',
        }))
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        const message = error instanceof Error ? error.message : 'Request error'
        updateMessage(assistantId, (current) => ({
          ...current,
          content: message,
          status: 'error',
          error: message,
        }))
        toast.error(message)
      } finally {
        if (stopRef.current) {
          stopRef.current = null
        }
        setIsGenerating(false)
      }
    },
    [
      appendMessage,
      isGenerating,
      selectedRequestGroup,
      settings,
      t,
      updateMessage,
    ]
  )

  const handleRegenerate = useCallback(() => {
    const messages = activeSession?.messages ?? []
    const lastUser = [...messages]
      .reverse()
      .find((message) => message.role === 'user')
    if (!lastUser) return
    if ((lastUser.mode ?? mode) === 'image') {
      void handleImageSubmit(lastUser.content)
      return
    }
    void handleChatSubmit(lastUser.content)
  }, [activeSession?.messages, handleChatSubmit, handleImageSubmit, mode])

  const handleExportSessions = useCallback(() => {
    const blob = new Blob([JSON.stringify({ sessions, gallery }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ccapi-sessions-${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [gallery, sessions])

  const handleSubmit = useCallback(() => {
    const prompt = input.trim()
    if (!prompt || isGenerating) return
    setInput('')
    if (mode === 'image') {
      void handleImageSubmit(prompt)
      return
    }
    void handleChatSubmit(prompt)
  }, [handleChatSubmit, handleImageSubmit, input, isGenerating, mode])

  const handleModeChange = useCallback(
    (nextMode: ChatConsoleMode) => {
      setMode(nextMode)
      updateActiveSession((session) => ({
        ...session,
        mode: nextMode,
        model: nextMode === 'image' ? settings.imageModel : settings.model,
        updatedAt: Date.now(),
      }))
    },
    [settings.imageModel, settings.model, updateActiveSession]
  )

  const balance = Number(user?.quota ?? 0)
  const used = Number(user?.used_quota ?? 0)
  let apiStatus = t('Checking API')
  let ApiStatusIcon = Loader2
  let apiStatusTone: 'muted' | 'ok' | 'warning' = 'muted'
  if (isModelsError) {
    apiStatus = t('Models request failed')
    ApiStatusIcon = AlertCircle
    apiStatusTone = 'warning'
  } else if (!isModelsLoading && models.length > 0) {
    apiStatus = t('API ready')
    ApiStatusIcon = CheckCircle2
    apiStatusTone = 'ok'
  } else if (!isModelsLoading) {
    apiStatus = t('No models configured')
    ApiStatusIcon = AlertCircle
    apiStatusTone = 'warning'
  }
  const selectedModel = mode === 'image' ? settings.imageModel : settings.model
  const selectedModeLabel = mode === 'image' ? t('Image') : t('Chat')
  const resolvedImageAdapter = resolveImageAdapter(
    settings.imageModel,
    settings.imageAdapter
  )
  const activeImageAdapter = IMAGE_ADAPTERS.find(
    (adapter) => adapter.value === settings.imageAdapter
  )
  const purchaseCodeHref =
    topupInfo?.topup_link?.trim() || '/wallet#wallet-add-funds'
  const isPurchaseCodeExternal = /^https?:\/\//i.test(purchaseCodeHref)
  const displayName = getCcapiDisplayName(systemName)
  const displayLogo = getCcapiLogoForLightSurface(logo, { forceBrand: true })
  const isAdmin = (user?.role ?? 0) >= ROLE.ADMIN
  const accountLinks = useMemo<ChatAccountLink[]>(
    () => [
      {
        href: '/wallet',
        label: t('Wallet'),
        icon: WalletCards,
      },
      {
        href: '/wallet#wallet-add-funds',
        label: t('Recharge'),
        icon: CreditCard,
      },
      {
        href: purchaseCodeHref,
        label: t('Buy redemption code'),
        icon: Ticket,
        external: isPurchaseCodeExternal,
      },
      {
        href: '/wallet?show_history=true',
        label: t('Order History'),
        icon: ReceiptText,
      },
    ],
    [isPurchaseCodeExternal, purchaseCodeHref, t]
  )
  const consoleLinks = useMemo<ChatAccountLink[]>(
    () =>
      [
        {
          href: '/dashboard/overview',
          label: t('Overview'),
          icon: Activity,
        },
        {
          href: '/dashboard/models',
          label: t('Dashboard'),
          icon: LayoutDashboard,
        },
        {
          href: '/playground',
          label: t('Playground'),
          icon: FlaskConical,
        },
        {
          href: '/keys',
          label: t('API Keys'),
          icon: KeyRound,
        },
        {
          href: '/usage-logs/common',
          label: t('Usage Logs'),
          icon: ReceiptText,
        },
        {
          href: '/usage-logs/task',
          label: t('Task Logs'),
          icon: ListTodo,
        },
        {
          href: '/channels',
          label: t('Channels'),
          icon: Radio,
          adminOnly: true,
        },
        {
          href: '/models/metadata',
          label: t('Models'),
          icon: Box,
          adminOnly: true,
        },
        {
          href: '/users',
          label: t('Users'),
          icon: Users,
          adminOnly: true,
        },
        {
          href: '/redemption-codes',
          label: t('Redemption Codes'),
          icon: Ticket,
          adminOnly: true,
        },
        {
          href: '/subscriptions',
          label: t('Subscription Management'),
          icon: CreditCard,
          adminOnly: true,
        },
        {
          href: '/system-settings/site',
          label: t('System Settings'),
          icon: Settings,
          adminOnly: true,
        },
      ].filter((link) => !link.adminOnly || isAdmin),
    [isAdmin, t]
  )

  return (
    <main className='bg-background text-foreground selection:text-foreground h-dvh overflow-hidden selection:bg-orange-400/25'>
      <div className='grid h-dvh grid-cols-1 lg:grid-cols-[268px_minmax(0,1fr)]'>
        <aside className='border-border bg-card text-foreground hidden h-dvh flex-col shadow-[8px_0_40px_rgba(61,37,20,0.05)] lg:flex lg:border-r'>
          <div className='flex items-center justify-between gap-3 px-4 pt-4 pb-3'>
            <div className='flex min-w-0 items-center gap-2.5'>
              <img
                src={displayLogo}
                alt={t('Logo')}
                className='size-8 shrink-0 rounded-xl object-contain'
              />
              <div className='min-w-0'>
                <h1 className='text-foreground text-[21px] font-semibold tracking-tight'>
                  {displayName}
                </h1>
                <p className='text-muted-foreground text-xs font-medium'>
                  {t('Chat and images')}
                </p>
              </div>
            </div>
            <Button
              size='icon'
              variant='ghost'
              className='text-foreground hover:bg-accent hover:text-foreground size-9 rounded-xl transition'
              onClick={() => handleNewSession(mode)}
              aria-label={t('New chat')}
            >
              <Plus className='size-4' />
            </Button>
          </div>

          <div className='px-4 pb-3'>
            <label className='border-border bg-card text-foreground flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm shadow-sm transition focus-within:border-orange-400 focus-within:ring-3 focus-within:ring-orange-400/15'>
              <Search className='text-muted-foreground size-4' />
              <input
                value={sessionSearch}
                onChange={(event) => setSessionSearch(event.target.value)}
                placeholder={t('Search sessions')}
                className='placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent outline-none'
              />
            </label>
          </div>

          <nav
            className='grid grid-cols-2 gap-1.5 px-4 pb-3'
            aria-label={t('Main navigation')}
          >
            {CHAT_NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className='text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl px-3 py-2 text-sm font-medium transition'
              >
                {t(link.labelKey)}
              </a>
            ))}
          </nav>

          <div className='px-4 pb-3'>
            <p className='text-muted-foreground mb-2 px-1 text-[11px] font-medium tracking-wide uppercase'>
              {t('Personal')}
            </p>
            <AccountLinks links={accountLinks} />
          </div>

          <div className='px-4 pb-3'>
            <p className='text-muted-foreground mb-2 px-1 text-[11px] font-medium tracking-wide uppercase'>
              {t('Console')}
            </p>
            <AccountLinks links={consoleLinks} />
          </div>

          <div className='flex-1 space-y-1 overflow-y-auto px-2 pb-4'>
            {filteredSessions.map((session) => {
              const SessionIcon =
                session.mode === 'image' ? ImageIcon : MessageSquare
              return (
                <div
                  key={session.id}
                  className={cn(
                    'group text-foreground flex w-full items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left transition',
                    'hover:bg-muted',
                    session.id === activeSessionId &&
                      'bg-muted text-foreground ring-1 ring-orange-400/35'
                  )}
                >
                  <button
                    className='min-w-0 flex-1 text-left'
                    onClick={() => setActiveSessionId(session.id)}
                    type='button'
                  >
                    <div className='flex items-center gap-2'>
                      <SessionIcon className='text-muted-foreground size-4 shrink-0' />
                      <span className='truncate text-sm font-medium'>
                        {session.title === 'New chat'
                          ? t('New chat')
                          : session.title}
                      </span>
                    </div>
                    <p className='text-muted-foreground mt-0.5 truncate text-xs'>
                      {session.model}
                    </p>
                  </button>
                  <button
                    type='button'
                    className='text-muted-foreground hover:bg-accent hover:text-foreground rounded-md p-1 opacity-0 transition group-hover:opacity-100'
                    onClick={() => handleRenameSession(session.id)}
                    aria-label={t('Rename session')}
                  >
                    <Pencil className='size-3.5' />
                  </button>
                  <button
                    type='button'
                    className='text-muted-foreground hover:bg-accent rounded-md p-1 opacity-0 transition group-hover:opacity-100 hover:text-red-600'
                    onClick={() => handleDeleteSession(session.id)}
                    aria-label={t('Delete session')}
                  >
                    <Trash2 className='size-3.5' />
                  </button>
                </div>
              )
            })}
          </div>

          <div className='border-border mt-auto border-t p-3'>
            <div className='grid grid-cols-2 gap-2'>
              <Button
                variant='ghost'
                className='text-muted-foreground hover:bg-muted hover:text-foreground h-9 justify-center rounded-xl text-xs transition'
                onClick={handleExportSessions}
              >
                <FileJson className='size-4' />
                {t('Export')}
              </Button>
              <Button
                variant='ghost'
                className='text-muted-foreground hover:bg-muted hover:text-foreground h-9 justify-center rounded-xl text-xs transition'
                onClick={() => {
                  setGallery([])
                  toast.success(t('Gallery cleared'))
                }}
              >
                <Eraser className='size-4' />
                {t('Clear images')}
              </Button>
            </div>
          </div>
        </aside>

        <section className='bg-background relative flex h-dvh min-h-0 flex-col overflow-hidden'>
          <div className='border-border bg-card/92 relative flex min-h-16 items-center justify-between gap-3 border-b px-3 py-2 backdrop-blur sm:px-4'>
            <div className='flex min-w-0 flex-1 items-center gap-3'>
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <Button
                  size='icon'
                  variant='ghost'
                  className='text-foreground hover:bg-accent hover:text-foreground size-9 rounded-xl lg:hidden'
                  onClick={() => setIsMobileMenuOpen(true)}
                  aria-label={t('Open session menu')}
                >
                  <Menu className='size-5' />
                </Button>
                <SheetContent
                  side='left'
                  className='border-border bg-card text-foreground w-[300px] p-0 sm:max-w-[320px]'
                >
                  <SheetHeader className='border-border border-b p-4 text-left'>
                    <div className='flex min-w-0 items-center gap-2.5'>
                      <img
                        src={displayLogo}
                        alt={t('Logo')}
                        className='size-8 shrink-0 rounded-xl object-contain'
                      />
                      <div className='min-w-0'>
                        <SheetTitle className='text-foreground truncate text-xl font-semibold'>
                          {displayName}
                        </SheetTitle>
                        <SheetDescription className='text-muted-foreground text-xs'>
                          {t('Chat and images')}
                        </SheetDescription>
                      </div>
                    </div>
                  </SheetHeader>
                  <div className='flex flex-1 flex-col overflow-hidden'>
                    <div className='p-3'>
                      <Button
                        className='bg-foreground text-background hover:bg-foreground/90 hover:text-background h-10 w-full justify-start rounded-2xl'
                        onClick={() => {
                          handleNewSession(mode)
                          setIsMobileMenuOpen(false)
                        }}
                      >
                        <Plus className='size-4' />
                        {t('New chat')}
                      </Button>
                    </div>
                    <div className='px-3 pb-3'>
                      <label className='border-border bg-card text-foreground flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm'>
                        <Search className='text-muted-foreground size-4' />
                        <input
                          value={sessionSearch}
                          onChange={(event) =>
                            setSessionSearch(event.target.value)
                          }
                          placeholder={t('Search sessions')}
                          className='placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent outline-none'
                        />
                      </label>
                    </div>
                    <nav
                      className='grid grid-cols-2 gap-1.5 px-3 pb-3'
                      aria-label={t('Main navigation')}
                    >
                      {CHAT_NAV_LINKS.map((link) => (
                        <a
                          key={link.href}
                          href={link.href}
                          className='text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl px-3 py-2 text-sm font-medium transition'
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {t(link.labelKey)}
                        </a>
                      ))}
                    </nav>
                    <div className='px-3 pb-3'>
                      <p className='text-muted-foreground mb-2 px-1 text-[11px] font-medium tracking-wide uppercase'>
                        {t('Personal')}
                      </p>
                      <AccountLinks
                        links={accountLinks}
                        onNavigate={() => setIsMobileMenuOpen(false)}
                      />
                    </div>
                    <div className='px-3 pb-3'>
                      <p className='text-muted-foreground mb-2 px-1 text-[11px] font-medium tracking-wide uppercase'>
                        {t('Console')}
                      </p>
                      <AccountLinks
                        links={consoleLinks}
                        onNavigate={() => setIsMobileMenuOpen(false)}
                      />
                    </div>
                    <div className='flex-1 space-y-1 overflow-y-auto px-2 pb-4'>
                      {filteredSessions.map((session) => {
                        const SessionIcon =
                          session.mode === 'image' ? ImageIcon : MessageSquare
                        return (
                          <button
                            key={session.id}
                            className={cn(
                              'text-foreground hover:bg-muted flex w-full items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left transition',
                              session.id === activeSessionId &&
                                'bg-muted text-foreground ring-1 ring-orange-400/35'
                            )}
                            type='button'
                            onClick={() => {
                              setActiveSessionId(session.id)
                              setIsMobileMenuOpen(false)
                            }}
                          >
                            <SessionIcon className='text-muted-foreground size-4 shrink-0' />
                            <span className='min-w-0 flex-1'>
                              <span className='block truncate text-sm font-medium'>
                                {session.title === 'New chat'
                                  ? t('New chat')
                                  : session.title}
                              </span>
                              <span className='text-muted-foreground block truncate text-xs'>
                                {session.model}
                              </span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    <div className='border-border mt-auto grid grid-cols-2 gap-2 border-t p-3'>
                      <Button
                        variant='ghost'
                        className='text-muted-foreground hover:bg-muted hover:text-foreground h-9 justify-center rounded-lg text-xs'
                        onClick={handleExportSessions}
                      >
                        <FileJson className='size-4' />
                        {t('Export')}
                      </Button>
                      <Button
                        variant='ghost'
                        className='text-muted-foreground hover:bg-muted hover:text-foreground h-9 justify-center rounded-lg text-xs'
                        onClick={() => {
                          setGallery([])
                          toast.success(t('Gallery cleared'))
                        }}
                      >
                        <Eraser className='size-4' />
                        {t('Clear images')}
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <div className='min-w-0 flex-1 sm:flex-none'>
                <div className='flex min-w-0 items-center gap-2'>
                  <h2 className='text-foreground max-w-[52vw] truncate text-base font-semibold sm:max-w-[34vw] lg:max-w-[420px]'>
                    {activeSession?.title === 'New chat'
                      ? t('New chat')
                      : (activeSession?.title ?? t('New chat'))}
                  </h2>
                  <span className='bg-muted text-muted-foreground ring-border rounded-full px-2 py-0.5 text-xs ring-1'>
                    {selectedModeLabel}
                  </span>
                </div>
                <p className='text-muted-foreground hidden truncate text-xs sm:block'>
                  {t('Chat and images stay in the same conversation.')}
                </p>
                <select
                  value={selectedModel}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      ...(mode === 'image'
                        ? { imageModel: event.target.value }
                        : { model: event.target.value }),
                    }))
                  }
                  disabled={
                    mode === 'chat' && (isModelsLoading || models.length === 0)
                  }
                  className='border-border bg-card text-muted-foreground mt-1 block w-full max-w-[calc(100vw-5.5rem)] rounded-lg border px-2 py-1 text-xs outline-none focus:border-orange-400 sm:hidden'
                >
                  {mode === 'image' ? (
                    imageModelOptions.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))
                  ) : models.length === 0 ? (
                    <option value={settings.model}>{settings.model}</option>
                  ) : (
                    models.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <select
                value={selectedModel}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    ...(mode === 'image'
                      ? { imageModel: event.target.value }
                      : { model: event.target.value }),
                  }))
                }
                disabled={
                  mode === 'chat' && (isModelsLoading || models.length === 0)
                }
                className='border-border bg-card text-muted-foreground hidden max-w-[240px] rounded-xl border px-2.5 py-1.5 text-sm transition outline-none focus:border-orange-400 sm:block'
              >
                {mode === 'image' ? (
                  imageModelOptions.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))
                ) : models.length === 0 ? (
                  <option value={settings.model}>{settings.model}</option>
                ) : (
                  models.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))
                )}
              </select>
            </div>
            <nav
              className='bg-muted/80 ring-border hidden items-center gap-1 rounded-full p-1 ring-1 xl:flex'
              aria-label={t('Main navigation')}
            >
              {CHAT_NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className='text-muted-foreground hover:bg-foreground hover:text-background rounded-full px-3 py-1.5 text-xs font-medium transition'
                >
                  {t(link.labelKey)}
                </a>
              ))}
            </nav>
            <a
              href='/wallet#wallet-add-funds'
              className='border-border bg-card/85 text-muted-foreground hover:bg-muted hover:text-foreground hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition hover:border-orange-400/45 md:inline-flex'
            >
              <CreditCard className='size-3.5 text-orange-400' />
              {t('Recharge')}
            </a>
            <a
              href={purchaseCodeHref}
              target={isPurchaseCodeExternal ? '_blank' : undefined}
              rel={isPurchaseCodeExternal ? 'noopener noreferrer' : undefined}
              className='border-border bg-card/85 text-muted-foreground hover:bg-muted hover:text-foreground hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition hover:border-orange-400/45 2xl:inline-flex'
            >
              <Ticket className='size-3.5 text-orange-400' />
              {t('Buy redemption code')}
            </a>
            <div className='hidden gap-2 text-xs md:flex'>
              <StatusPill
                icon={ApiStatusIcon}
                label={apiStatus}
                spinning={isModelsLoading}
                tone={apiStatusTone}
              />
              <StatusPill icon={KeyRound} label={formatQuota(balance)} />
              <StatusPill
                icon={Activity}
                label={`${t('Used')} ${formatQuota(used)}`}
              />
            </div>
          </div>

          <div className='relative flex-1 overflow-y-auto'>
            <div className='mx-auto flex min-h-full max-w-3xl flex-col gap-1 px-3 py-5 sm:px-4 sm:py-8'>
              {activeSession?.messages.length ? (
                activeSession.messages.map((message) => (
                  <ChatBubble
                    key={message.id}
                    message={message}
                    onRegenerate={handleRegenerate}
                  />
                ))
              ) : (
                <EmptyState
                  mode={mode}
                  onPrompt={(prompt) => {
                    setInput(prompt)
                  }}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className='border-border/80 bg-card/95 border-t px-2 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:px-3 sm:pt-3 sm:pb-5'>
            <div className='mx-auto max-w-3xl'>
              <details className='border-border bg-card/90 text-muted-foreground mb-2 overflow-hidden rounded-2xl border px-3 py-2 text-sm shadow-sm transition open:border-orange-400/35'>
                <summary className='cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap outline-none select-none'>
                  {t('Advanced settings')}
                  <span className='text-muted-foreground ml-2 text-xs'>
                    {mode === 'image'
                      ? `${t('Image generation')} · ${resolvedImageAdapter}`
                      : selectedModel}
                  </span>
                </summary>
                <div className='mt-3 grid gap-3 md:grid-cols-3'>
                  <SimpleField label={t('Chat model')}>
                    <select
                      value={settings.model}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          model: event.target.value,
                        }))
                      }
                      disabled={isModelsLoading || models.length === 0}
                      className='border-border bg-card text-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    >
                      {models.length === 0 ? (
                        <option value={settings.model}>{settings.model}</option>
                      ) : (
                        models.map((model) => (
                          <option key={model.value} value={model.value}>
                            {model.label}
                          </option>
                        ))
                      )}
                    </select>
                  </SimpleField>
                  <SimpleField label={t('Temperature')}>
                    <input
                      type='number'
                      min={0}
                      max={2}
                      step={0.1}
                      value={settings.temperature}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          temperature: Number(event.target.value),
                        }))
                      }
                      className='border-border bg-card text-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    />
                  </SimpleField>
                  <SimpleField label='Top P'>
                    <input
                      type='number'
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.topP}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          topP: Number(event.target.value),
                        }))
                      }
                      className='border-border bg-card text-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    />
                  </SimpleField>
                  <SimpleField label={t('Max tokens')}>
                    <input
                      type='number'
                      min={256}
                      max={128000}
                      value={settings.maxTokens}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          maxTokens: Number(event.target.value),
                        }))
                      }
                      className='border-border bg-card text-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    />
                  </SimpleField>
                  <SimpleField label={t('Group')}>
                    <select
                      value={settings.group}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          group: event.target.value,
                        }))
                      }
                      className='border-border bg-card text-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    >
                      <option value={ACCOUNT_DEFAULT_GROUP}>
                        {t('Account default')}
                      </option>
                      {groups.map((group) => (
                        <option key={group.value} value={group.value}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                  </SimpleField>
                  <SimpleField label='Stream'>
                    <label className='border-border bg-card text-foreground flex h-9 items-center gap-2 rounded-lg border px-2'>
                      <input
                        type='checkbox'
                        checked={settings.stream}
                        onChange={(event) =>
                          setSettings((prev) => ({
                            ...prev,
                            stream: event.target.checked,
                          }))
                        }
                        className='accent-orange-500'
                      />
                      <span className='text-sm'>{t('Streaming')}</span>
                    </label>
                  </SimpleField>
                  <SimpleField label={t('Image endpoint')}>
                    <select
                      value={settings.imageAdapter}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          imageAdapter: event.target
                            .value as ImageGenerationAdapter,
                        }))
                      }
                      className='border-border bg-card text-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    >
                      {IMAGE_ADAPTERS.map((adapter) => (
                        <option key={adapter.value} value={adapter.value}>
                          {t(adapter.label)}
                        </option>
                      ))}
                    </select>
                  </SimpleField>
                  <SimpleField label={t('Image model')}>
                    <input
                      list='ccapi-image-models'
                      value={settings.imageModel}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          imageModel: event.target.value,
                        }))
                      }
                      className='border-border bg-card text-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    />
                    <datalist id='ccapi-image-models'>
                      {imageModelOptions.map((model) => (
                        <option key={model.value} value={model.value}>
                          {model.label}
                        </option>
                      ))}
                    </datalist>
                  </SimpleField>
                  <SimpleField label={t('Image size')}>
                    <select
                      value={settings.imageSize}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          imageSize: event.target.value,
                        }))
                      }
                      className='border-border bg-card text-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    >
                      <option value='1024x1024'>1024x1024</option>
                      <option value='1024x1536'>1024x1536</option>
                      <option value='1536x1024'>1536x1024</option>
                    </select>
                  </SimpleField>
                  <SimpleField label={t('Image count')}>
                    <select
                      value={settings.imageCount}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          imageCount: Number(event.target.value),
                        }))
                      }
                      className='border-border bg-card text-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    >
                      {[1, 2, 3, 4].map((count) => (
                        <option key={count} value={count}>
                          {count}
                        </option>
                      ))}
                    </select>
                  </SimpleField>
                  <SimpleField label={t('Image style')}>
                    <select
                      value={settings.imageStyle}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          imageStyle: event.target.value,
                        }))
                      }
                      className='border-border bg-card text-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    >
                      {IMAGE_STYLES.map((style) => (
                        <option key={style.value} value={style.value}>
                          {t(style.label)}
                        </option>
                      ))}
                    </select>
                  </SimpleField>
                  <SimpleField label={t('Negative prompt')}>
                    <input
                      value={settings.negativePrompt}
                      onChange={(event) =>
                        setSettings((prev) => ({
                          ...prev,
                          negativePrompt: event.target.value,
                        }))
                      }
                      placeholder={t('Things to avoid in the image')}
                      className='border-border bg-card text-foreground placeholder:text-muted-foreground w-full rounded-lg border px-2 py-1 focus:border-orange-400'
                    />
                  </SimpleField>
                </div>
              </details>
            </div>
            <div className='border-border bg-card mx-auto max-w-3xl rounded-[22px] border p-2 shadow-[0_24px_80px_rgba(91,58,34,0.12)] transition focus-within:border-orange-400/55 focus-within:ring-4 focus-within:ring-orange-400/10 sm:rounded-[30px]'>
              <div className='text-muted-foreground flex items-center justify-between px-2 pb-1 text-xs'>
                <span className='truncate'>
                  {mode === 'image'
                    ? `${t('Images will be generated inside this conversation')} · ${t(
                        activeImageAdapter?.hint ?? 'Auto select image endpoint'
                      )}`
                    : t('ChatGPT style chat with streaming output')}
                </span>
                <span className='ml-3 max-w-[45%] truncate'>
                  {selectedModel}
                </span>
              </div>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' || event.shiftKey) return
                  event.preventDefault()
                  handleSubmit()
                }}
                placeholder={
                  mode === 'image'
                    ? t('Describe what you want to generate')
                    : t('Type a message')
                }
                className='text-foreground placeholder:text-muted-foreground min-h-20 resize-none border-0 bg-transparent text-base leading-7 shadow-none focus-visible:ring-0 sm:min-h-24'
                disabled={isGenerating}
              />
              <div className='flex flex-wrap items-center justify-between gap-3 pt-2'>
                <div className='flex flex-wrap gap-2'>
                  <ModeButton
                    active={mode === 'chat'}
                    icon={MessageSquare}
                    label={t('Chat')}
                    onClick={() => handleModeChange('chat')}
                  />
                  <ModeButton
                    active={mode === 'image'}
                    icon={ImageIcon}
                    label={t('Image')}
                    onClick={() => handleModeChange('image')}
                  />
                  <ModeButton
                    active={false}
                    icon={Radio}
                    label={t('Tools')}
                    onClick={() => toast.info(t('Feature in development'))}
                  />
                </div>

                {isGenerating ? (
                  <Button
                    onClick={handleStop}
                    className='bg-foreground text-background hover:bg-foreground/90 hover:text-background rounded-full shadow-sm transition'
                  >
                    <Square className='size-4 fill-current' />
                    {t('Stop')}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!input.trim()}
                    className='bg-foreground text-background hover:bg-foreground/90 hover:text-background disabled:bg-muted disabled:text-muted-foreground rounded-full shadow-sm transition'
                  >
                    <Send className='size-4' />
                    {t('Send')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function AccountLinks(props: {
  links: ChatAccountLink[]
  onNavigate?: () => void
}) {
  const { t } = useTranslation()

  return (
    <nav
      className='grid grid-cols-2 gap-1.5'
      aria-label={t('Account navigation')}
    >
      {props.links.map((link) => {
        const Icon = link.icon
        return (
          <a
            key={`${link.label}-${link.href}`}
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            onClick={props.onNavigate}
            className='group text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium transition'
          >
            <Icon className='size-4 shrink-0 text-orange-400 transition group-hover:text-orange-400' />
            <span className='min-w-0 truncate'>{link.label}</span>
          </a>
        )
      })}
    </nav>
  )
}

function StatusPill(props: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  spinning?: boolean
  tone?: 'muted' | 'ok' | 'warning'
}) {
  const Icon = props.icon
  const toneClass =
    props.tone === 'warning'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-700'
      : 'border-border bg-card/85 text-muted-foreground'
  const iconClass =
    props.tone === 'warning' ? 'text-amber-700' : 'text-orange-400'

  return (
    <span
      className={cn(
        'inline-flex max-w-56 items-center gap-1.5 truncate rounded-full border px-3 py-1.5 shadow-sm backdrop-blur',
        toneClass
      )}
    >
      <Icon
        className={cn(
          'size-3.5 shrink-0',
          iconClass,
          props.spinning && 'animate-spin'
        )}
      />
      <span className='truncate'>{props.label}</span>
    </span>
  )
}

function ModeButton(props: {
  active: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
}) {
  const Icon = props.icon
  return (
    <Button
      type='button'
      variant='outline'
      aria-pressed={props.active}
      onClick={props.onClick}
      className={cn(
        'border-border text-muted-foreground hover:bg-muted hover:text-foreground h-9 rounded-full bg-transparent px-3 transition',
        props.active &&
          'border-orange-400 bg-orange-400 text-black shadow-sm hover:bg-orange-300 hover:text-black'
      )}
    >
      <Icon className='size-4' />
      {props.label}
    </Button>
  )
}

function ChatBubble(props: {
  message: ChatConsoleMessage
  onRegenerate: () => void
}) {
  const { t } = useTranslation()
  const isUser = props.message.role === 'user'
  const isError = props.message.status === 'error'
  const messageMode = props.message.mode ?? 'chat'
  const modeBadge = messageMode === 'image' ? t('Image') : t('Chat')
  const generatedImages =
    messageMode === 'image' ? parseImageMarkdowns(props.message.content) : []
  const bodyContent = props.message.content || (isError ? '' : t('Thinking...'))
  const hasDuplicateError = props.message.error === props.message.content

  return (
    <div
      className={cn(
        'group flex gap-3 py-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <div className='bg-foreground text-background ring-border mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1'>
          c
        </div>
      )}
      <div
        className={cn(
          'max-w-[min(82%,680px)] text-sm leading-7',
          isUser &&
            'bg-muted text-foreground ring-border rounded-[24px] px-4 py-2.5 shadow-sm ring-1',
          !isUser && 'text-foreground min-w-0 flex-1',
          isError && 'rounded-2xl bg-red-50 px-4 py-3 text-red-700'
        )}
      >
        {!isUser && (
          <div className='text-muted-foreground mb-1 flex items-center gap-2 text-xs font-medium'>
            <span>ccapi</span>
            <span className='bg-muted text-muted-foreground ring-border rounded-full px-2 py-0.5 text-[11px] ring-1'>
              {modeBadge}
            </span>
            {props.message.status === 'streaming' && (
              <Loader2 className='size-3.5 animate-spin' />
            )}
          </div>
        )}
        {isUser && messageMode === 'image' && (
          <div className='text-muted-foreground mb-1 text-[11px] font-medium'>
            {t('Image request')}
          </div>
        )}
        {isUser && props.message.status === 'streaming' && (
          <div className='text-muted-foreground mb-1 flex items-center gap-2 text-xs'>
            <Loader2 className='size-3.5 animate-spin' />
          </div>
        )}
        {props.message.reasoning && (
          <div className='bg-muted text-muted-foreground mb-3 rounded-xl p-3 text-xs'>
            {props.message.reasoning}
          </div>
        )}
        {bodyContent &&
          (generatedImages.length > 0 ? (
            <GeneratedImageGrid images={generatedImages} />
          ) : (
            <Response className='prose prose-stone prose-a:text-orange-400 max-w-none text-sm leading-7 break-words'>
              {bodyContent}
            </Response>
          ))}
        {props.message.error && !hasDuplicateError && (
          <p className='mt-2 text-xs text-red-600 dark:text-red-300'>
            {props.message.error}
          </p>
        )}
        <div className='mt-2 flex gap-1 opacity-0 transition group-hover:opacity-100'>
          <Button
            size='icon'
            variant='ghost'
            className='text-muted-foreground hover:bg-muted hover:text-foreground size-8 rounded-lg'
            onClick={() => {
              void navigator.clipboard.writeText(props.message.content)
              toast.success(t('Copied'))
            }}
            aria-label={t('Copy message')}
          >
            <Copy className='size-4' />
          </Button>
          {!isUser && (
            <Button
              size='icon'
              variant='ghost'
              className='text-muted-foreground hover:bg-muted hover:text-foreground size-8 rounded-lg'
              onClick={props.onRegenerate}
              aria-label={t('Regenerate')}
            >
              <RefreshCw className='size-4' />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function GeneratedImageGrid(props: {
  images: Array<{ alt: string; url: string }>
}) {
  const { t } = useTranslation()
  return (
    <div className='grid max-w-xl gap-3 sm:grid-cols-2'>
      {props.images.map((image, index) => (
        <figure
          key={`${image.url}-${index}`}
          className='border-border bg-card overflow-hidden rounded-[22px] border shadow-[0_18px_56px_rgba(91,58,34,0.14)]'
        >
          <img
            src={image.url}
            alt={image.alt}
            className='bg-foreground aspect-square max-h-[520px] w-full object-contain'
          />
          <figcaption className='bg-card/95 flex items-center justify-between gap-2 p-2'>
            <span className='text-muted-foreground min-w-0 truncate text-xs'>
              {image.alt}
            </span>
            <span className='flex shrink-0 gap-1'>
              <Button
                size='icon'
                variant='ghost'
                className='text-muted-foreground hover:bg-muted hover:text-foreground size-8'
                onClick={() => {
                  void navigator.clipboard.writeText(image.alt)
                  toast.success(t('Copied'))
                }}
                aria-label={t('Copy prompt')}
              >
                <Copy className='size-4' />
              </Button>
              <Button
                size='icon'
                variant='ghost'
                className='text-muted-foreground hover:bg-muted hover:text-foreground size-8'
                asChild
                aria-label={t('Download')}
              >
                <a href={image.url} download={`ccapi-image-${index + 1}.png`}>
                  <Download className='size-4' />
                </a>
              </Button>
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

function EmptyState(props: {
  mode: ChatConsoleMode
  onPrompt: (prompt: string) => void
}) {
  const { t } = useTranslation()
  const title = t('今天想做什么？')

  return (
    <div className='flex min-h-[56vh] flex-col items-center justify-center text-center'>
      <h3 className='text-foreground text-3xl font-semibold tracking-tight'>
        {title}
      </h3>
      <p className='text-muted-foreground mx-auto mt-3 max-w-lg text-sm'>
        {props.mode === 'image'
          ? t(
              '当前是生图模式，发出去就会调用图片模型。点下面的聊天可随时切回问答。'
            )
          : t('直接聊天，或者点输入框下面的生图，把同一个对话变成图片工作流。')}
      </p>
      <div className='mt-6 flex flex-wrap justify-center gap-2'>
        {QUICK_PROMPTS[props.mode].map((prompt) => (
          <Button
            key={prompt}
            variant='outline'
            className='border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground rounded-full shadow-sm transition'
            onClick={() => props.onPrompt(prompt)}
          >
            {t(prompt)}
          </Button>
        ))}
      </div>
    </div>
  )
}

function SimpleField(props: { label: string; children: React.ReactNode }) {
  return (
    <label className='text-muted-foreground block space-y-1 text-xs'>
      <span>{props.label}</span>
      {props.children}
    </label>
  )
}
