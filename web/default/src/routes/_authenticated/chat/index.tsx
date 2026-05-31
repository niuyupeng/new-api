import { createFileRoute } from '@tanstack/react-router'
import { ChatConsole } from '@/features/chat-console'

export const Route = createFileRoute('/_authenticated/chat/')({
  component: ChatPage,
})

function ChatPage() {
  return <ChatConsole />
}
