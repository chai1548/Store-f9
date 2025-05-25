"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface SimplePostProps {
  id: string
  author: {
    name: string
    username?: string
    avatar?: string
  }
  content: string
  timestamp: Date
  likes?: number
  comments?: number
  shares?: number
  type?: string
}

export default function SimplePostCard({
  id,
  author,
  content,
  timestamp,
  likes = 0,
  comments = 0,
  shares = 0,
  type = "text",
}: SimplePostProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center space-y-0 pb-3">
        <div className="flex items-center space-x-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={author.avatar || "/placeholder.svg"} />
            <AvatarFallback>{author.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{author.name}</p>
            {author.username && <p className="text-sm text-muted-foreground">@{author.username}</p>}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{type}</Badge>
          <span className="text-sm text-muted-foreground">{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
        </div>
      </CardHeader>

      <CardContent>
        <p className="mb-4 leading-relaxed">{content}</p>

        <div className="flex items-center justify-between pt-3 border-t">
          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Heart className="h-4 w-4" />
            <span>{likes}</span>
          </Button>

          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <MessageCircle className="h-4 w-4" />
            <span>{comments}</span>
          </Button>

          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Share2 className="h-4 w-4" />
            <span>{shares}</span>
          </Button>

          <Button variant="ghost" size="sm">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
