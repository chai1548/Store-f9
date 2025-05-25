"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  updateDoc,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Send, MessageCircle, X, Users, Search, UserPlus, Phone, Video, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Message {
  id: string
  text: string
  senderId: string
  senderName: string
  senderAvatar?: string
  timestamp: any
  chatId: string
  messageType: "text" | "image" | "file"
  isRead: boolean
}

interface Chat {
  id: string
  type: "private" | "group"
  name?: string
  description?: string
  avatar?: string
  participants: string[]
  participantDetails: { [key: string]: { name: string; avatar?: string; role?: string } }
  lastMessage?: {
    text: string
    senderId: string
    timestamp: any
  }
  createdBy?: string
  admins?: string[]
  isPublic?: boolean
  createdAt: any
  unreadCount?: number
}

interface User {
  id: string
  displayName: string
  email: string
  avatar?: string
  isOnline?: boolean
  lastSeen?: any
}

interface ChatSystemProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ChatSystem({ open, onOpenChange }: ChatSystemProps) {
  const [activeTab, setActiveTab] = useState("chats")
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [chats, setChats] = useState<Chat[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showUserSearch, setShowUserSearch] = useState(false)
  const { userProfile } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Group creation states
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isPublicGroup, setIsPublicGroup] = useState(false)

  useEffect(() => {
    if (!open || !userProfile) return

    loadChats()
    loadUsers()
  }, [open, userProfile])

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id)
    }
  }, [selectedChat])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadChats = async () => {
    if (!userProfile) return

    try {
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", userProfile.uid),
        orderBy("createdAt", "desc"),
      )

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatList: Chat[] = []
        snapshot.forEach((doc) => {
          chatList.push({ id: doc.id, ...doc.data() } as Chat)
        })
        setChats(chatList)
      })

      return unsubscribe
    } catch (error) {
      console.error("Error loading chats:", error)
    }
  }

  const loadUsers = async () => {
    try {
      const q = query(collection(db, "users"))
      const snapshot = await getDocs(q)
      const userList: User[] = []
      snapshot.forEach((doc) => {
        const userData = doc.data()
        if (doc.id !== userProfile?.uid) {
          userList.push({
            id: doc.id,
            displayName: userData.displayName,
            email: userData.email,
            avatar: userData.avatar,
            isOnline: userData.isOnline || false,
            lastSeen: userData.lastSeen,
          })
        }
      })
      setUsers(userList)
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  const loadMessages = (chatId: string) => {
    const q = query(collection(db, "messages"), where("chatId", "==", chatId), orderBy("timestamp", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList: Message[] = []
      snapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() } as Message)
      })
      setMessages(messageList)
    })

    return unsubscribe
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !userProfile) return

    try {
      // Add message
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        senderId: userProfile.uid,
        senderName: userProfile.displayName,
        senderAvatar: userProfile.avatar || null,
        chatId: selectedChat.id,
        messageType: "text",
        isRead: false,
        timestamp: serverTimestamp(),
      })

      // Update chat's last message
      await updateDoc(doc(db, "chats", selectedChat.id), {
        lastMessage: {
          text: newMessage,
          senderId: userProfile.uid,
          timestamp: serverTimestamp(),
        },
      })

      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const startPrivateChat = async (userId: string) => {
    if (!userProfile) return

    try {
      // Check if chat already exists
      const existingChatQuery = query(
        collection(db, "chats"),
        where("type", "==", "private"),
        where("participants", "array-contains", userProfile.uid),
      )

      const existingChats = await getDocs(existingChatQuery)
      let existingChat = null

      existingChats.forEach((doc) => {
        const chatData = doc.data()
        if (chatData.participants.includes(userId) && chatData.participants.length === 2) {
          existingChat = { id: doc.id, ...chatData }
        }
      })

      if (existingChat) {
        setSelectedChat(existingChat as Chat)
        setActiveTab("messages")
        return
      }

      // Create new private chat
      const otherUser = users.find((u) => u.id === userId)
      if (!otherUser) return

      const newChat = {
        type: "private",
        participants: [userProfile.uid, userId],
        participantDetails: {
          [userProfile.uid]: {
            name: userProfile.displayName,
            avatar: userProfile.avatar,
          },
          [userId]: {
            name: otherUser.displayName,
            avatar: otherUser.avatar,
          },
        },
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "chats"), newChat)
      const createdChat = { id: docRef.id, ...newChat } as Chat
      setSelectedChat(createdChat)
      setActiveTab("messages")
      setShowUserSearch(false)
    } catch (error) {
      console.error("Error starting private chat:", error)
    }
  }

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0 || !userProfile) return

    try {
      const participantDetails: { [key: string]: { name: string; avatar?: string; role?: string } } = {
        [userProfile.uid]: {
          name: userProfile.displayName,
          avatar: userProfile.avatar,
          role: "admin",
        },
      }

      // Add selected users
      selectedUsers.forEach((userId) => {
        const user = users.find((u) => u.id === userId)
        if (user) {
          participantDetails[userId] = {
            name: user.displayName,
            avatar: user.avatar,
            role: "member",
          }
        }
      })

      const newGroup = {
        type: "group",
        name: groupName,
        description: groupDescription,
        participants: [userProfile.uid, ...selectedUsers],
        participantDetails,
        createdBy: userProfile.uid,
        admins: [userProfile.uid],
        isPublic: isPublicGroup,
        createdAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "chats"), newGroup)
      const createdGroup = { id: docRef.id, ...newGroup } as Chat
      setSelectedChat(createdGroup)
      setActiveTab("messages")

      // Reset form
      setGroupName("")
      setGroupDescription("")
      setSelectedUsers([])
      setIsPublicGroup(false)
      setShowCreateGroup(false)
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === "group") {
      return chat.name || "Group Chat"
    } else {
      const otherParticipant = chat.participants.find((p) => p !== userProfile?.uid)
      return chat.participantDetails[otherParticipant || ""]?.name || "Unknown User"
    }
  }

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === "group") {
      return chat.avatar || "/placeholder.svg?height=40&width=40"
    } else {
      const otherParticipant = chat.participants.find((p) => p !== userProfile?.uid)
      return chat.participantDetails[otherParticipant || ""]?.avatar || "/placeholder.svg?height=40&width=40"
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredChats = chats.filter((chat) =>
    getChatDisplayName(chat).toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl h-[700px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>Messages</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex">
          <div className="w-1/3 border-r pr-4 flex flex-col">
            {/* Chat List Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Chats</h3>
              <div className="flex space-x-2">
                <Dialog open={showUserSearch} onOpenChange={setShowUserSearch}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Chat</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {filteredUsers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg cursor-pointer"
                              onClick={() => startPrivateChat(user.id)}
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{user.displayName}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                              {user.isOnline && <div className="w-3 h-3 bg-green-500 rounded-full" />}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          placeholder="Enter group name..."
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="group-description">Description (Optional)</Label>
                        <Textarea
                          id="group-description"
                          placeholder="Enter group description..."
                          value={groupDescription}
                          onChange={(e) => setGroupDescription(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="public-group">Public Group</Label>
                        <Switch id="public-group" checked={isPublicGroup} onCheckedChange={setIsPublicGroup} />
                      </div>
                      <div>
                        <Label>Add Members</Label>
                        <div className="relative mt-2">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <ScrollArea className="h-32 mt-2">
                          <div className="space-y-2">
                            {filteredUsers.map((user) => (
                              <div
                                key={user.id}
                                className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${
                                  selectedUsers.includes(user.id) ? "bg-primary/10" : "hover:bg-muted"
                                }`}
                                onClick={() => {
                                  if (selectedUsers.includes(user.id)) {
                                    setSelectedUsers(selectedUsers.filter((id) => id !== user.id))
                                  } else {
                                    setSelectedUsers([...selectedUsers, user.id])
                                  }
                                }}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">{user.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{user.displayName}</p>
                                </div>
                                {selectedUsers.includes(user.id) && (
                                  <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                      <Button onClick={createGroup} disabled={!groupName.trim() || selectedUsers.length === 0}>
                        Create Group ({selectedUsers.length} members)
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Chat List */}
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChat?.id === chat.id ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={getChatAvatar(chat) || "/placeholder.svg"} />
                        <AvatarFallback>{getChatDisplayName(chat).charAt(0)}</AvatarFallback>
                      </Avatar>
                      {chat.type === "group" && (
                        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                          <Users className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{getChatDisplayName(chat)}</p>
                        {chat.lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(chat.lastMessage.timestamp?.toDate() || new Date(), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">
                          {chat.lastMessage?.text || "No messages yet"}
                        </p>
                        {chat.unreadCount && chat.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {chat.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {chat.type === "group" && (
                        <p className="text-xs text-muted-foreground">{chat.participants.length} members</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getChatAvatar(selectedChat) || "/placeholder.svg"} />
                      <AvatarFallback>{getChatDisplayName(selectedChat).charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getChatDisplayName(selectedChat)}</p>
                      {selectedChat.type === "group" ? (
                        <p className="text-sm text-muted-foreground">{selectedChat.participants.length} members</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Online</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-3 ${
                          message.senderId === userProfile?.uid ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.senderAvatar || "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">{message.senderName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className={`flex-1 ${message.senderId === userProfile?.uid ? "text-right" : ""}`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">{message.senderName}</span>
                            {message.timestamp && (
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <div
                            className={`inline-block p-3 rounded-lg text-sm max-w-xs ${
                              message.senderId === userProfile?.uid ? "bg-primary text-primary-foreground" : "bg-muted"
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
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Select a chat to start messaging</p>
                  <p className="text-muted-foreground">Choose from your existing conversations or start a new one</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
