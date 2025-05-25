"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { checkFirebaseConnection } from "@/lib/firebase-utils"
import { AlertCircle, RefreshCw } from "lucide-react"

export default function FirebaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setStatus("checking")
    setError(null)

    try {
      const isConnected = await checkFirebaseConnection()
      setStatus(isConnected ? "connected" : "error")
      if (!isConnected) {
        setError("Failed to connect to Firebase")
      }
    } catch (err: any) {
      setStatus("error")
      setError(err.message)
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  if (status === "connected") {
    return null // Don't show anything if connected
  }

  return (
    <Alert variant={status === "error" ? "destructive" : "default"} className="mb-4">
      {status === "checking" ? <RefreshCw className="h-4 w-4 animate-spin" /> : <AlertCircle className="h-4 w-4" />}
      <AlertDescription className="flex items-center justify-between">
        <span>{status === "checking" ? "Testing Firebase connection..." : `Firebase connection failed: ${error}`}</span>
        {status === "error" && (
          <Button variant="outline" size="sm" onClick={testConnection}>
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
