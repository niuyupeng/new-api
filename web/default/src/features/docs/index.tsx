import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  BookOpenText,
  Bot,
  Box,
  Braces,
  Code2,
  Command,
  Copy,
  CreditCard,
  ExternalLink,
  ImageIcon,
  KeyRound,
  MessageSquareCode,
  MousePointerClick,
  PlugZap,
  Terminal,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { ccapiPublicNavLinks } from '@/features/ccapi/public-nav'

const openAiBaseUrl = 'https://ccapi.chat/v1'
const claudeBaseUrl = 'https://ccapi.chat'

const snippets = [
  {
    title: 'curl',
    icon: Terminal,
    code: `curl ${openAiBaseUrl}/chat/completions \\
  -H "Authorization: Bearer sk-your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.3-codex-spark",
    "messages": [{"role": "user", "content": "写一个 API 接入示例"}],
    "stream": true
  }'`,
  },
  {
    title: 'Node.js OpenAI SDK',
    icon: Braces,
    code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-your-api-key",
  baseURL: "${openAiBaseUrl}"
});

const stream = await client.chat.completions.create({
  model: "gpt-5.3-codex-spark",
  messages: [{ role: "user", content: "给我一个产品发布清单" }],
  stream: true
});

for await (const part of stream) {
  process.stdout.write(part.choices[0]?.delta?.content ?? "");
}`,
  },
  {
    title: 'Python OpenAI SDK',
    icon: Code2,
    code: `from openai import OpenAI

client = OpenAI(
    api_key="sk-your-api-key",
    base_url="${openAiBaseUrl}"
)

resp = client.chat.completions.create(
    model="gpt-5.3-codex-spark",
    messages=[{"role": "user", "content": "帮我解释这段日志"}],
)

print(resp.choices[0].message.content)`,
  },
  {
    title: 'Images API（gpt-image / imagen）',
    icon: Box,
    code: `curl ${openAiBaseUrl}/images/generations \\
  -H "Authorization: Bearer sk-your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-image-2",
    "prompt": "一个深色开发者 API 控制台，产品海报风格",
    "size": "1024x1024"
  }'`,
  },
  {
    title: 'Chat 生图（nano banana / Gemini image）',
    icon: ImageIcon,
    code: `curl ${openAiBaseUrl}/chat/completions \\
  -H "Authorization: Bearer sk-your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "nano-banana-pro-preview",
    "messages": [
      {
        "role": "user",
        "content": "请直接生成图片：一个简洁高级的 AI API 工作台界面"
      }
    ]
  }'`,
  },
  {
    title: 'Claude Code',
    icon: Bot,
    code: `export ANTHROPIC_BASE_URL="${claudeBaseUrl}"
export ANTHROPIC_AUTH_TOKEN="sk-your-api-key"

claude`,
  },
]

const beginnerTutorials = [
  {
    title: 'Claude Code：Mac / Linux / Windows',
    icon: Bot,
    endpointLabel: 'Claude 兼容根域名',
    endpoint: claudeBaseUrl,
    steps: [
      {
        label: '安装 Node.js',
        detail:
          '去 nodejs.org 下载对应系统版本。安装后在终端输入 node -v，能看到版本号就说明成功。',
        code: 'node -v',
      },
      {
        label: '安装 Claude Code',
        detail:
          '使用 npm 全局安装 Claude Code。Windows、Mac、Linux 都是同一条命令。',
        code: 'npm install -g @anthropic-ai/claude-code',
      },
      {
        label: '配置 CC Switch',
        detail: '安装 CC Switch，点击右上角 +，Claude 供应商选择自定义供应商。',
        code: 'https://ccswitch.ai/zh/',
      },
      {
        label: '填写供应商信息',
        detail:
          '供应商名称自己命名，API Key 填 ccapi 生成的密钥，请求地址填 Claude 根域名，不要带 /v1。',
        code: `供应商名称：ccapi\nAPI Key：sk-your-api-key\n请求地址：${claudeBaseUrl}`,
      },
      {
        label: '启动 Claude Code',
        detail: '保存配置后，在终端输入 claude，就可以开始使用。',
        code: 'claude',
      },
    ],
  },
  {
    title: 'Codex App / Codex CLI',
    icon: Command,
    endpointLabel: 'OpenAI-compatible /v1 地址',
    endpoint: openAiBaseUrl,
    steps: [
      {
        label: '安装 Codex',
        detail:
          '如果主要用 Codex App，先下载官方 App；如果主要在终端里用，再配置 CLI。',
        code: 'https://developers.openai.com/codex/quickstart?setup=app',
      },
      {
        label: '配置 CC Switch',
        detail:
          '在 CC Switch 里添加 Codex / OpenAI-compatible 供应商，供应商名称可以直接写 ccapi。',
        code: 'https://ccswitch.ai/zh/',
      },
      {
        label: '填写 URL 和 Key',
        detail:
          '官网链接和 API 请求地址保持一致，都填 /v1；API Key 填你在 ccapi 控制台获取的密钥。',
        code: `供应商名称：ccapi\n官网链接：${openAiBaseUrl}\nAPI 请求地址：${openAiBaseUrl}\nAPI Key：sk-your-api-key`,
      },
      {
        label: '填写模型名称',
        detail:
          '模型名称填你想用的模型。聊天/代码模型可以用控制台可用模型；生图可用 gpt-image-2、gpt-image-1、nano-banana-pro-preview、gemini-2.5-flash-image 或 imagen。',
        code: 'gpt-5.3-codex-spark\ngpt-image-2\nnano-banana-pro-preview\ngemini-2.5-flash-image',
      },
      {
        label: '打开 Codex',
        detail:
          '配置保存后打开 Codex App 或 CLI。若页面打不开，通常需要先准备网络环境。',
        code: 'codex',
      },
    ],
  },
  {
    title: '生图模型：Images API 或 Chat 生图',
    icon: ImageIcon,
    endpointLabel: 'OpenAI-compatible 地址',
    endpoint: `${openAiBaseUrl}/images/generations 或 ${openAiBaseUrl}/chat/completions`,
    steps: [
      {
        label: '先判断模型走哪类接口',
        detail:
          'gpt-image、dall-e、imagen 通常走 /images/generations；nano banana、Gemini image preview 通常走 /chat/completions 返回图片。',
        code: 'Images API: gpt-image-2, gpt-image-1, imagen-4.0-generate-001\nChat 生图: nano-banana-pro-preview, gemini-2.5-flash-image',
      },
      {
        label: '保持 /v1 地址',
        detail: '生图依然走 OpenAI-compatible /v1 地址，不要填 Claude 根域名。',
        code: openAiBaseUrl,
      },
      {
        label: '先跑最小提示词',
        detail: '先用简单 prompt 测试通路，再逐步增加尺寸、风格和数量参数。',
        code: '画一张深色 API 控制台产品海报',
      },
    ],
  },
  {
    title: '充值：购买兑换码后到账户兑换',
    icon: CreditCard,
    endpointLabel: '控制台入口',
    endpoint: '钱包管理 / 兑换码充值',
    steps: [
      {
        label: '进入钱包管理',
        detail: '登录网站后进入控制台的钱包管理页面。',
        code: '/dashboard/wallet',
      },
      {
        label: '购买兑换码',
        detail: '点击购买兑换码，按页面提示完成购买。',
        code: '购买兑换码',
      },
      {
        label: '输入兑换码',
        detail: '把兑换码填到兑换码输入框，点击兑换额度。',
        code: '兑换码充值',
      },
      {
        label: '回到聊天或 Codex 测试',
        detail: '到账后先跑一个小请求，确认余额、模型和渠道都正常。',
        code: 'hi',
      },
    ],
  },
]

const tools = [
  {
    name: 'Claude Code',
    icon: Bot,
    steps: [
      'Claude Code / Anthropic SDK 走 Claude 兼容入口，Base URL 填根域名。',
      `ANTHROPIC_BASE_URL=${claudeBaseUrl}，不要在后面加 /v1。`,
      'ANTHROPIC_AUTH_TOKEN 填自己的 ccapi Key，模型名按控制台可用模型填写。',
    ],
  },
  {
    name: 'Codex',
    icon: Command,
    steps: [
      `把 OpenAI-compatible Base URL 指向 ${openAiBaseUrl}。`,
      '不要把 Key 写进仓库，优先放进本机环境变量或安全配置。',
      '先用轻量模型跑通，再切换到代码/推理模型。',
    ],
  },
  {
    name: 'Cursor',
    icon: PlugZap,
    steps: [
      'Settings 里添加 OpenAI-compatible Provider。',
      `Base URL 使用 ${openAiBaseUrl}，Key 使用 sk-your-api-key。`,
      'Chat、Composer、Agent 的模型可以分别指定。',
    ],
  },
  {
    name: 'Continue',
    icon: MessageSquareCode,
    steps: [
      '在 config.json 里添加 OpenAI-compatible model。',
      `apiBase 填 ${openAiBaseUrl}，apiKey 使用环境变量读取。`,
      '建议给聊天、代码补全分别配置不同模型。',
    ],
  },
  {
    name: 'CC Switch',
    icon: Box,
    steps: [
      `OpenAI / Codex / Cursor 这一路填 ${openAiBaseUrl}。`,
      `Claude Code / Anthropic 这一路填 ${claudeBaseUrl}，不要带 /v1。`,
      '按工具切换 Provider，先跑一个最小聊天请求，再批量迁移配置。',
    ],
  },
]

const errors = [
  ['401', 'Key 不正确或已禁用。回到控制台检查 API Key 状态。'],
  ['403', '账号或分组没有该模型权限。切换模型或联系管理员。'],
  ['429', '请求太快或额度不足。稍后重试，或检查余额/限流设置。'],
  ['500', '上游或中转服务异常。保留 request id 方便排查。'],
  [
    'no available channel',
    '后台还没有给当前分组配置可用渠道。先添加渠道、启用模型，再回到聊天页测试。',
  ],
  ['model not found', '模型名不存在或当前分组不可用。以模型页为准。'],
  [
    'Claude Code URL wrong',
    'Claude/Anthropic 类工具通常填根域名，不要把 /v1 填给 Claude Code。',
  ],
  ['stream interrupted', '网络或上游流中断。可点击重新生成。'],
  ['image endpoint unsupported', '当前模型/渠道不支持生图，切换图像模型。'],
]

function copy(text: string) {
  void navigator.clipboard.writeText(text)
  toast.success('已复制')
}

export function ApiDocs() {
  return (
    <PublicLayout
      showMainContainer={false}
      navLinks={ccapiPublicNavLinks}
      siteName='ccapi'
      headerProps={{ className: 'ccapi-public-header' }}
    >
      <main className='min-h-svh bg-[#11100f] text-[#fff3df]'>
        <section className='relative overflow-hidden px-5 pt-28 pb-16 md:px-8'>
          <div
            aria-hidden
            className='absolute inset-0 bg-[radial-gradient(circle_at_80%_16%,rgba(242,139,97,0.2),transparent_28%),radial-gradient(circle_at_18%_18%,rgba(45,142,156,0.16),transparent_24%)]'
          />
          <div className='relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.78fr] lg:items-end'>
            <div>
              <p className='mb-4 inline-flex items-center gap-2 rounded-full border border-[#f28b61]/35 bg-[#2a1712]/80 px-3 py-1.5 text-xs font-black tracking-[0.16em] text-[#f28b61] uppercase'>
                <KeyRound className='size-3.5' />
                Developer dock
              </p>
              <h1 className='max-w-3xl text-[clamp(2.5rem,7vw,5.6rem)] leading-[0.95] font-black tracking-normal'>
                一个 Base URL，
                <br />
                接上你的 AI 工具链。
              </h1>
              <p className='mt-5 max-w-2xl text-base leading-8 text-[#c8bbaa]'>
                ccapi 使用 OpenAI-compatible
                接口。聊天、生图、代码工具、脚本调用都从同一个入口开始，
                少填几次配置，多跑几次产品。OpenAI 系工具填 /v1，Claude
                系工具填根域名。
              </p>
              <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
                <Button
                  className='h-12 rounded-lg bg-[#f28b61] px-7 text-sm font-bold text-[#22110d] hover:bg-[#ff9d73]'
                  asChild
                >
                  <Link to='/chat'>打开聊天</Link>
                </Button>
                <Button
                  variant='outline'
                  className='h-12 rounded-lg border-[#f6e7cc]/80 bg-transparent px-7 text-sm font-bold text-[#fff3df] hover:bg-[#fff3df] hover:text-[#1b1511]'
                  asChild
                >
                  <Link to='/pricing'>查看模型价格</Link>
                </Button>
              </div>
            </div>
            <div className='rounded-lg border border-white/10 bg-white/[0.045] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.38)]'>
              <div className='mb-3 text-xs font-black tracking-[0.16em] text-[#f28b61] uppercase'>
                Copy the right endpoint
              </div>
              <div className='space-y-3'>
                <div>
                  <div className='mb-1 text-xs font-bold text-[#a99886]'>
                    OpenAI / Codex / Cursor / Continue
                  </div>
                  <div className='rounded-lg bg-[#080706] p-4 font-mono text-sm break-all text-[#fff3df]'>
                    {openAiBaseUrl}
                  </div>
                </div>
                <div>
                  <div className='mb-1 text-xs font-bold text-[#a99886]'>
                    Claude Code / Anthropic SDK
                  </div>
                  <div className='rounded-lg bg-[#080706] p-4 font-mono text-sm break-all text-[#fff3df]'>
                    {claudeBaseUrl}
                  </div>
                </div>
              </div>
              <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                <Button
                  className='bg-[#f28b61] text-[#22110d] hover:bg-[#ff9d73]'
                  onClick={() => copy(openAiBaseUrl)}
                >
                  <Copy className='size-4' />
                  复制 /v1
                </Button>
                <Button
                  variant='outline'
                  className='border-white/10 bg-white/[0.03] text-[#fff3df] hover:bg-white/10'
                  onClick={() => copy(claudeBaseUrl)}
                >
                  <Copy className='size-4' />
                  复制根域名
                </Button>
              </div>
              <p className='mt-4 text-xs leading-6 text-[#a99886]'>
                示例 Key 统一写作 sk-your-api-key。实际使用请先充值，再到控制台
                API 密钥页面生成自己的 Key；不要把真实 Key 放进 README、公开仓库或截图里。
              </p>
            </div>
          </div>
        </section>

        <section className='px-5 py-14 md:px-8'>
          <div className='mx-auto max-w-6xl'>
            <div className='mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end'>
              <div>
                <p className='mb-3 inline-flex items-center gap-2 rounded-full border border-[#f28b61]/30 bg-[#2a1712]/80 px-3 py-1.5 text-xs font-black tracking-[0.16em] text-[#f28b61] uppercase'>
                  <BookOpenText className='size-3.5' />
                  新手教程
                </p>
                <h2 className='max-w-3xl text-3xl font-black tracking-normal md:text-5xl'>
                  按这个填，先把工具跑起来。
                </h2>
                <p className='mt-4 max-w-2xl text-sm leading-7 text-[#c8bbaa]'>
                  这部分整理自教程 PDF：先装 Node，再装工具，用 CC Switch
                  添加自定义供应商。 Claude 填根域名，Codex / Cursor /
                  OpenAI-compatible 工具填 /v1。
                </p>
              </div>
              <a
                href='https://nodejs.org/zh-cn/download'
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-2 text-sm font-bold text-[#f28b61]'
              >
                Node.js 下载
                <ExternalLink className='size-4' />
              </a>
            </div>

            <div className='grid gap-4 lg:grid-cols-2'>
              {beginnerTutorials.map((tutorial) => {
                const Icon = tutorial.icon
                return (
                  <article
                    key={tutorial.title}
                    className='rounded-xl border border-white/10 bg-[#171514] p-5 shadow-[0_18px_56px_rgba(0,0,0,0.24)]'
                  >
                    <div className='mb-5 flex items-start justify-between gap-4'>
                      <div className='flex min-w-0 items-start gap-3'>
                        <div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#f28b61]/30 bg-[#2a1712] text-[#f28b61]'>
                          <Icon className='size-5' />
                        </div>
                        <div className='min-w-0'>
                          <h3 className='text-lg font-black text-[#fff3df]'>
                            {tutorial.title}
                          </h3>
                          <p className='mt-1 text-xs font-bold tracking-wide text-[#a99886]'>
                            {tutorial.endpointLabel}
                          </p>
                        </div>
                      </div>
                      <Button
                        size='sm'
                        variant='outline'
                        className='shrink-0 border-white/10 bg-white/[0.03] text-[#fff3df] hover:bg-white/10'
                        onClick={() => copy(tutorial.endpoint)}
                      >
                        <Copy className='size-4' />
                        复制
                      </Button>
                    </div>

                    <div className='mb-5 rounded-lg border border-white/10 bg-[#080706] p-3 font-mono text-sm break-all text-[#fff3df]'>
                      {tutorial.endpoint}
                    </div>

                    <ol className='space-y-3'>
                      {tutorial.steps.map((step, index) => (
                        <li
                          key={`${tutorial.title}-${step.label}`}
                          className='rounded-lg border border-white/10 bg-white/[0.035] p-4'
                        >
                          <div className='flex items-start gap-3'>
                            <span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-[#f28b61] text-xs font-black text-[#22110d]'>
                              {index + 1}
                            </span>
                            <div className='min-w-0 flex-1'>
                              <div className='font-black text-[#fff3df]'>
                                {step.label}
                              </div>
                              <p className='mt-1 text-sm leading-6 text-[#c8bbaa]'>
                                {step.detail}
                              </p>
                              <pre className='mt-3 overflow-x-auto rounded-md bg-black/45 p-3 text-xs leading-5 text-[#f8e7d2]'>
                                <code>{step.code}</code>
                              </pre>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </article>
                )
              })}
            </div>

            <div className='mt-4 rounded-xl border border-[#f28b61]/25 bg-[#2a1712]/80 p-4 text-sm leading-7 text-[#f8e7d2]'>
              <div className='mb-2 flex items-center gap-2 font-black text-[#ff9d73]'>
                <MousePointerClick className='size-4' />
                填错最多的地方
              </div>
              Claude Code 填{' '}
              <code className='rounded bg-black/35 px-1.5 py-0.5'>
                {claudeBaseUrl}
              </code>
              ； Codex、Cursor、OpenAI SDK、Continue 填{' '}
              <code className='rounded bg-black/35 px-1.5 py-0.5'>
                {openAiBaseUrl}
              </code>
              。 生图按模型选择接口：
              <code className='rounded bg-black/35 px-1.5 py-0.5'>
                gpt-image-2
              </code>{' '}
              走 Images，
              <code className='rounded bg-black/35 px-1.5 py-0.5'>
                nano-banana-pro-preview
              </code>{' '}
              走 Chat。 API Key 只用自己的，不要把真实 Key 发到群里或截图里。
            </div>
          </div>
        </section>

        <section className='px-5 py-12 md:px-8'>
          <div className='mx-auto grid max-w-6xl gap-4 lg:grid-cols-2'>
            {snippets.map((snippet) => {
              const Icon = snippet.icon
              return (
                <article
                  key={snippet.title}
                  className='rounded-lg border border-white/10 bg-[#171514] p-4'
                >
                  <div className='mb-3 flex items-center justify-between gap-3'>
                    <div className='flex items-center gap-2 font-black'>
                      <Icon className='size-4 text-[#f28b61]' />
                      {snippet.title}
                    </div>
                    <Button
                      size='sm'
                      variant='outline'
                      className='border-white/10 bg-white/[0.03]'
                      onClick={() => copy(snippet.code)}
                    >
                      <Copy className='size-4' />
                      复制
                    </Button>
                  </div>
                  <pre className='overflow-x-auto rounded-lg bg-[#080706] p-4 text-xs leading-6 text-[#f8e7d2]'>
                    <code>{snippet.code}</code>
                  </pre>
                </article>
              )
            })}
          </div>
        </section>

        <section className='bg-[#fff8ed] px-5 py-16 text-[#211712] md:px-8'>
          <div className='mx-auto max-w-6xl'>
            <div className='mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end'>
              <div>
                <p className='mb-3 text-xs font-black tracking-[0.18em] text-[#d36f4c] uppercase'>
                  Tool recipes
                </p>
                <h2 className='text-3xl font-black md:text-5xl'>
                  常用开发工具，换个地址就能开工。
                </h2>
              </div>
              <a
                href='https://platform.openai.com/docs/api-reference'
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-2 text-sm font-bold text-[#bb5d3f]'
              >
                OpenAI API 参考
                <ExternalLink className='size-4' />
              </a>
            </div>
            <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
              {tools.map((tool) => {
                const Icon = tool.icon
                return (
                  <article
                    key={tool.name}
                    className='rounded-lg border border-[#ead9c1] bg-white p-5 shadow-[0_12px_30px_rgba(93,55,29,0.06)]'
                  >
                    <Icon className='mb-4 size-7 text-[#d36f4c]' />
                    <h3 className='text-lg font-black'>{tool.name}</h3>
                    <ol className='mt-4 space-y-3 text-sm leading-6 text-[#75665b]'>
                      {tool.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className='px-5 py-16 md:px-8'>
          <div className='mx-auto max-w-6xl rounded-lg border border-amber-200/20 bg-amber-200/5 p-6'>
            <div className='mb-5 flex items-center gap-2 text-xl font-black'>
              <AlertTriangle className='size-5 text-[#f28b61]' />
              常见错误怎么查
            </div>
            <div className='grid gap-3 md:grid-cols-2'>
              {errors.map(([code, desc]) => (
                <div
                  key={code}
                  className='rounded-lg border border-white/10 bg-black/25 p-4'
                >
                  <div className='font-mono text-sm font-black text-[#f28b61]'>
                    {code}
                  </div>
                  <p className='mt-2 text-sm leading-6 text-[#c8bbaa]'>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </PublicLayout>
  )
}
