"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Crown, User, Copy, X, Info } from "lucide-react"

export default function DemoBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const { toast } = useToast()

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      })
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      })
    }
  }

  if (!isVisible) return null

  return (
    <Card className="mb-6 border-2 border-dashed border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">Demo Accounts Available</h3>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Testing Mode
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Admin Account */}
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-red-200">
            <div className="flex items-center space-x-2 mb-3">
              <Crown className="h-5 w-5 text-red-600" />
              <h4 className="font-semibold text-red-700">Admin Account</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email:</span>
                <div className="flex items-center space-x-1">
                  <code className="text-red-600 font-mono">admin@socialapp.com</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("admin@socialapp.com", "Admin Email")}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Password:</span>
                <div className="flex items-center space-x-1">
                  <code className="text-red-600 font-mono">admin123</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("admin123", "Admin Password")}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* User Account */}
          <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-2 mb-3">
              <User className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-700">User Account</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Email:</span>
                <div className="flex items-center space-x-1">
                  <code className="text-blue-600 font-mono">user@socialapp.com</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("user@socialapp.com", "User Email")}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Password:</span>
                <div className="flex items-center space-x-1">
                  <code className="text-blue-600 font-mono">user123</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard("user123", "User Password")}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-blue-600">
            💡 Use the login button in the navigation to access these demo accounts
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
