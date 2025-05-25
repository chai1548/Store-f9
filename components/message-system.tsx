"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  ImageIcon,
  Users,
  UserPlus,
  Mic,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: Date
  type: "text" | "image" | "file" | "system"
  isRead: boolean
}

interface Chat {
  id: string
  name: string
  avatar?: string
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount: number
  isOnline: boolean
  isGroup: boolean
  participants?: string[]
}

interface User {
  id: string
  name: string
  avatar?: string
  isOnline: boolean
  lastSeen?: Date
}

export default function MessageSystem() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [showUserList, setShowUserList] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userProfile) return

    // Sample chats
    const sampleChats: Chat[] = [
      {
        id: "1",
        name: "John Doe",
        avatar: "/placeholder.svg?height=40&width=40",
        lastMessage: "Hey! How are you doing?",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
        unreadCount: 2,
        isOnline: true,
        isGroup: false,
      },
      {
        id: "2",
        name: "Jane Smith",
        avatar: "/placeholder.svg?height=40&width=40",
        lastMessage: "Thanks for the help!",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
        unreadCount: 0,
        isOnline: false,
        isGroup: false,
      },
      {
        id: "3",
        name: "Team Chat",
        avatar: "/placeholder.svg?height=40&width=40",
        lastMessage: "Meeting at 3 PM",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60),
        unreadCount: 5,
        isOnline: true,
        isGroup: true,
        participants: ["user1", "user2", "user3", "user4"],
      },
      {
        id: "4",
        name: "Sarah Wilson",
        avatar: "/placeholder.svg?height=40&width=40",
        lastMessage: "See you tomorrow!",
        lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
        unreadCount: 1,
        isOnline: true,
        isGroup: false,
      },
    ]

    // Sample users for new chats
    const sampleUsers: User[] = [
      {
        id: "user5",
        name: "Mike Brown",
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: true,
      },
      {
        id: "user6",
        name: "Lisa Davis",
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 15),
      },
      {
        id: "user7",
        name: "Alex Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        isOnline: true,
      },
    ]

    setChats(sampleChats)
    setUsers(sampleUsers)
  }, [userProfile])

  useEffect(() => {
    if (selectedChat) {
      // Sample messages for selected chat
      const sampleMessages: Message[] = [
        {
          id: "1",
          senderId: selectedChat.id,
          senderName: selectedChat.name,
          senderAvatar: selectedChat.avatar,
          content: "Hey! How are you doing?",
          timestamp: new Date(Date.now() - 1000 * 60 * 10),
          type: "text",
          isRead: true,
        },
        {
          id: "2",
          senderId: userProfile?.uid || "me",
          senderName: userProfile?.displayName || "You",
          senderAvatar: userProfile?.photoURL,
          content: "I'm doing great! Thanks for asking. How about you?",
          timestamp: new Date(Date.now() - 1000 * 60 * 8),
          type: "text",
          isRead: true,
        },
        {
          id: "3",
          senderId: selectedChat.id,
          senderName: selectedChat.name,
          senderAvatar: selectedChat.avatar,
          content: "Pretty good! Working on some exciting projects.",
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          type: "text",
          isRead: false,
        },
        {
          id: "4",
          senderId: selectedChat.id,
          senderName: selectedChat.name,
          senderAvatar: selectedChat.avatar,
          content: "Would love to catch up soon!",
          timestamp: new Date(Date.now() - 1000 * 60 * 2),
          type: "text",
          isRead: false,
        },
      ]
      setMessages(sampleMessages)
    }
  }, [selectedChat, userProfile])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !userProfile) return

    const message: Message = {
      id: Date.now().toString(),
      senderId: userProfile.uid,
      senderName: userProfile.displayName || "You",
      senderAvatar: userProfile.photoURL,
      content: newMessage,
      timestamp: new Date(),
      type: "text",
      isRead: false,
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")

    // Update chat's last message
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              lastMessage: newMessage,
              lastMessageTime: new Date(),
            }
          : chat,
      ),
    )

    toast({
      title: "Message sent",
      description: `Message sent to ${selectedChat.name}`,
    })
  }

  const startNewChat = (user: User) => {
    const existingChat = chats.find((chat) => chat.id === user.id)
    if (existingChat) {
      setSelectedChat(existingChat)
      setShowUserList(false)
      return
    }

    const newChat: Chat = {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      lastMessage: "",
      lastMessageTime: new Date(),
      unreadCount: 0,
      isOnline: user.isOnline,
      isGroup: false,
    }

    setChats((prev) => [newChat, ...prev])
    setSelectedChat(newChat)
    setShowUserList(false)
    setMessages([])
  }

  const markAsRead = (chatId: string) => {
    setChats((prev) => prev.map((chat) => (chat.id === chatId ? { ...chat, unreadCount: 0 } : chat)))
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const filteredChats = chats.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(searchQuery.toLowerCase()))

  if (!userProfile) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please Login</h1>
        <p className="text-muted-foreground">You need to be logged in to access messages.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto h-[600px] flex border rounded-lg overflow-hidden">
      {/* Chat List */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Messages</h2>
            <Button variant="outline" size="sm" onClick={() => setShowUserList(!showUserList)}>
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {showUserList ? (
            <div className="p-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Start New Chat</h3>
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 hover:bg-muted rounded-lg cursor-pointer"
                  onClick={() => startNewChat(user)}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.isOnline ? "Online" : `Last seen ${formatTime(user.lastSeen || new Date())}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`flex items-center space-x-3 p-3 hover:bg-muted rounded-lg cursor-pointer ${
                    selectedChat?.id === chat.id ? "bg-muted" : ""
                  }`}
                  onClick={() => {
                    setSelectedChat(chat)
                    markAsRead(chat.id)
                  }}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={chat.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{chat.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {chat.isOnline && !chat.isGroup && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                    {chat.isGroup && (
                      <div className="absolute bottom-0 right-0 h-4 w-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                        <Users className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{chat.name}</p>
                      {chat.lastMessageTime && (
                        <span className="text-xs text-muted-foreground">{formatTime(chat.lastMessageTime)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground truncate">{chat.lastMessage || "No messages yet"}</p>
                      {chat.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedChat.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{selectedChat.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {selectedChat.isOnline && !selectedChat.isGroup && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{selectedChat.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedChat.isGroup
                      ? `${selectedChat.participants?.length || 0} members`
                      : selectedChat.isOnline
                        ? "Online"
                        : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Info className="h-4 w-4 mr-2" />
                      Chat Info
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Delete Chat</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === userProfile.uid ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        message.senderId === userProfile.uid ? "bg-primary text-primary-foreground" : "bg-muted"
                      } rounded-lg p-3`}
                    >
                      {message.senderId !== userProfile.uid && selectedChat.isGroup && (
                        <p className="text-xs font-medium mb-1">{message.senderName}</p>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId === userProfile.uid ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
