"use client"

import { useParams } from "next/navigation"
import UserProfileView from "@/components/user-profile-view"
import { useAuth } from "@/contexts/auth-context"

export default function UserProfilePage() {
  const params = useParams()
  const { user } = useAuth()
  const userId = params.id as string

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please Login</h1>
        <p className="text-muted-foreground">You need to be logged in to view user profiles.</p>
      </div>
    )
  }

  return <UserProfileView userId={userId} />
}
