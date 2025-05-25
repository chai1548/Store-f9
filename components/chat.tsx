"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input, Textarea } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Send, MessageCircle, X, Plus, Trash2, Bot, Users, UserPlus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import ChatSystem from "@/components/chat-system"

interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  senderRole: "admin" | "user"
  timestamp: any
  isAutoMessage?: boolean
}

interface AutoMessage {
  id: string
  text: string
  createdBy: string
  timestamp: any
}

interface ChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function Chat({ open, onOpenChange }: ChatProps) {
  const [activeTab, setActiveTab] = useState("community")
  const [showChatSystem, setShowChatSystem] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [autoMessages, setAutoMessages] = useState<AutoMessage[]>([])
  const [newAutoMessage, setNewAutoMessage] = useState("")
  const { userProfile } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Default auto messages
  const defaultAutoMessages = [
    "Welcome to SocialApp! 🎉 Thanks for joining our community!",
    "Don't forget to check out our latest features and updates! 🚀",
    "Need help? Feel free to ask questions anytime! 💬",
    "Thanks for being part of our amazing community! ❤️",
    "New updates are coming soon! Stay tuned! ⭐",
    "Remember to follow community guidelines for a better experience! 📋",
    "Share your thoughts and connect with other users! 🤝",
    "Enjoy exploring and creating amazing content! 🎨",
  ]

  useEffect(() => {
    if (!open) return

    if (activeTab === "community") {
      loadAutoMessages()
      const q = query(collection(db, "chat"), orderBy("timestamp", "asc"))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages: Message[] = []
        snapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, ...doc.data() } as Message)
        })
        setMessages(newMessages)
      })
      return unsubscribe
    }
  }, [open, activeTab])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadAutoMessages = async () => {
    try {
      const q = query(collection(db, "autoMessages"), orderBy("timestamp", "desc"))
      const snapshot = await getDocs(q)
      const messages: AutoMessage[] = []
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as AutoMessage)
      })
      setAutoMessages(messages)

      if (messages.length === 0 && userProfile?.role === "admin") {
        await createDefaultAutoMessages()
      }
    } catch (error) {
      console.error("Error loading auto messages:", error)
    }
  }

  const createDefaultAutoMessages = async () => {
    try {
      for (const message of defaultAutoMessages) {
        await addDoc(collection(db, "autoMessages"), {
          text: message,
          createdBy: userProfile?.uid,
          timestamp: serverTimestamp(),
        })
      }
      loadAutoMessages()
    } catch (error) {
      console.error("Error creating default auto messages:", error)
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
      setNewAutoMessage("")
      loadAutoMessages()
    } catch (error) {
      console.error("Error adding auto message:", error)
    }
  }

  const deleteAutoMessage = async (messageId: string) => {
    if (!userProfile || userProfile.role !== "admin") return

    try {
      await deleteDoc(doc(db, "autoMessages", messageId))
      loadAutoMessages()
    } catch (error) {
      console.error("Error deleting auto message:", error)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl h-[700px] flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <CardTitle>Chat</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="community" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Community</span>
                </TabsTrigger>
                <TabsTrigger value="private" className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Private & Groups</span>
                </TabsTrigger>
                {userProfile?.role === "admin" && (
                  <TabsTrigger value="admin" className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span>Admin</span>
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="community" className="flex-1 flex flex-col space-y-4">
                {/* Quick Auto Messages for Admin */}
                {userProfile?.role === "admin" && (
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                    <h4 className="font-semibold text-sm flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <span>Quick Auto Messages</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {autoMessages.slice(0, 8).map((message) => (
                        <Button
                          key={message.id}
                          variant="outline"
                          size="sm"
                          onClick={() => sendAutoMessage(message.text)}
                          className="text-xs text-left justify-start h-auto p-2"
                        >
                          <span className="truncate">{message.text}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Community Messages */}
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
                            <Badge
                              variant={message.senderRole === "admin" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
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
                            className={`inline-block p-3 rounded-lg text-sm max-w-xs ${
                              message.senderId === userProfile?.uid
                                ? "bg-primary text-primary-foreground"
                                : message.senderRole === "admin"
                                  ? "bg-red-50 border border-red-200 dark:bg-red-900/20"
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
              </TabsContent>

              <TabsContent value="private" className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Private Messages & Groups</h3>
                  <p className="text-muted-foreground mb-6">
                    Start private conversations or create groups with other users
                  </p>
                  <div className="space-y-3">
                    <Button onClick={() => setShowChatSystem(true)} className="w-full">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Start Private Chat
                    </Button>
                    <Button onClick={() => setShowChatSystem(true)} variant="outline" className="w-full">
                      <Users className="h-4 w-4 mr-2" />
                      Create Group Chat
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {userProfile?.role === "admin" && (
                <TabsContent value="admin" className="flex-1 flex flex-col space-y-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Manage Auto Messages</h3>

                    {/* Add New Auto Message */}
                    <div className="border rounded-lg p-4 space-y-3">
                      <h4 className="font-medium">Add New Auto Message</h4>
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Enter new auto message..."
                          value={newAutoMessage}
                          onChange={(e) => setNewAutoMessage(e.target.value)}
                          className="flex-1"
                          rows={2}
                        />
                        <Button onClick={addAutoMessage} disabled={!newAutoMessage.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Auto Messages List */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Current Auto Messages ({autoMessages.length})</h4>
                      <ScrollArea className="max-h-96">
                        <div className="space-y-2">
                          {autoMessages.map((message) => (
                            <div key={message.id} className="flex items-start justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm">{message.text}</p>
                                {message.timestamp && (
                                  <span className="text-xs text-muted-foreground">
                                    Added {formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })}
                                  </span>
                                )}
                              </div>
                              <div className="flex space-x-2 ml-2">
                                <Button variant="outline" size="sm" onClick={() => sendAutoMessage(message.text)}>
                                  Send
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => deleteAutoMessage(message.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Private Chat System */}
      <ChatSystem open={showChatSystem} onOpenChange={setShowChatSystem} />
    </>
  )
}
