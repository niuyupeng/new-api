import { createFileRoute } from '@tanstack/react-router'
import { ChatConsole } from '@/features/chat-console'

export const Route = createFileRoute('/_authenticated/chat/image')({
  component: ImageChatPage,
})

function ImageChatPage() {
  return <ChatConsole initialMode='image' />
}
