"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Heart, MessageCircle, Share2, Bookmark, Send, Eye, Download, ExternalLink } from "lucide-react"
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
import { useToast } from "@/hooks/use-toast"

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

interface PostDetailViewProps {
  post: Post
}

export default function PostDetailView({ post }: PostDetailViewProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false)
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false)
  const [likes, setLikes] = useState(post.likes || 0)
  const [views, setViews] = useState(post.views || 0)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const { userProfile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    // Increment view count when post is viewed
    incrementViewCount()

    // Load comments
    const unsubscribe = loadComments()
    return () => unsubscribe()
  }, [post.id])

  const incrementViewCount = async () => {
    try {
      const postRef = doc(db, "posts", post.id)
      await updateDoc(postRef, {
        views: increment(1),
      })
      setViews((prev) => prev + 1)
    } catch (error) {
      console.error("Error updating view count:", error)
    }
  }

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
      toast({
        title: "Comment added!",
        description: "Your comment has been posted successfully.",
      })
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      })
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

      // Copy link to clipboard
      const url = `${window.location.origin}/post/${post.id}`
      await navigator.clipboard.writeText(url)

      toast({
        title: "Link copied!",
        description: "Post link has been copied to your clipboard.",
      })
    } catch (error) {
      console.error("Error sharing post:", error)
      toast({
        title: "Error",
        description: "Failed to share post.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadImage = async (imageUrl: string, index: number) => {
    if (!post.settings?.allowDownload) {
      toast({
        title: "Download not allowed",
        description: "The author has disabled downloads for this post.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `image-${index + 1}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download started",
        description: "Image download has started.",
      })
    } catch (error) {
      console.error("Error downloading image:", error)
      toast({
        title: "Download failed",
        description: "Failed to download image.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadVideo = async (videoUrl: string) => {
    if (!post.settings?.allowDownload) {
      toast({
        title: "Download not allowed",
        description: "The author has disabled downloads for this post.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(videoUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `video-${Date.now()}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download started",
        description: "Video download has started.",
      })
    } catch (error) {
      console.error("Error downloading video:", error)
      toast({
        title: "Download failed",
        description: "Failed to download video.",
        variant: "destructive",
      })
    }
  }

  const renderImageGallery = () => {
    if (!post.content.images || post.content.images.length === 0) return null

    return (
      <div className="space-y-4 mb-6">
        <h3 className="font-semibold">Images ({post.content.images.length})</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {post.content.images.map((image, index) => (
            <div key={index} className="relative group">
              <Dialog>
                <DialogTrigger asChild>
                  <div className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`Post image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ExternalLink className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full">
                  <div className="relative">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`Post image ${index + 1}`}
                      width={800}
                      height={600}
                      className="w-full h-auto rounded-lg"
                    />
                    {post.settings?.allowDownload && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-4 right-4"
                        onClick={() => handleDownloadImage(image, index)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Post Card */}
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={post.author.avatar || "/placeholder.svg"} />
                <AvatarFallback>{post.author.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">@{post.author.username}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{post.type}</Badge>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(post.timestamp, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Post Stats */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{views} views</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{likes} likes</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-4 w-4" />
              <span>{comments.length} comments</span>
            </div>
            <div className="flex items-center space-x-1">
              <Share2 className="h-4 w-4" />
              <span>{post.shares || 0} shares</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Post Content */}
          {post.content.text && (
            <div className="prose prose-sm max-w-none">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{post.content.text}</p>
            </div>
          )}

          {/* Image Gallery */}
          {renderImageGallery()}

          {/* Video */}
          {post.content.video && (
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold">Video</h3>
              <div className="relative group">
                <video
                  controls
                  className="w-full rounded-lg"
                  poster={post.content.videoThumbnail || "/placeholder.svg?height=400&width=600"}
                  preload="metadata"
                  controlsList="nodownload"
                >
                  <source src={post.content.video} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                {/* Video info overlay */}
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Video</span>
                  </div>
                </div>

                {/* Download button for video if allowed */}
                {post.settings?.allowDownload && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={() => handleDownloadVideo(post.content.video)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={handleLike} className={isLiked ? "text-red-500" : ""}>
              <Heart className={`h-5 w-5 mr-2 ${isLiked ? "fill-current" : ""}`} />
              {likes}
            </Button>
            <Button variant="ghost" className="text-blue-500">
              <MessageCircle className="h-5 w-5 mr-2" />
              {comments.length}
            </Button>
            {post.settings?.allowSharing !== false && (
              <Button variant="ghost" onClick={handleShare}>
                <Share2 className="h-5 w-5 mr-2" />
                Share
              </Button>
            )}
          </div>
          <Button variant="ghost" onClick={handleBookmark} className={isBookmarked ? "text-blue-500" : ""}>
            <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
          </Button>
        </CardFooter>
      </Card>

      {/* Comments Section */}
      {post.settings?.allowComments !== false && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Comment */}
            {userProfile && (
              <div className="flex space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{userProfile.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Input
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    className="w-full"
                  />
                  <Button onClick={handleAddComment} disabled={!newComment.trim()} size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Comments List */}
            {commentsLoading ? (
              <p className="text-muted-foreground">Loading comments...</p>
            ) : comments.length > 0 ? (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">{comment.authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="bg-muted rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{comment.authorName}</span>
                          <Badge
                            variant={comment.authorRole === "admin" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {comment.authorRole}
                          </Badge>
                          {comment.createdAt && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
