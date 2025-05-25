"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Send,
  MessageCircle,
  X,
  Users,
  UserPlus,
  Settings,
  Bot,
  Trash2,
  Edit,
  Crown,
  Shield,
  MicOffIcon as Mute,
  Ban,
  ImageIcon,
  Paperclip,
  Smile,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: any
  chatId: string
  messageType: "text" | "image" | "file" | "system" | "bot"
  isRead: boolean
  isEdited?: boolean
  replyTo?: string
  attachments?: string[]
}

interface QAItem {
  id: string
  question: string
  answer: string
  keywords: string[]
  isActive: boolean
  createdBy: string
  createdAt: any
  usageCount: number
}

interface ChatSystemProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EnhancedChatSystem({ open, onOpenChange }: ChatSystemProps) {
  const [activeTab, setActiveTab] = useState("community")
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [qaItems, setQAItems] = useState<QAItem[]>([])
  const [showQAManager, setShowQAManager] = useState(false)
  const [newQuestion, setNewQuestion] = useState("")
  const [newAnswer, setNewAnswer] = useState("")
  const [newKeywords, setNewKeywords] = useState("")
  const [editingQA, setEditingQA] = useState<QAItem | null>(null)
  const [chatSettings, setChatSettings] = useState({
    autoRespond: true,
    moderationEnabled: true,
    allowImages: true,
    allowFiles: true,
    slowMode: false,
    slowModeDelay: 5,
  })
  const [bannedUsers, setBannedUsers] = useState<string[]>([])
  const [mutedUsers, setMutedUsers] = useState<string[]>([])
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    if (activeTab === "community") {
      loadMessages()
      loadQAItems()
      loadChatSettings()
    }
  }, [open, activeTab])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadMessages = () => {
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

  const loadQAItems = async () => {
    try {
      const q = query(collection(db, "qaItems"), orderBy("createdAt", "desc"))
      const snapshot = await getDocs(q)
      const items: QAItem[] = []
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as QAItem)
      })
      setQAItems(items)
    } catch (error) {
      console.error("Error loading Q&A items:", error)
    }
  }

  const loadChatSettings = async () => {
    try {
      const settingsDoc = await getDocs(query(collection(db, "chatSettings")))
      if (!settingsDoc.empty) {
        const settings = settingsDoc.docs[0].data()
        setChatSettings({ ...chatSettings, ...settings })
      }
    } catch (error) {
      console.error("Error loading chat settings:", error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !userProfile) return
    if (mutedUsers.includes(userProfile.uid)) {
      toast({
        title: "You are muted",
        description: "You cannot send messages at this time.",
        variant: "destructive",
      })
      return
    }

    try {
      // Check for auto-response
      const autoResponse = findAutoResponse(newMessage)

      // Send user message
      await addDoc(collection(db, "chat"), {
        text: newMessage,
        senderId: userProfile.uid,
        senderName: userProfile.displayName,
        senderRole: userProfile.role,
        timestamp: serverTimestamp(),
        messageType: "text",
        isRead: false,
      })

      // Send auto-response if found
      if (autoResponse && chatSettings.autoRespond) {
        setTimeout(async () => {
          await addDoc(collection(db, "chat"), {
            text: autoResponse.answer,
            senderId: "bot",
            senderName: "AI Assistant",
            senderRole: "bot",
            timestamp: serverTimestamp(),
            messageType: "bot",
            isRead: false,
          })

          // Update usage count
          await updateDoc(doc(db, "qaItems", autoResponse.id), {
            usageCount: autoResponse.usageCount + 1,
          })
        }, 1000)
      }

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const findAutoResponse = (message: string): QAItem | null => {
    const messageLower = message.toLowerCase()

    for (const qa of qaItems) {
      if (!qa.isActive) continue

      // Check if any keyword matches
      const hasKeywordMatch = qa.keywords.some((keyword) => messageLower.includes(keyword.toLowerCase()))

      // Check if question is similar
      const questionSimilarity = calculateSimilarity(messageLower, qa.question.toLowerCase())

      if (hasKeywordMatch || questionSimilarity > 0.7) {
        return qa
      }
    }

    return null
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.split(" ")
    const words2 = str2.split(" ")
    const commonWords = words1.filter((word) => words2.includes(word))
    return commonWords.length / Math.max(words1.length, words2.length)
  }

  const addQAItem = async () => {
    if (!newQuestion.trim() || !newAnswer.trim() || !userProfile) return

    try {
      const keywords = newKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k)

      await addDoc(collection(db, "qaItems"), {
        question: newQuestion,
        answer: newAnswer,
        keywords,
        isActive: true,
        createdBy: userProfile.uid,
        createdAt: serverTimestamp(),
        usageCount: 0,
      })

      setNewQuestion("")
      setNewAnswer("")
      setNewKeywords("")
      loadQAItems()

      toast({
        title: "Q&A item added",
        description: "Auto-response has been created successfully.",
      })
    } catch (error) {
      console.error("Error adding Q&A item:", error)
      toast({
        title: "Error",
        description: "Failed to add Q&A item.",
        variant: "destructive",
      })
    }
  }

  const updateQAItem = async () => {
    if (!editingQA || !newQuestion.trim() || !newAnswer.trim()) return

    try {
      const keywords = newKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k)

      await updateDoc(doc(db, "qaItems", editingQA.id), {
        question: newQuestion,
        answer: newAnswer,
        keywords,
      })

      setEditingQA(null)
      setNewQuestion("")
      setNewAnswer("")
      setNewKeywords("")
      loadQAItems()

      toast({
        title: "Q&A item updated",
        description: "Auto-response has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating Q&A item:", error)
      toast({
        title: "Error",
        description: "Failed to update Q&A item.",
        variant: "destructive",
      })
    }
  }

  const deleteQAItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "qaItems", id))
      loadQAItems()
      toast({
        title: "Q&A item deleted",
        description: "Auto-response has been removed.",
      })
    } catch (error) {
      console.error("Error deleting Q&A item:", error)
      toast({
        title: "Error",
        description: "Failed to delete Q&A item.",
        variant: "destructive",
      })
    }
  }

  const toggleQAActive = async (id: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, "qaItems", id), { isActive: !isActive })
      loadQAItems()
    } catch (error) {
      console.error("Error toggling Q&A item:", error)
    }
  }

  const muteUser = async (userId: string, userName: string) => {
    if (!userProfile || userProfile.role !== "admin") return

    try {
      await addDoc(collection(db, "chat"), {
        text: `${userName} has been muted by admin`,
        senderId: "system",
        senderName: "System",
        senderRole: "system",
        timestamp: serverTimestamp(),
        messageType: "system",
        isRead: false,
      })

      setMutedUsers([...mutedUsers, userId])
      toast({
        title: "User muted",
        description: `${userName} has been muted.`,
      })
    } catch (error) {
      console.error("Error muting user:", error)
    }
  }

  const banUser = async (userId: string, userName: string) => {
    if (!userProfile || userProfile.role !== "admin") return

    try {
      await addDoc(collection(db, "chat"), {
        text: `${userName} has been banned by admin`,
        senderId: "system",
        senderName: "System",
        senderRole: "system",
        timestamp: serverTimestamp(),
        messageType: "system",
        isRead: false,
      })

      setBannedUsers([...bannedUsers, userId])
      toast({
        title: "User banned",
        description: `${userName} has been banned.`,
      })
    } catch (error) {
      console.error("Error banning user:", error)
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!userProfile || userProfile.role !== "admin") return

    try {
      await deleteDoc(doc(db, "chat", messageId))
      toast({
        title: "Message deleted",
        description: "The message has been removed.",
      })
    } catch (error) {
      console.error("Error deleting message:", error)
    }
  }

  const startEditingQA = (qa: QAItem) => {
    setEditingQA(qa)
    setNewQuestion(qa.question)
    setNewAnswer(qa.answer)
    setNewKeywords(qa.keywords.join(", "))
  }

  const cancelEditingQA = () => {
    setEditingQA(null)
    setNewQuestion("")
    setNewAnswer("")
    setNewKeywords("")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[700px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>Enhanced Chat System</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            {userProfile?.role === "admin" && (
              <>
                <Dialog open={showQAManager} onOpenChange={setShowQAManager}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Bot className="h-4 w-4 mr-2" />
                      Q&A Manager
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Auto Q&A Manager</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="manage" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manage">Manage Q&A</TabsTrigger>
                        <TabsTrigger value="add">Add New</TabsTrigger>
                      </TabsList>

                      <TabsContent value="manage" className="space-y-4">
                        <ScrollArea className="h-96">
                          <div className="space-y-4">
                            {qaItems.map((qa) => (
                              <Card key={qa.id}>
                                <CardContent className="pt-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="font-medium">{qa.question}</h4>
                                        <Badge variant={qa.isActive ? "default" : "secondary"}>
                                          {qa.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                        <Badge variant="outline">Used {qa.usageCount} times</Badge>
                                      </div>
                                      <p className="text-sm text-muted-foreground mb-2">{qa.answer}</p>
                                      <div className="flex flex-wrap gap-1">
                                        {qa.keywords.map((keyword, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {keyword}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        checked={qa.isActive}
                                        onCheckedChange={() => toggleQAActive(qa.id, qa.isActive)}
                                      />
                                      <Button variant="outline" size="sm" onClick={() => startEditingQA(qa)}>
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button variant="destructive" size="sm" onClick={() => deleteQAItem(qa.id)}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsContent>

                      <TabsContent value="add" className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="question">Question</Label>
                            <Input
                              id="question"
                              placeholder="What question should trigger this response?"
                              value={newQuestion}
                              onChange={(e) => setNewQuestion(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="answer">Answer</Label>
                            <Textarea
                              id="answer"
                              placeholder="What should the bot respond with?"
                              value={newAnswer}
                              onChange={(e) => setNewAnswer(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                            <Input
                              id="keywords"
                              placeholder="help, support, how to, guide"
                              value={newKeywords}
                              onChange={(e) => setNewKeywords(e.target.value)}
                            />
                          </div>
                          <div className="flex space-x-2">
                            {editingQA ? (
                              <>
                                <Button onClick={updateQAItem}>Update Q&A</Button>
                                <Button variant="outline" onClick={cancelEditingQA}>
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button onClick={addQAItem}>Add Q&A</Button>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="community" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Community Chat</span>
              </TabsTrigger>
              <TabsTrigger value="private" className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>Private Messages</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="community" className="flex-1 flex flex-col space-y-4">
              {/* Chat Settings Bar */}
              {userProfile?.role === "admin" && (
                <div className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={chatSettings.autoRespond}
                      onCheckedChange={(checked) => setChatSettings({ ...chatSettings, autoRespond: checked })}
                    />
                    <Label className="text-sm">Auto-respond</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={chatSettings.moderationEnabled}
                      onCheckedChange={(checked) => setChatSettings({ ...chatSettings, moderationEnabled: checked })}
                    />
                    <Label className="text-sm">Moderation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={chatSettings.slowMode}
                      onCheckedChange={(checked) => setChatSettings({ ...chatSettings, slowMode: checked })}
                    />
                    <Label className="text-sm">Slow mode</Label>
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
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.senderAvatar || "/placeholder.svg"} />
                          <AvatarFallback
                            className={
                              message.messageType === "bot"
                                ? "bg-blue-100"
                                : message.messageType === "system"
                                  ? "bg-gray-100"
                                  : message.senderRole === "admin"
                                    ? "bg-red-100"
                                    : "bg-blue-100"
                            }
                          >
                            {message.messageType === "bot"
                              ? "🤖"
                              : message.messageType === "system"
                                ? "⚙️"
                                : message.senderName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Admin controls */}
                        {userProfile?.role === "admin" &&
                          message.senderId !== userProfile.uid &&
                          message.messageType === "text" && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Shield className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => deleteMessage(message.id)}>
                                  <Trash2 className="h-3 w-3 mr-2" />
                                  Delete Message
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => muteUser(message.senderId, message.senderName)}>
                                  <Mute className="h-3 w-3 mr-2" />
                                  Mute User
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => banUser(message.senderId, message.senderName)}>
                                  <Ban className="h-3 w-3 mr-2" />
                                  Ban User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                      </div>

                      <div className={`flex-1 ${message.senderId === userProfile?.uid ? "text-right" : ""}`}>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">{message.senderName}</span>
                          {message.messageType === "bot" && (
                            <Badge variant="secondary" className="text-xs">
                              AI Assistant
                            </Badge>
                          )}
                          {message.senderRole === "admin" && message.messageType !== "bot" && (
                            <Badge variant="destructive" className="text-xs">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
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
                            message.messageType === "bot"
                              ? "bg-blue-50 border border-blue-200 dark:bg-blue-900/20"
                              : message.messageType === "system"
                                ? "bg-gray-50 border border-gray-200 dark:bg-gray-900/20"
                                : message.senderId === userProfile?.uid
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
              <div className="space-y-2">
                {/* Attachment buttons */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Image
                  </Button>
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4 mr-2" />
                    File
                  </Button>
                  <Button variant="outline" size="sm">
                    <Smile className="h-4 w-4 mr-2" />
                    Emoji
                  </Button>
                </div>

                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    disabled={mutedUsers.includes(userProfile?.uid || "")}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || mutedUsers.includes(userProfile?.uid || "")}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {mutedUsers.includes(userProfile?.uid || "") && (
                  <p className="text-sm text-red-500">You are currently muted and cannot send messages.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="private" className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Private Messages</h3>
                <p className="text-muted-foreground mb-6">Start private conversations with other users</p>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
