import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore"
import { db } from "./firebase"

// Sample data to add to Firebase
export const samplePosts = [
  {
    author: {
      uid: "sample-user-1",
      name: "John Doe",
      username: "johndoe",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: {
      text: "Welcome to our new social media platform! 🚀 This is a sample post to get you started.",
      images: [],
      video: null,
    },
    type: "text",
    createdAt: serverTimestamp(),
    likes: 15,
    comments: 3,
    shares: 2,
    settings: {
      allowComments: true,
      allowSharing: true,
      allowDownload: false,
    },
    isPublic: true,
  },
  {
    author: {
      uid: "sample-user-2",
      name: "Jane Smith",
      username: "janesmith",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: {
      text: "Beautiful day for coding! ☀️ Working on some exciting new features. Here are some screenshots of our progress!",
      images: [
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
      ],
      video: null,
    },
    type: "image",
    createdAt: serverTimestamp(),
    likes: 28,
    comments: 7,
    shares: 5,
    settings: {
      allowComments: true,
      allowSharing: true,
      allowDownload: false,
    },
    isPublic: true,
  },
  {
    author: {
      uid: "admin-user",
      name: "Admin",
      username: "admin",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: {
      text: "Welcome to SocialApp! 🎉 We're excited to have you here. Check out these amazing features we've built for you!",
      images: [
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
      ],
      video: null,
    },
    type: "image",
    createdAt: serverTimestamp(),
    likes: 42,
    comments: 12,
    shares: 8,
    settings: {
      allowComments: true,
      allowSharing: true,
      allowDownload: false,
    },
    isPublic: true,
  },
  {
    author: {
      uid: "sample-user-3",
      name: "Tech Guru",
      username: "techguru",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: {
      text: "Amazing gallery from our recent event! 📸 So many great moments captured.",
      images: [
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
        "/placeholder.svg?height=300&width=400",
      ],
      video: null,
    },
    type: "image",
    createdAt: serverTimestamp(),
    likes: 67,
    comments: 15,
    shares: 12,
    settings: {
      allowComments: true,
      allowSharing: true,
      allowDownload: false,
    },
    isPublic: true,
  },
  {
    author: {
      uid: "sample-user-4",
      name: "Video Creator",
      username: "videocreator",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    content: {
      text: "Check out this amazing video! 🎬 Created with love and passion.",
      images: [],
      video: "/placeholder.svg?height=400&width=600", // This would be a video URL in real scenario
      videoThumbnail: "/placeholder.svg?height=300&width=500",
    },
    type: "video",
    createdAt: serverTimestamp(),
    likes: 89,
    comments: 23,
    shares: 15,
    views: 456,
    settings: {
      allowComments: true,
      allowSharing: true,
      allowDownload: true,
    },
    isPublic: true,
  },
]

export const addSampleData = async () => {
  try {
    console.log("Adding sample data to Firebase...")

    // Check if posts already exist
    const postsSnapshot = await getDocs(collection(db, "posts"))
    if (postsSnapshot.size > 0) {
      console.log("Sample data already exists")
      return
    }

    // Add sample posts
    for (const post of samplePosts) {
      await addDoc(collection(db, "posts"), post)
    }

    console.log("Sample data added successfully!")
  } catch (error) {
    console.error("Error adding sample data:", error)
  }
}

export const checkFirebaseConnection = async () => {
  try {
    console.log("Testing Firebase connection...")
    const testCollection = collection(db, "test")
    await addDoc(testCollection, { test: true, timestamp: serverTimestamp() })
    console.log("Firebase connection successful!")
    return true
  } catch (error) {
    console.error("Firebase connection failed:", error)
    return false
  }
}
