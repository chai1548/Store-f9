import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "./firebase"

export const demoAccounts = [
  {
    email: "admin@socialapp.com",
    password: "admin123",
    displayName: "Admin User",
    role: "admin" as const,
  },
  {
    email: "user@socialapp.com",
    password: "user123",
    displayName: "Demo User",
    role: "user" as const,
  },
]

export const createDemoAccounts = async () => {
  // Demo accounts are created manually in Firebase Console
  console.log("Demo accounts are available for login")
}

export const loginWithDemo = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result
  } catch (error: any) {
    console.error("Demo login error:", error)
    throw error
  }
}
