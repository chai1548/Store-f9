"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Download, RefreshCw } from "lucide-react"

interface VideoThumbnailGeneratorProps {
  videoFile: File
  onThumbnailGenerated: (thumbnailBlob: Blob, thumbnailUrl: string) => void
}

export default function VideoThumbnailGenerator({ videoFile, onThumbnailGenerated }: VideoThumbnailGeneratorProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const generateThumbnail = async (timeInSeconds = 1) => {
    if (!videoFile || !videoRef.current || !canvasRef.current) return

    setGenerating(true)

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) return

      // Create object URL for video
      const videoUrl = URL.createObjectURL(videoFile)
      video.src = videoUrl

      // Wait for video to load
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.currentTime = Math.min(timeInSeconds, video.duration / 2)
        }
        video.onseeked = resolve
      })

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const thumbnailUrl = URL.createObjectURL(blob)
            setThumbnail(thumbnailUrl)
            onThumbnailGenerated(blob, thumbnailUrl)
          }
        },
        "image/jpeg",
        0.8,
      )

      // Clean up
      URL.revokeObjectURL(videoUrl)
    } catch (error) {
      console.error("Error generating thumbnail:", error)
    }

    setGenerating(false)
  }

  const downloadThumbnail = () => {
    if (!thumbnail) return

    const a = document.createElement("a")
    a.href = thumbnail
    a.download = `thumbnail-${Date.now()}.jpg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Camera className="h-5 w-5" />
          <span>Video Thumbnail</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hidden video and canvas elements */}
        <video ref={videoRef} className="hidden" muted />
        <canvas ref={canvasRef} className="hidden" />

        {/* Thumbnail preview */}
        {thumbnail ? (
          <div className="space-y-3">
            <div className="relative">
              <img src={thumbnail || "/placeholder.svg"} alt="Video thumbnail" className="w-full rounded-lg" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-black/50 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => generateThumbnail()} disabled={generating}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button variant="outline" size="sm" onClick={downloadThumbnail}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Generate a thumbnail for your video</p>
            <Button onClick={() => generateThumbnail()} disabled={generating}>
              {generating && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Generate Thumbnail
            </Button>
          </div>
        )}

        {/* Quick thumbnail options */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={() => generateThumbnail(1)} disabled={generating}>
            1s
          </Button>
          <Button variant="outline" size="sm" onClick={() => generateThumbnail(3)} disabled={generating}>
            3s
          </Button>
          <Button variant="outline" size="sm" onClick={() => generateThumbnail(5)} disabled={generating}>
            5s
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
