"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Send, MessageCircle, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  senderRole: "admin" | "user"
  timestamp: any
  isAutoMessage?: boolean
}

interface ChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function Chat({ open, onOpenChange }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [autoMessages, setAutoMessages] = useState<string[]>([])
  const [newAutoMessage, setNewAutoMessage] = useState("")
  const { userProfile } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto messages for admin to set
  const defaultAutoMessages = [
    "Welcome to SocialApp! 🎉",
    "Don't forget to check out our latest features!",
    "Need help? Feel free to ask!",
    "Thanks for being part of our community! ❤️",
    "New updates are coming soon! Stay tuned! 🚀",
  ]

  useEffect(() => {
    if (!open) return

    // Load auto messages
    loadAutoMessages()

    // Listen to chat messages
    const q = query(collection(db, "chat"), orderBy("timestamp", "asc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages: Message[] = []
      snapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() } as Message)
      })
      setMessages(newMessages)
    })

    return unsubscribe
  }, [open])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadAutoMessages = async () => {
    try {
      const q = query(collection(db, "autoMessages"))
      const snapshot = await getDocs(q)
      const messages: string[] = []
      snapshot.forEach((doc) => {
        messages.push(doc.data().text)
      })
      setAutoMessages(messages.length > 0 ? messages : defaultAutoMessages)
    } catch (error) {
      setAutoMessages(defaultAutoMessages)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !userProfile) return

    try {
      await addDoc(collection(db, "chat"), {
        text: newMessage,
        senderId: userProfile.uid,
        senderName: userProfile.displayName,
        senderRole: userProfile.role,
        timestamp: serverTimestamp(),
        isAutoMessage: false,
      })
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const sendAutoMessage = async (message: string) => {
    if (!userProfile || userProfile.role !== "admin") return

    try {
      await addDoc(collection(db, "chat"), {
        text: message,
        senderId: userProfile.uid,
        senderName: "Admin",
        senderRole: "admin",
        timestamp: serverTimestamp(),
        isAutoMessage: true,
      })
    } catch (error) {
      console.error("Error sending auto message:", error)
    }
  }

  const addAutoMessage = async () => {
    if (!newAutoMessage.trim() || !userProfile || userProfile.role !== "admin") return

    try {
      await addDoc(collection(db, "autoMessages"), {
        text: newAutoMessage,
        createdBy: userProfile.uid,
        timestamp: serverTimestamp(),
      })
      setAutoMessages([...autoMessages, newAutoMessage])
      setNewAutoMessage("")
    } catch (error) {
      console.error("Error adding auto message:", error)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>Community Chat</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Admin Auto Messages Panel */}
          {userProfile?.role === "admin" && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-sm">Admin Quick Messages</h4>
              <div className="flex flex-wrap gap-2">
                {autoMessages.map((message, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => sendAutoMessage(message)}
                    className="text-xs"
                  >
                    {message}
                  </Button>
                ))}
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add new auto message..."
                  value={newAutoMessage}
                  onChange={(e) => setNewAutoMessage(e.target.value)}
                  className="text-sm"
                />
                <Button size="sm" onClick={addAutoMessage}>
                  Add
                </Button>
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 border rounded-lg p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.senderId === userProfile?.uid ? "flex-row-reverse space-x-reverse" : ""
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={message.senderRole === "admin" ? "bg-red-100" : "bg-blue-100"}>
                      {message.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 ${message.senderId === userProfile?.uid ? "text-right" : ""}`}>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">{message.senderName}</span>
                      <Badge variant={message.senderRole === "admin" ? "destructive" : "secondary"} className="text-xs">
                        {message.senderRole}
                      </Badge>
                      {message.isAutoMessage && (
                        <Badge variant="outline" className="text-xs">
                          Auto
                        </Badge>
                      )}
                      {message.timestamp && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div
                      className={`inline-block p-3 rounded-lg text-sm ${
                        message.senderId === userProfile?.uid
                          ? "bg-primary text-primary-foreground"
                          : message.senderRole === "admin"
                            ? "bg-red-50 border border-red-200"
                            : "bg-muted"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
