import { useCallback, useState } from 'react'
import {
  Download,
  Eraser,
  Link2,
  Moon,
  RefreshCw,
  ShieldCheck,
  Sun,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { SectionPageLayout } from '@/components/layout'
import { useTheme } from '@/context/theme-provider'

const STORAGE_KEYS = {
  customBaseUrl: 'ccapi_custom_base_url',
  defaultChatModel: 'ccapi_default_chat_model',
  defaultImageModel: 'ccapi_default_image_model',
  chatSessions: 'ccapi_chat_sessions',
  gallery: 'ccapi_chat_gallery',
  settings: 'ccapi_chat_settings',
}

function getStorageValue(key: string, fallback = '') {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

function setStorageValue(key: string, value: string) {
  if (typeof window === 'undefined') return
  if (!value) {
    window.localStorage.removeItem(key)
    return
  }
  window.localStorage.setItem(key, value)
}

export function LocalSettings() {
  const { theme, setTheme } = useTheme()
  const [baseUrl, setBaseUrl] = useState(() =>
    getStorageValue(STORAGE_KEYS.customBaseUrl, 'https://ccapi.chat/v1')
  )
  const [chatModel, setChatModel] = useState(() =>
    getStorageValue(STORAGE_KEYS.defaultChatModel, 'gpt-5.3-codex-spark')
  )
  const [imageModel, setImageModel] = useState(() =>
    getStorageValue(STORAGE_KEYS.defaultImageModel, 'gpt-image-2')
  )
  const [healthMessage, setHealthMessage] = useState('尚未测试连接')
  const [testing, setTesting] = useState(false)

  const save = useCallback(() => {
    setStorageValue(STORAGE_KEYS.customBaseUrl, baseUrl.trim())
    setStorageValue(STORAGE_KEYS.defaultChatModel, chatModel.trim())
    setStorageValue(STORAGE_KEYS.defaultImageModel, imageModel.trim())
    toast.success('本地设置已保存')
  }, [baseUrl, chatModel, imageModel])

  const testHealth = useCallback(async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/health', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setHealthMessage(
        data?.ok
          ? '服务端状态正常。模型和 Key 权限请以控制台为准。'
          : data?.message || '服务端返回异常'
      )
    } catch (error) {
      setHealthMessage(error instanceof Error ? error.message : '连接测试失败')
    } finally {
      setTesting(false)
    }
  }, [])

  const clearChat = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEYS.chatSessions)
    window.localStorage.removeItem(STORAGE_KEYS.settings)
    toast.success('本地会话已清空')
  }, [])

  const clearImages = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEYS.gallery)
    toast.success('生图历史已清空')
  }, [])

  const exportLocalData = useCallback(() => {
    const payload = {
      sessions: getStorageValue(STORAGE_KEYS.chatSessions, '[]'),
      gallery: getStorageValue(STORAGE_KEYS.gallery, '[]'),
      settings: getStorageValue(STORAGE_KEYS.settings, '{}'),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `ccapi-local-data-${Date.now()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>本地设置</SectionPageLayout.Title>
      <SectionPageLayout.Description>
        配置 ccapi 前端偏好。真实 API Key 由控制台账号体系管理，充值后在 API 密钥页面生成和复制。
      </SectionPageLayout.Description>
      <SectionPageLayout.Actions>
        <Button onClick={save}>
          <ShieldCheck className='size-4' />
          保存设置
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='grid gap-4 xl:grid-cols-[1fr_360px]'>
          <div className='space-y-4'>
            <Panel
              icon={Link2}
              title='接口接入'
              desc='这里仅保存前端显示偏好；不会保存、覆盖或上传任何本地测试 API Key。'
            >
              <Field label='Base URL'>
                <Input
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  placeholder='https://ccapi.chat/v1'
                />
              </Field>
              <p className='text-muted-foreground rounded-lg border bg-muted/40 p-3 text-sm leading-6'>
                客户使用时请先充值，再到控制台的 API 密钥页面创建 Key。测试用 Key 不会写入前端代码、环境示例或文档。
              </p>
              <div className='grid gap-3 md:grid-cols-2'>
                <Field label='默认聊天模型'>
                  <Input
                    value={chatModel}
                    onChange={(event) => setChatModel(event.target.value)}
                  />
                </Field>
                <Field label='默认生图模型'>
                  <Input
                    value={imageModel}
                    onChange={(event) => setImageModel(event.target.value)}
                  />
                </Field>
              </div>
            </Panel>

            <Panel
              icon={Moon}
              title='显示与历史'
              desc='主题、会话和生图记录都保存在本机，换浏览器不会自动同步。'
            >
              <div className='flex items-center justify-between rounded-lg border p-4'>
                <div>
                  <div className='font-semibold'>深色模式</div>
                  <p className='text-muted-foreground text-sm'>
                    适合长时间看代码和调接口。
                  </p>
                </div>
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? 'dark' : 'light')
                  }
                />
              </div>
              <div className='grid gap-3 md:grid-cols-3'>
                <Button variant='outline' onClick={exportLocalData}>
                  <Download className='size-4' />
                  导出 JSON
                </Button>
                <Button variant='outline' onClick={clearChat}>
                  <Eraser className='size-4' />
                  清空会话
                </Button>
                <Button variant='outline' onClick={clearImages}>
                  <Eraser className='size-4' />
                  清空图片
                </Button>
              </div>
            </Panel>
          </div>

          <aside className='space-y-4'>
            <Panel
              icon={ShieldCheck}
              title='连接测试'
              desc='测试当前站点接口服务是否可达，不会返回或展示服务端 API Key。'
            >
              <Button
                className='w-full'
                onClick={() => void testHealth()}
                disabled={testing}
              >
                <RefreshCw className={testing ? 'size-4 animate-spin' : 'size-4'} />
                测试连接
              </Button>
              <p className='text-muted-foreground rounded-lg border bg-muted/40 p-3 text-sm leading-6'>
                {healthMessage}
              </p>
            </Panel>

            <Panel
              icon={Sun}
              title='环境变量模式'
              desc='生产部署继续使用 New API 后台渠道和用户密钥系统；前端环境文件不放本地测试 Key。'
            >
              <pre className='overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-6'>
                <code>{`NEWAPI_BASE_URL=https://ccapi.chat/v1
DEFAULT_CHAT_MODEL=gpt-5.3-codex-spark
DEFAULT_IMAGE_MODEL=gpt-image-2`}</code>
              </pre>
            </Panel>
          </aside>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}

function Panel(props: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  desc: string
  children: React.ReactNode
}) {
  const Icon = props.icon
  return (
    <section className='rounded-lg border bg-card p-5 shadow-sm'>
      <div className='mb-5 flex items-start gap-3'>
        <div className='flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
          <Icon className='size-5' />
        </div>
        <div>
          <h3 className='font-semibold'>{props.title}</h3>
          <p className='text-muted-foreground text-sm leading-6'>{props.desc}</p>
        </div>
      </div>
      <div className='space-y-4'>{props.children}</div>
    </section>
  )
}

function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <label className='block space-y-2'>
      <span className='text-sm font-medium'>{props.label}</span>
      {props.children}
    </label>
  )
}
