import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { db } from "./firebase"

export interface CreateNotificationParams {
  userId: string
  type: "like" | "comment" | "follow" | "message" | "share" | "mention" | "system"
  title: string
  message: string
  fromUser?: {
    id: string
    name: string
    avatar?: string
  }
  relatedPost?: {
    id: string
    title: string
  }
  actionUrl?: string
  priority?: "low" | "medium" | "high"
}

export class NotificationService {
  static async createNotification(params: CreateNotificationParams) {
    try {
      // Check if similar notification already exists (to prevent spam)
      if (params.fromUser && params.relatedPost) {
        const existingQuery = query(
          collection(db, "notifications"),
          where("userId", "==", params.userId),
          where("type", "==", params.type),
          where("fromUser.id", "==", params.fromUser.id),
          where("relatedPost.id", "==", params.relatedPost.id),
        )

        const existingSnapshot = await getDocs(existingQuery)
        if (!existingSnapshot.empty) {
          // Update existing notification instead of creating new one
          return
        }
      }

      await addDoc(collection(db, "notifications"), {
        ...params,
        isRead: false,
        priority: params.priority || "medium",
        createdAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  static async createLikeNotification(
    postAuthorId: string,
    likerName: string,
    likerId: string,
    likerAvatar: string,
    postId: string,
    postTitle: string,
  ) {
    if (postAuthorId === likerId) return // Don't notify self

    await this.createNotification({
      userId: postAuthorId,
      type: "like",
      title: "New Like",
      message: `${likerName} liked your post`,
      fromUser: {
        id: likerId,
        name: likerName,
        avatar: likerAvatar,
      },
      relatedPost: {
        id: postId,
        title: postTitle,
      },
      actionUrl: `/post/${postId}`,
      priority: "medium",
    })
  }

  static async createCommentNotification(
    postAuthorId: string,
    commenterName: string,
    commenterId: string,
    commenterAvatar: string,
    postId: string,
    postTitle: string,
  ) {
    if (postAuthorId === commenterId) return // Don't notify self

    await this.createNotification({
      userId: postAuthorId,
      type: "comment",
      title: "New Comment",
      message: `${commenterName} commented on your post`,
      fromUser: {
        id: commenterId,
        name: commenterName,
        avatar: commenterAvatar,
      },
      relatedPost: {
        id: postId,
        title: postTitle,
      },
      actionUrl: `/post/${postId}`,
      priority: "high",
    })
  }

  static async createFollowNotification(
    followedUserId: string,
    followerName: string,
    followerId: string,
    followerAvatar: string,
  ) {
    await this.createNotification({
      userId: followedUserId,
      type: "follow",
      title: "New Follower",
      message: `${followerName} started following you`,
      fromUser: {
        id: followerId,
        name: followerName,
        avatar: followerAvatar,
      },
      actionUrl: `/user/${followerId}`,
      priority: "medium",
    })
  }

  static async createMessageNotification(
    recipientId: string,
    senderName: string,
    senderId: string,
    senderAvatar: string,
    messagePreview: string,
  ) {
    await this.createNotification({
      userId: recipientId,
      type: "message",
      title: "New Message",
      message: `${senderName}: ${messagePreview}`,
      fromUser: {
        id: senderId,
        name: senderName,
        avatar: senderAvatar,
      },
      actionUrl: "/chat",
      priority: "high",
    })
  }

  static async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    actionUrl?: string,
    priority: "low" | "medium" | "high" = "low",
  ) {
    await this.createNotification({
      userId,
      type: "system",
      title,
      message,
      actionUrl,
      priority,
    })
  }

  static async createWelcomeNotification(userId: string, userName: string) {
    await this.createSystemNotification(
      userId,
      "Welcome to SocialApp! 🎉",
      `Hi ${userName}! Complete your profile to get started and connect with others.`,
      "/profile",
      "medium",
    )
  }

  static async createShareNotification(
    postAuthorId: string,
    sharerName: string,
    sharerId: string,
    sharerAvatar: string,
    postId: string,
    postTitle: string,
  ) {
    if (postAuthorId === sharerId) return // Don't notify self

    await this.createNotification({
      userId: postAuthorId,
      type: "share",
      title: "Post Shared",
      message: `${sharerName} shared your post`,
      fromUser: {
        id: sharerId,
        name: sharerName,
        avatar: sharerAvatar,
      },
      relatedPost: {
        id: postId,
        title: postTitle,
      },
      actionUrl: `/post/${postId}`,
      priority: "medium",
    })
  }
}
