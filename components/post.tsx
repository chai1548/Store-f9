"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, Eye, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import {
  doc,
  updateDoc,
  increment,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

interface Comment {
  id: string
  text: string
  authorId: string
  authorName: string
  authorRole: "admin" | "user"
  createdAt: any
}

interface Post {
  id: string
  author: {
    uid: string
    name: string
    username: string
    avatar?: string
  }
  content: {
    text?: string
    images?: string[]
    video?: string
    videoThumbnail?: string
  }
  type: "text" | "image" | "video"
  timestamp: Date
  likes: number
  comments: number
  shares: number
  views?: number
  isLiked?: boolean
  isBookmarked?: boolean
  settings?: {
    allowComments: boolean
    allowSharing: boolean
    allowDownload: boolean
  }
}

interface PostProps {
  post: Post
}

export default function Post({ post }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false)
  const [likes, setLikes] = useState(post.likes || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)
  const { userProfile } = useAuth()

  useEffect(() => {
    if (showComments) {
      const unsubscribe = loadComments()
      return () => unsubscribe()
    }
  }, [showComments, post.id])

  const loadComments = () => {
    setCommentsLoading(true)
    const q = query(collection(db, "posts", post.id, "comments"), orderBy("createdAt", "asc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newComments: Comment[] = []
      snapshot.forEach((doc) => {
        newComments.push({ id: doc.id, ...doc.data() } as Comment)
      })
      setComments(newComments)
      setCommentsLoading(false)
    })

    return unsubscribe
  }

  const handleLike = async () => {
    if (!userProfile) return

    try {
      const newLikedState = !isLiked
      setIsLiked(newLikedState)
      setLikes(newLikedState ? likes + 1 : likes - 1)

      const postRef = doc(db, "posts", post.id)
      await updateDoc(postRef, {
        likes: increment(newLikedState ? 1 : -1),
      })
    } catch (error) {
      console.error("Error updating like:", error)
      setIsLiked(!isLiked)
      setLikes(isLiked ? likes + 1 : likes - 1)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !userProfile) return

    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        text: newComment,
        authorId: userProfile.uid,
        authorName: userProfile.displayName,
        authorRole: userProfile.role,
        createdAt: serverTimestamp(),
      })

      const postRef = doc(db, "posts", post.id)
      await updateDoc(postRef, {
        comments: increment(1),
      })

      setNewComment("")
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked)
  }

  const handleShare = async () => {
    if (!post.settings?.allowSharing) return

    try {
      const postRef = doc(db, "posts", post.id)
      await updateDoc(postRef, {
        shares: increment(1),
      })
    } catch (error) {
      console.error("Error updating shares:", error)
    }
  }

  const renderImages = () => {
    if (!post.content.images || post.content.images.length === 0) return null

    const images = post.content.images
    const imageCount = images.length

    if (imageCount === 1) {
      return (
        <div className="relative w-full h-96 rounded-lg overflow-hidden mb-4">
          <Image src={images[0] || "/placeholder.svg"} alt="Post image" fill className="object-cover" />
        </div>
      )
    }

    if (imageCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
              <Image src={image || "/placeholder.svg"} alt={`Post image ${index + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )
    }

    if (imageCount === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="relative aspect-square rounded-lg overflow-hidden">
            <Image src={images[0] || "/placeholder.svg"} alt="Post image 1" fill className="object-cover" />
          </div>
          <div className="grid grid-rows-2 gap-2">
            {images.slice(1, 3).map((image, index) => (
              <div key={index + 1} className="relative aspect-square rounded-lg overflow-hidden">
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`Post image ${index + 2}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )
    }

    // 4 or more images
    return (
      <div className="grid grid-cols-2 gap-2 mb-4">
        {images.slice(0, 3).map((image, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
            <Image src={image || "/placeholder.svg"} alt={`Post image ${index + 1}`} fill className="object-cover" />
          </div>
        ))}
        <div className="relative aspect-square rounded-lg overflow-hidden">
          <Image src={images[3] || "/placeholder.svg"} alt="Post image 4" fill className="object-cover" />
          {imageCount > 4 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white text-xl font-bold">+{imageCount - 4}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader className="flex flex-row items-center space-y-0 pb-3">
        <div className="flex items-center space-x-3 flex-1">
          <Avatar>
            <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
            <AvatarFallback>{post.author.name?.charAt(0) || "U"}</AvatarFallback>
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
        {post.content.text && (
          <p className="mb-4 text-sm leading-relaxed">
            {post.content.text.length > 200 ? (
              <>
                {post.content.text.slice(0, 200)}...
                <Link href={`/post/${post.id}`} className="text-primary hover:underline ml-1">
                  Read more
                </Link>
              </>
            ) : (
              post.content.text
            )}
          </p>
        )}

        {renderImages()}

        {post.content.video && (
          <div className="mb-4 relative group">
            <video
              controls
              className="w-full rounded-lg"
              poster={post.content.videoThumbnail || "/placeholder.svg?height=300&width=500"}
              preload="metadata"
            >
              <source src={post.content.video} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {/* Video overlay info */}
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">Video</div>
            {/* Play button overlay when not playing */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-black/50 rounded-full p-3">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* View Post Link */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center space-x-4">
            {post.views && (
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{post.views} views</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/post/${post.id}`} className="flex items-center space-x-1">
              <ExternalLink className="h-4 w-4" />
              <span>View Post</span>
            </Link>
          </Button>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleLike} className={isLiked ? "text-red-500" : ""}>
              <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
              {likes}
            </Button>
            {post.settings?.allowComments !== false && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className={showComments ? "text-blue-500" : ""}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {post.comments || comments.length}
              </Button>
            )}
            {post.settings?.allowSharing !== false && (
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                {post.shares || 0}
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleBookmark} className={isBookmarked ? "text-blue-500" : ""}>
            <Bookmark className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
          </Button>
        </div>

        {/* Quick Comments Preview */}
        {showComments && post.settings?.allowComments !== false && (
          <div className="w-full space-y-4">
            <Separator />

            {/* Add Comment */}
            {userProfile && (
              <div className="flex space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userProfile.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Comments Preview (show only first 2) */}
            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading comments...</p>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.slice(0, 2).map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">{comment.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium">{comment.authorName}</span>
                          <Badge
                            variant={comment.authorRole === "admin" ? "destructive" : "secondary"}
                            className="text-xs h-4"
                          >
                            {comment.authorRole}
                          </Badge>
                        </div>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {comments.length > 2 && (
                  <Button variant="ghost" size="sm" asChild className="w-full">
                    <Link href={`/post/${post.id}`}>View all {comments.length} comments</Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
