"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Post {
  id: string
  author: {
    name: string
    username: string
    avatar?: string
  }
  content: {
    text?: string
    images?: string[]
    video?: string
  }
  type: "text" | "image" | "video"
  timestamp: Date
  likes: number
  comments: number
  shares: number
  isLiked?: boolean
  isBookmarked?: boolean
}

interface PostProps {
  post: Post
}

export default function Post({ post }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false)
  const [likes, setLikes] = useState(post.likes)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikes(isLiked ? likes - 1 : likes + 1)
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader className="flex flex-row items-center space-y-0 pb-3">
        <div className="flex items-center space-x-3 flex-1">
          <Avatar>
            <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.author.name}</p>
            <p className="text-sm text-muted-foreground">@{post.author.username}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{post.type}</Badge>
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(post.timestamp, { addSuffix: true })}
          </span>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {post.content.text && <p className="mb-4 text-sm leading-relaxed">{post.content.text}</p>}

        {post.content.images && post.content.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {post.content.images.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`Post image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {post.content.video && (
          <div className="mb-4">
            <video controls className="w-full rounded-lg" poster="/placeholder.svg?height=300&width=500">
              <source src={post.content.video} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between pt-3 border-t">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleLike} className={isLiked ? "text-red-500" : ""}>
            <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
            {likes}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="h-4 w-4 mr-1" />
            {post.comments}
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            {post.shares}
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBookmark} className={isBookmarked ? "text-blue-500" : ""}>
          <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
        </Button>
      </CardFooter>
    </Card>
  )
}
