import type { ComponentType } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Command,
  Copy,
  ExternalLink,
  ImageIcon,
  KeyRound,
  MessageSquareText,
  Terminal,
  WalletCards,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { PublicLayout } from '@/components/layout'
import { Footer } from '@/components/layout/components/footer'
import { ccapiPublicNavLinks } from '@/features/ccapi/public-nav'

const openAiBaseUrl = 'https://ccapi.chat/v1'
const claudeBaseUrl = 'https://ccapi.chat'

type GuideStep = {
  title: string
  detail: string
}

type CodeExample = {
  title: string
  desc: string
  code: string
}

type ToolGuide = {
  name: string
  urlLabel: string
  url: string
  keyName: string
  note: string
}

const quickSteps: GuideStep[] = [
  {
    title: '充值或兑换额度',
    detail:
      '先登录账号，进入钱包页面充值或兑换额度。没有余额时，请求不会正常消耗。',
  },
  {
    title: '生成 API Key',
    detail:
      '进入控制台的 API 密钥页面，新建一个 Key。示例里统一写 sk-your-api-key。',
  },
  {
    title: '复制 Base URL',
    detail: 'OpenAI 兼容工具填 /v1；Claude Code / Anthropic SDK 填根域名。',
  },
  {
    title: '选择模型并测试',
    detail: '先用一个短问题测试聊天，再切换到代码模型、生图模型或其他模型。',
  },
]

const toolGuides: ToolGuide[] = [
  {
    name: 'OpenAI SDK / Codex / Cursor / Continue',
    urlLabel: 'Base URL',
    url: openAiBaseUrl,
    keyName: 'API Key',
    note: '这类工具走 OpenAI-compatible 接口，地址必须带 /v1。',
  },
  {
    name: 'Claude Code / Anthropic SDK',
    urlLabel: 'Base URL',
    url: claudeBaseUrl,
    keyName: 'ANTHROPIC_AUTH_TOKEN',
    note: 'Claude 类工具填根域名，不要带 /v1。',
  },
  {
    name: 'ChatBox / OpenCat / Cherry Studio',
    urlLabel: 'OpenAI API 地址',
    url: openAiBaseUrl,
    keyName: 'API Key',
    note: '供应商选择 OpenAI 或 OpenAI-compatible，然后填模型名。',
  },
  {
    name: 'CC Switch',
    urlLabel: '供应商地址',
    url: `${openAiBaseUrl} 或 ${claudeBaseUrl}`,
    keyName: 'API Key',
    note: 'OpenAI/Codex 一路填 /v1，Claude 一路填根域名。',
  },
]

const chatExamples: CodeExample[] = [
  {
    title: 'curl 聊天',
    desc: '最小可用示例，适合先测试 Key 和模型权限。',
    code: `curl ${openAiBaseUrl}/chat/completions \\
  -H "Authorization: Bearer sk-your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.3-codex-spark",
    "messages": [
      {"role": "user", "content": "你好，只回复 OK"}
    ],
    "stream": false
  }'`,
  },
  {
    title: 'Node.js',
    desc: '项目里使用 OpenAI SDK 时，把 baseURL 换成 ccapi 的 /v1。',
    code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "sk-your-api-key",
  baseURL: "${openAiBaseUrl}",
});

const res = await client.chat.completions.create({
  model: "gpt-5.3-codex-spark",
  messages: [{ role: "user", content: "写一个接入示例" }],
});

console.log(res.choices[0]?.message?.content);`,
  },
  {
    title: 'Python',
    desc: 'Python 也是同样逻辑：key 用自己的，base_url 用 /v1。',
    code: `from openai import OpenAI

client = OpenAI(
    api_key="sk-your-api-key",
    base_url="${openAiBaseUrl}",
)

res = client.chat.completions.create(
    model="gpt-5.3-codex-spark",
    messages=[{"role": "user", "content": "解释一下这个报错"}],
)

print(res.choices[0].message.content)`,
  },
]

const imageExamples: CodeExample[] = [
  {
    title: 'Images API 生图',
    desc: 'gpt-image、imagen、dall-e 一类模型通常走 /images/generations。',
    code: `curl ${openAiBaseUrl}/images/generations \\
  -H "Authorization: Bearer sk-your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-image-2",
    "prompt": "一张简洁高级的 AI API 控制台产品图",
    "size": "1024x1024"
  }'`,
  },
  {
    title: 'Chat 生图',
    desc: 'nano banana、Gemini image preview 等模型可能走 /chat/completions。',
    code: `curl ${openAiBaseUrl}/chat/completions \\
  -H "Authorization: Bearer sk-your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "nano-banana-pro-preview",
    "messages": [
      {"role": "user", "content": "请生成图片：一个极简 API 工作台"}
    ]
  }'`,
  },
]

const claudeExample = `export ANTHROPIC_BASE_URL="${claudeBaseUrl}"
export ANTHROPIC_AUTH_TOKEN="sk-your-api-key"

claude`

const commonErrors = [
  ['401', 'Key 不正确、已禁用，或没有填 Authorization: Bearer。'],
  ['403', '账号、分组或模型没有权限。换模型，或联系管理员开通分组。'],
  ['429', '请求过快、余额不足，或触发限流。'],
  ['500', '上游或渠道异常。保留 request id 方便排查。'],
  ['model not found', '模型名写错，或当前账号不可用。以模型价格页显示为准。'],
  ['no available channel', '后台没有给当前模型/分组配置可用渠道。'],
  [
    'image endpoint unsupported',
    '该模型不支持当前生图接口，换 Images API 或 Chat 生图方式。',
  ],
]

function copy(text: string) {
  void navigator.clipboard.writeText(text)
  toast.success('已复制')
}

function CodeBlock(props: CodeExample) {
  return (
    <article className='border-border bg-card min-w-0 overflow-hidden rounded-lg border p-3 shadow-sm sm:p-4'>
      <div className='mb-3 flex flex-col items-start justify-between gap-3 sm:flex-row'>
        <div className='min-w-0'>
          <h3 className='text-foreground font-bold'>{props.title}</h3>
          <p className='text-muted-foreground mt-1 text-sm leading-6'>
            {props.desc}
          </p>
        </div>
        <Button
          type='button'
          size='sm'
          variant='outline'
          className='border-border bg-card shrink-0'
          onClick={() => copy(props.code)}
        >
          <Copy className='size-4' />
          复制
        </Button>
      </div>
      <pre className='max-w-full overflow-x-auto rounded-md bg-zinc-950 p-3 text-xs leading-6 text-zinc-100 sm:p-4'>
        <code className='block w-max min-w-full'>{props.code}</code>
      </pre>
    </article>
  )
}

function SectionTitle(props: {
  icon: ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  desc?: string
}) {
  const Icon = props.icon
  return (
    <div className='mb-5'>
      <div className='mb-2 flex items-center gap-2 text-sm font-bold text-orange-400'>
        <Icon className='size-4' />
        {props.eyebrow}
      </div>
      <h2 className='text-foreground text-2xl font-black tracking-tight md:text-3xl'>
        {props.title}
      </h2>
      {props.desc && (
        <p className='text-muted-foreground mt-2 max-w-3xl text-sm leading-7'>
          {props.desc}
        </p>
      )}
    </div>
  )
}

export function ApiDocs() {
  return (
    <PublicLayout
      showMainContainer={false}
      navLinks={ccapiPublicNavLinks}
      siteName='ccapi'
      headerProps={{ className: 'ccapi-public-header' }}
    >
      <main className='ccapi-docs-page bg-background text-foreground min-h-svh overflow-x-clip pt-24'>
        <section className='border-border border-b px-4 py-10 sm:px-5 md:px-8'>
          <div className='mx-auto max-w-6xl'>
            <div className='max-w-3xl'>
              <p className='mb-3 text-sm font-bold text-orange-400'>接入文档</p>
              <h1 className='text-3xl font-black tracking-tight sm:text-4xl md:text-5xl'>
                按步骤填，不绕弯。
              </h1>
              <p className='text-muted-foreground mt-4 text-base leading-8'>
                这里不讲概念，直接告诉你：先充值，生成 Key，复制正确的 Base
                URL，然后用模型价格页里的模型名发请求。
              </p>
            </div>

            <div className='mt-8 grid min-w-0 gap-3 md:grid-cols-2'>
              <div className='border-border bg-card min-w-0 rounded-lg border p-4'>
                <div className='mb-2 flex items-center gap-2 font-bold'>
                  <Terminal className='size-4 text-orange-400' />
                  OpenAI 兼容地址
                </div>
                <div className='rounded-md bg-zinc-950 p-3 font-mono text-sm break-all text-zinc-100'>
                  {openAiBaseUrl}
                </div>
                <Button
                  type='button'
                  size='sm'
                  className='bg-foreground text-background hover:bg-foreground/90 mt-3'
                  onClick={() => copy(openAiBaseUrl)}
                >
                  <Copy className='size-4' />
                  复制 /v1 地址
                </Button>
              </div>

              <div className='border-border bg-card min-w-0 rounded-lg border p-4'>
                <div className='mb-2 flex items-center gap-2 font-bold'>
                  <Bot className='size-4 text-orange-400' />
                  Claude / Anthropic 地址
                </div>
                <div className='rounded-md bg-zinc-950 p-3 font-mono text-sm break-all text-zinc-100'>
                  {claudeBaseUrl}
                </div>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  className='border-border bg-card mt-3'
                  onClick={() => copy(claudeBaseUrl)}
                >
                  <Copy className='size-4' />
                  复制根域名
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className='px-4 py-10 sm:px-5 md:px-8'>
          <div className='mx-auto max-w-6xl'>
            <SectionTitle
              icon={CheckCircle2}
              eyebrow='快速开始'
              title='新用户照这个顺序做'
              desc='不要先纠结模型。先跑通一个最小聊天请求，再切模型和工具。'
            />
            <div className='grid gap-3 md:grid-cols-4'>
              {quickSteps.map((step, index) => (
                <article
                  key={step.title}
                  className='border-border bg-card rounded-lg border p-4 shadow-sm'
                >
                  <div className='bg-foreground text-background mb-3 flex size-8 items-center justify-center rounded-full text-sm font-black'>
                    {index + 1}
                  </div>
                  <h3 className='font-bold'>{step.title}</h3>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    {step.detail}
                  </p>
                </article>
              ))}
            </div>
            <div className='mt-5 flex flex-wrap gap-3'>
              <Button asChild className='bg-foreground text-background'>
                <Link to='/wallet'>
                  <WalletCards className='size-4' />
                  去充值
                </Link>
              </Button>
              <Button asChild variant='outline' className='border-border'>
                <Link to='/keys'>
                  <KeyRound className='size-4' />
                  生成 API Key
                </Link>
              </Button>
              <Button asChild variant='outline' className='border-border'>
                <Link to='/pricing'>
                  <MessageSquareText className='size-4' />
                  查看模型价格
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className='border-border bg-card border-y px-4 py-10 sm:px-5 md:px-8'>
          <div className='mx-auto max-w-6xl'>
            <SectionTitle
              icon={Wrench}
              eyebrow='工具怎么填'
              title='不同工具只差 Base URL'
              desc='最容易填错的是 Claude Code：它填根域名。OpenAI 兼容工具才填 /v1。'
            />
            <div className='border-border bg-card min-w-0 overflow-hidden rounded-lg border'>
              <div className='border-border bg-muted text-foreground grid grid-cols-[1.1fr_1fr_0.85fr_1.2fr] border-b px-4 py-3 text-sm font-bold max-lg:hidden'>
                <div>工具</div>
                <div>地址</div>
                <div>Key 字段</div>
                <div>注意</div>
              </div>
              {toolGuides.map((tool) => (
                <div
                  key={tool.name}
                  className='border-border grid min-w-0 gap-2 border-b px-4 py-4 text-sm last:border-b-0 lg:grid-cols-[1.1fr_1fr_0.85fr_1.2fr] lg:items-center'
                >
                  <div className='font-bold'>{tool.name}</div>
                  <div>
                    <div className='text-muted-foreground mb-1 text-xs font-bold lg:hidden'>
                      {tool.urlLabel}
                    </div>
                    <code className='bg-muted rounded px-2 py-1 font-mono text-xs break-all'>
                      {tool.url}
                    </code>
                  </div>
                  <div>
                    <code className='bg-muted rounded px-2 py-1 font-mono text-xs'>
                      {tool.keyName}
                    </code>
                  </div>
                  <p className='text-muted-foreground leading-6'>{tool.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className='px-4 py-10 sm:px-5 md:px-8'>
          <div className='mx-auto max-w-6xl'>
            <SectionTitle
              icon={MessageSquareText}
              eyebrow='聊天接口'
              title='OpenAI-compatible 聊天'
              desc='URL、Key、model 三个地方填对，基本就能跑。'
            />
            <div className='grid min-w-0 gap-4 lg:grid-cols-3'>
              {chatExamples.map((example) => (
                <CodeBlock key={example.title} {...example} />
              ))}
            </div>
          </div>
        </section>

        <section className='border-border bg-card border-y px-4 py-10 sm:px-5 md:px-8'>
          <div className='mx-auto max-w-6xl'>
            <SectionTitle
              icon={ImageIcon}
              eyebrow='生图接口'
              title='生图有两种走法'
              desc='gpt-image、imagen 通常走 Images API；nano banana、Gemini image preview 通常走 Chat 生图。以模型价格页和后台渠道配置为准。'
            />
            <div className='grid min-w-0 gap-4 lg:grid-cols-2'>
              {imageExamples.map((example) => (
                <CodeBlock key={example.title} {...example} />
              ))}
            </div>
          </div>
        </section>

        <section className='px-4 py-10 sm:px-5 md:px-8'>
          <div className='mx-auto max-w-6xl'>
            <SectionTitle
              icon={Command}
              eyebrow='Claude Code'
              title='Claude Code 单独记住这一段'
              desc='Claude Code 不填 /v1。Key 仍然用你自己的 ccapi Key。'
            />
            <CodeBlock
              title='终端环境变量'
              desc='适合临时测试。长期使用可以写进你自己的 shell 配置。'
              code={claudeExample}
            />
          </div>
        </section>

        <section className='border-border bg-card border-t px-4 py-10 sm:px-5 md:px-8'>
          <div className='mx-auto max-w-6xl'>
            <SectionTitle
              icon={AlertTriangle}
              eyebrow='排错'
              title='常见错误'
              desc='报错时先看状态码，再看 request id。'
            />
            <div className='grid gap-3 md:grid-cols-2'>
              {commonErrors.map(([code, desc]) => (
                <div
                  key={code}
                  className='border-border bg-card rounded-lg border p-4'
                >
                  <div className='font-mono text-sm font-black text-orange-400'>
                    {code}
                  </div>
                  <p className='text-muted-foreground mt-2 text-sm leading-6'>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
            <a
              href='https://platform.openai.com/docs/api-reference'
              target='_blank'
              rel='noreferrer'
              className='mt-6 inline-flex items-center gap-2 text-sm font-bold text-orange-400'
            >
              OpenAI API 官方参考
              <ExternalLink className='size-4' />
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </PublicLayout>
  )
}
