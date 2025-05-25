"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import MessageSystem from "@/components/message-system"

function ChatPageContent() {
  const searchParams = useSearchParams()
  const userId = searchParams.get("user")
  const userName = searchParams.get("name")
  const userAvatar = searchParams.get("avatar")

  return (
    <div className="container mx-auto py-6">
      <MessageSystem
        initialUserId={userId || undefined}
        initialUserName={userName || undefined}
        initialUserAvatar={userAvatar || undefined}
      />
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  )
}
