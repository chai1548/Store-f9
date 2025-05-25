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
import { Send, ExternalLink } from "lucide-react"
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
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import PostActions from "@/components/post-actions"

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
  compact?: boolean
}

export default function Post({ post, compact = false }: PostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false)
  const [likes, setLikes] = useState(post.likes || 0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)
  const { userProfile } = useAuth()
  const { toast } = useToast()

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
    toast({
      title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
      description: isBookmarked ? "Post removed from your bookmarks" : "Post saved to your bookmarks",
    })
  }

  const handleShare = async () => {
    if (!post.settings?.allowSharing) return

    try {
      const postRef = doc(db, "posts", post.id)
      await updateDoc(postRef, {
        shares: increment(1),
      })

      const url = `${window.location.origin}/post/${post.id}`
      await navigator.clipboard.writeText(url)

      toast({
        title: "Link copied!",
        description: "Post link has been copied to your clipboard.",
      })
    } catch (error) {
      console.error("Error sharing post:", error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "posts", post.id))
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting post:", error)
      toast({
        title: "Error",
        description: "Failed to delete post.",
        variant: "destructive",
      })
    }
  }

  const renderImages = () => {
    if (!post.content.images || post.content.images.length === 0) return null

    const images = post.content.images
    const imageCount = images.length

    if (imageCount === 1) {
      return (
        <div className={`relative w-full ${compact ? "h-48" : "h-96"} rounded-lg overflow-hidden mb-4`}>
          <Image src={images[0] || "/placeholder.svg"} alt="Post image" fill className="object-cover" />
        </div>
      )
    }

    if (imageCount === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {images.map((image, index) => (
            <div
              key={index}
              className={`relative ${compact ? "aspect-video" : "aspect-square"} rounded-lg overflow-hidden`}
            >
              <Image src={image || "/placeholder.svg"} alt={`Post image ${index + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )
    }

    if (imageCount === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className={`relative ${compact ? "aspect-video" : "aspect-square"} rounded-lg overflow-hidden`}>
            <Image src={images[0] || "/placeholder.svg"} alt="Post image 1" fill className="object-cover" />
          </div>
          <div className="grid grid-rows-2 gap-2">
            {images.slice(1, 3).map((image, index) => (
              <div
                key={index + 1}
                className={`relative ${compact ? "aspect-video" : "aspect-square"} rounded-lg overflow-hidden`}
              >
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
          <div
            key={index}
            className={`relative ${compact ? "aspect-video" : "aspect-square"} rounded-lg overflow-hidden`}
          >
            <Image src={image || "/placeholder.svg"} alt={`Post image ${index + 1}`} fill className="object-cover" />
          </div>
        ))}
        <div className={`relative ${compact ? "aspect-video" : "aspect-square"} rounded-lg overflow-hidden`}>
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
    <Card className={`w-full ${compact ? "max-w-lg" : "max-w-2xl"} mx-auto mb-4 sm:mb-6`}>
      <CardHeader className={`flex flex-row items-center space-y-0 ${compact ? "pb-2" : "pb-3"}`}>
        <div className="flex items-center space-x-3 flex-1">
          <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
            <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
            <AvatarFallback className={compact ? "text-xs" : "text-sm"}>
              {post.author.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className={`font-semibold ${compact ? "text-sm" : "text-base"}`}>{post.author.name}</p>
            <p className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"}`}>@{post.author.username}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className={compact ? "text-xs px-2 py-0.5" : ""}>
            {post.type}
          </Badge>
          <span className={`text-muted-foreground ${compact ? "text-xs" : "text-sm"} hidden sm:inline`}>
            {formatDistanceToNow(post.timestamp, { addSuffix: true })}
          </span>
        </div>
      </CardHeader>

      <CardContent className={compact ? "pb-2" : "pb-3"}>
        {post.content.text && (
          <p className={`mb-4 leading-relaxed ${compact ? "text-sm" : "text-base"}`}>
            {post.content.text.length > (compact ? 100 : 200) ? (
              <>
                {post.content.text.slice(0, compact ? 100 : 200)}...
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
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">Video</div>
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

        {/* View Post Link - Only show on mobile or compact view */}
        {(compact || window.innerWidth < 640) && (
          <div className="flex items-center justify-end text-sm text-muted-foreground mb-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/post/${post.id}`} className="flex items-center space-x-1">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View</span>
              </Link>
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 pt-3 border-t">
        <PostActions
          post={post}
          isLiked={isLiked}
          isBookmarked={isBookmarked}
          likes={likes}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onShare={handleShare}
          onDelete={handleDelete}
          showComments={showComments}
          onToggleComments={() => setShowComments(!showComments)}
          commentsCount={comments.length}
          compact={compact}
        />

        {/* Quick Comments Preview */}
        {showComments && post.settings?.allowComments !== false && (
          <div className="w-full space-y-4">
            <Separator />

            {/* Add Comment */}
            {userProfile && (
              <div className="flex space-x-2">
                <Avatar className={compact ? "h-6 w-6" : "h-8 w-8"}>
                  <AvatarFallback className={compact ? "text-xs" : "text-sm"}>
                    {userProfile.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex space-x-2">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    className={`flex-1 ${compact ? "h-8 text-sm" : ""}`}
                  />
                  <Button size={compact ? "sm" : "default"} onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                  </Button>
                </div>
              </div>
            )}

            {/* Comments Preview (show only first 2) */}
            {commentsLoading ? (
              <p className={`text-muted-foreground ${compact ? "text-sm" : ""}`}>Loading comments...</p>
            ) : comments.length > 0 ? (
              <div className="space-y-3">
                {comments.slice(0, 2).map((comment) => (
                  <div key={comment.id} className="flex space-x-2">
                    <Avatar className={compact ? "h-5 w-5" : "h-6 w-6"}>
                      <AvatarFallback className="text-xs">{comment.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg p-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>{comment.authorName}</span>
                          <Badge
                            variant={comment.authorRole === "admin" ? "destructive" : "secondary"}
                            className="text-xs h-4"
                          >
                            {comment.authorRole}
                          </Badge>
                        </div>
                        <p className={compact ? "text-xs" : "text-sm"}>{comment.text}</p>
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
              <p className={`text-muted-foreground ${compact ? "text-sm" : ""}`}>
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
