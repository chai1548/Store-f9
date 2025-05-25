"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
  Copy,
  Download,
  Eye,
  EyeOff,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface PostActionsProps {
  post: any
  isLiked: boolean
  isBookmarked: boolean
  likes: number
  onLike: () => void
  onBookmark: () => void
  onShare: () => void
  onEdit?: () => void
  onDelete?: () => void
  showComments?: boolean
  onToggleComments?: () => void
  commentsCount: number
  compact?: boolean
}

export default function PostActions({
  post,
  isLiked,
  isBookmarked,
  likes,
  onLike,
  onBookmark,
  onShare,
  onEdit,
  onDelete,
  showComments,
  onToggleComments,
  commentsCount,
  compact = false,
}: PostActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { userProfile } = useAuth()
  const { toast } = useToast()

  const isOwner = userProfile?.uid === post.author.uid
  const isAdmin = userProfile?.role === "admin"

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}/post/${post.id}`
      await navigator.clipboard.writeText(url)
      toast({
        title: "Link copied!",
        description: "Post link has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link.",
        variant: "destructive",
      })
    }
  }

  const handleReport = () => {
    toast({
      title: "Report submitted",
      description: "Thank you for reporting this post. We'll review it shortly.",
    })
  }

  const handleHidePost = () => {
    toast({
      title: "Post hidden",
      description: "This post has been hidden from your feed.",
    })
  }

  // Main action buttons
  const mainActions = (
    <div className={`flex items-center ${compact ? "space-x-1" : "space-x-2 sm:space-x-4"}`}>
      <Button
        variant="ghost"
        size={compact ? "sm" : "default"}
        onClick={onLike}
        className={`${isLiked ? "text-red-500" : ""} ${
          compact ? "h-8 px-2" : "h-9 px-3"
        } hover:bg-red-50 hover:text-red-500 transition-colors`}
      >
        <Heart
          className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} ${isLiked ? "fill-current" : ""} ${
            compact ? "mr-1" : "mr-1.5"
          }`}
        />
        <span className={`${compact ? "text-xs" : "text-sm"} font-medium`}>{likes}</span>
      </Button>

      {post.settings?.allowComments !== false && onToggleComments && (
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          onClick={onToggleComments}
          className={`${showComments ? "text-blue-500" : ""} ${
            compact ? "h-8 px-2" : "h-9 px-3"
          } hover:bg-blue-50 hover:text-blue-500 transition-colors`}
        >
          <MessageCircle className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} ${compact ? "mr-1" : "mr-1.5"}`} />
          <span className={`${compact ? "text-xs" : "text-sm"} font-medium`}>{commentsCount}</span>
        </Button>
      )}

      {post.settings?.allowSharing !== false && (
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          onClick={onShare}
          className={`${compact ? "h-8 px-2" : "h-9 px-3"} hover:bg-green-50 hover:text-green-500 transition-colors`}
        >
          <Share2 className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} ${compact ? "mr-1" : "mr-1.5"}`} />
          <span className={`${compact ? "text-xs" : "text-sm"} font-medium`}>{post.shares || 0}</span>
        </Button>
      )}

      {/* Views count (if available) */}
      {post.views && (
        <div className={`flex items-center text-muted-foreground ${compact ? "px-2" : "px-3"}`}>
          <Eye className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} ${compact ? "mr-1" : "mr-1.5"}`} />
          <span className={`${compact ? "text-xs" : "text-sm"}`}>{post.views}</span>
        </div>
      )}
    </div>
  )

  // Secondary actions (bookmark + menu)
  const secondaryActions = (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size={compact ? "sm" : "default"}
        onClick={onBookmark}
        className={`${isBookmarked ? "text-blue-500" : ""} ${
          compact ? "h-8 w-8 p-0" : "h-9 w-9 p-0"
        } hover:bg-blue-50 hover:text-blue-500 transition-colors`}
      >
        <Bookmark className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} ${isBookmarked ? "fill-current" : ""}`} />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={compact ? "sm" : "default"}
            className={`${compact ? "h-8 w-8 p-0" : "h-9 w-9 p-0"} hover:bg-muted transition-colors`}
          >
            <MoreHorizontal className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy link
          </DropdownMenuItem>

          {post.settings?.allowDownload && (post.content.images?.length > 0 || post.content.video) && (
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {(isOwner || isAdmin) && onEdit && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit post
            </DropdownMenuItem>
          )}

          {(isOwner || isAdmin) && onDelete && (
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete post
            </DropdownMenuItem>
          )}

          {!isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleHidePost}>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReport} className="text-red-600">
                <Flag className="h-4 w-4 mr-2" />
                Report post
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )

  return (
    <>
      <div className={`flex items-center justify-between w-full ${compact ? "py-2" : "py-3"}`}>
        {mainActions}
        {secondaryActions}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.()
                setShowDeleteDialog(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
