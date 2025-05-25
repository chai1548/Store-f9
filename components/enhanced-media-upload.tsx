"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import {
  Upload,
  ImageIcon,
  Video,
  FileText,
  Music,
  X,
  Eye,
  Download,
  Share2,
  Crop,
  Filter,
  Palette,
  RotateCcw,
} from "lucide-react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { useRouter } from "next/navigation"

interface MediaFile {
  file: File
  preview: string
  type: "image" | "video" | "audio" | "document"
  size: number
  duration?: number
  dimensions?: { width: number; height: number }
}

interface UploadSettings {
  quality: "low" | "medium" | "high" | "original"
  resize: boolean
  maxWidth: number
  maxHeight: number
  watermark: boolean
  compression: number
  format: "original" | "jpeg" | "png" | "webp"
}

export default function EnhancedMediaUpload() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("upload")
  const [caption, setCaption] = useState("")
  const [tags, setTags] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState<MediaFile | null>(null)
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>({
    quality: "high",
    resize: false,
    maxWidth: 1920,
    maxHeight: 1080,
    watermark: false,
    compression: 80,
    format: "original",
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    processFiles(files)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = Array.from(event.dataTransfer.files)
    processFiles(files)
  }

  const processFiles = async (files: File[]) => {
    const processedFiles: MediaFile[] = []

    for (const file of files) {
      const mediaFile: MediaFile = {
        file,
        preview: "",
        type: getFileType(file),
        size: file.size,
      }

      // Create preview
      if (file.type.startsWith("image/")) {
        mediaFile.preview = URL.createObjectURL(file)
        mediaFile.dimensions = await getImageDimensions(file)
      } else if (file.type.startsWith("video/")) {
        mediaFile.preview = URL.createObjectURL(file)
        mediaFile.duration = await getVideoDuration(file)
      } else if (file.type.startsWith("audio/")) {
        mediaFile.duration = await getAudioDuration(file)
      }

      processedFiles.push(mediaFile)
    }

    setSelectedFiles((prev) => [...prev, ...processedFiles])
  }

  const getFileType = (file: File): "image" | "video" | "audio" | "document" => {
    if (file.type.startsWith("image/")) return "image"
    if (file.type.startsWith("video/")) return "video"
    if (file.type.startsWith("audio/")) return "audio"
    return "document"
  }

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
      }
      img.src = URL.createObjectURL(file)
    })
  }

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video")
      video.onloadedmetadata = () => {
        resolve(video.duration)
      }
      video.src = URL.createObjectURL(file)
    })
  }

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement("audio")
      audio.onloadedmetadata = () => {
        resolve(audio.duration)
      }
      audio.src = URL.createObjectURL(file)
    })
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const uploadFiles = async (): Promise<string[]> => {
    const uploadPromises = selectedFiles.map(async (mediaFile) => {
      const fileRef = ref(storage, `media/${Date.now()}_${mediaFile.file.name}`)
      await uploadBytes(fileRef, mediaFile.file)
      return getDownloadURL(fileRef)
    })

    return Promise.all(uploadPromises)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload.",
        variant: "destructive",
      })
      return
    }

    if (!userProfile) {
      toast({
        title: "Please login",
        description: "You need to be logged in to upload media.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      setUploadProgress(30)
      const fileUrls = await uploadFiles()
      setUploadProgress(60)

      // Create post with media
      const postData = {
        author: {
          uid: userProfile.uid,
          name: userProfile.displayName,
          username: userProfile.email.split("@")[0],
          avatar: userProfile.avatar || null,
        },
        content: {
          text: caption.trim() || null,
          images:
            selectedFiles.filter((f) => f.type === "image").length > 0
              ? fileUrls.filter((_, i) => selectedFiles[i].type === "image")
              : [],
          video: selectedFiles.find((f) => f.type === "video")
            ? fileUrls[selectedFiles.findIndex((f) => f.type === "video")]
            : null,
          audio: selectedFiles.find((f) => f.type === "audio")
            ? fileUrls[selectedFiles.findIndex((f) => f.type === "audio")]
            : null,
          documents:
            selectedFiles.filter((f) => f.type === "document").length > 0
              ? fileUrls.filter((_, i) => selectedFiles[i].type === "document")
              : [],
        },
        type: selectedFiles[0].type,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        views: 0,
        settings: {
          allowComments: true,
          allowSharing: true,
          allowDownload: uploadSettings.quality !== "original",
        },
        isPublic,
        uploadSettings,
      }

      setUploadProgress(80)
      await addDoc(collection(db, "posts"), postData)
      setUploadProgress(100)

      toast({
        title: "Upload successful! 🎉",
        description: "Your media has been uploaded and shared.",
      })

      // Reset form
      setSelectedFiles([])
      setCaption("")
      setTags("")
      setUploadProgress(0)
      setUploading(false)

      // Redirect to home
      router.push("/")
    } catch (error: any) {
      console.error("Error uploading media:", error)
      toast({
        title: "Upload failed",
        description: "Failed to upload media. Please try again.",
        variant: "destructive",
      })
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const openPreview = (mediaFile: MediaFile) => {
    setSelectedPreview(mediaFile)
    setShowPreview(true)
  }

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please Login</h1>
        <p className="text-muted-foreground">You need to be logged in to upload media.</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Enhanced Media Upload</h1>
        <p className="text-muted-foreground">Upload and share images, videos, audio, and documents</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Media Files</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Drop files here or click to browse</h3>
                <p className="text-muted-foreground mb-4">Support for images, videos, audio, and documents</p>
                <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <ImageIcon className="h-4 w-4" />
                    <span>Images</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Video className="h-4 w-4" />
                    <span>Videos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Music className="h-4 w-4" />
                    <span>Audio</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <FileText className="h-4 w-4" />
                    <span>Documents</span>
                  </div>
                </div>
              </div>

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold mb-4">Selected Files ({selectedFiles.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedFiles.map((mediaFile, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{mediaFile.type}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Preview */}
                          <div className="aspect-video bg-muted rounded-lg mb-3 overflow-hidden">
                            {mediaFile.type === "image" && (
                              <img
                                src={mediaFile.preview || "/placeholder.svg"}
                                alt={mediaFile.file.name}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => openPreview(mediaFile)}
                              />
                            )}
                            {mediaFile.type === "video" && (
                              <video
                                src={mediaFile.preview}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => openPreview(mediaFile)}
                              />
                            )}
                            {mediaFile.type === "audio" && (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            {mediaFile.type === "document" && (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="space-y-1 text-sm">
                            <p className="font-medium truncate">{mediaFile.file.name}</p>
                            <p className="text-muted-foreground">{formatFileSize(mediaFile.size)}</p>
                            {mediaFile.duration && (
                              <p className="text-muted-foreground">Duration: {formatDuration(mediaFile.duration)}</p>
                            )}
                            {mediaFile.dimensions && (
                              <p className="text-muted-foreground">
                                {mediaFile.dimensions.width} × {mediaFile.dimensions.height}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2 mt-3">
                            <Button variant="outline" size="sm" onClick={() => openPreview(mediaFile)}>
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Caption and Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="caption">Caption</Label>
                <Textarea
                  id="caption"
                  placeholder="Write a caption for your media..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="photography, nature, travel"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <Label htmlFor="isPublic">Make this post public</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Editor</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFiles.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Editor Tools */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Editing Tools</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm">
                          <Crop className="h-4 w-4 mr-2" />
                          Crop
                        </Button>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Rotate
                        </Button>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filters
                        </Button>
                        <Button variant="outline" size="sm">
                          <Palette className="h-4 w-4 mr-2" />
                          Adjust
                        </Button>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Preview</h4>
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">Select a file to edit</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Upload files first to access editing tools</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Quality</Label>
                    <select
                      value={uploadSettings.quality}
                      onChange={(e) =>
                        setUploadSettings({
                          ...uploadSettings,
                          quality: e.target.value as any,
                        })
                      }
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="low">Low (Faster upload)</option>
                      <option value="medium">Medium (Balanced)</option>
                      <option value="high">High (Better quality)</option>
                      <option value="original">Original (No compression)</option>
                    </select>
                  </div>

                  <div>
                    <Label>Format</Label>
                    <select
                      value={uploadSettings.format}
                      onChange={(e) =>
                        setUploadSettings({
                          ...uploadSettings,
                          format: e.target.value as any,
                        })
                      }
                      className="w-full mt-1 p-2 border rounded-md"
                    >
                      <option value="original">Keep Original</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP (Smaller size)</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="resize"
                      checked={uploadSettings.resize}
                      onChange={(e) =>
                        setUploadSettings({
                          ...uploadSettings,
                          resize: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="resize">Resize images</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  {uploadSettings.resize && (
                    <>
                      <div>
                        <Label>Max Width</Label>
                        <Input
                          type="number"
                          value={uploadSettings.maxWidth}
                          onChange={(e) =>
                            setUploadSettings({
                              ...uploadSettings,
                              maxWidth: Number.parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Max Height</Label>
                        <Input
                          type="number"
                          value={uploadSettings.maxHeight}
                          onChange={(e) =>
                            setUploadSettings({
                              ...uploadSettings,
                              maxHeight: Number.parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label>Compression ({uploadSettings.compression}%)</Label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={uploadSettings.compression}
                      onChange={(e) =>
                        setUploadSettings({
                          ...uploadSettings,
                          compression: Number.parseInt(e.target.value),
                        })
                      }
                      className="w-full mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="watermark"
                      checked={uploadSettings.watermark}
                      onChange={(e) =>
                        setUploadSettings({
                          ...uploadSettings,
                          watermark: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="watermark">Add watermark</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFiles.length > 0 ? (
                <div className="max-w-2xl mx-auto">
                  {/* Mock post preview */}
                  <div className="border rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white">
                        {userProfile.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold">{userProfile.displayName}</p>
                        <p className="text-sm text-muted-foreground">Just now</p>
                      </div>
                    </div>

                    {caption && <p className="mb-4">{caption}</p>}

                    {/* Media preview */}
                    <div className="space-y-4">
                      {selectedFiles.filter((f) => f.type === "image").length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedFiles
                            .filter((f) => f.type === "image")
                            .slice(0, 4)
                            .map((file, index) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden">
                                <img
                                  src={file.preview || "/placeholder.svg"}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                        </div>
                      )}

                      {selectedFiles.find((f) => f.type === "video") && (
                        <video
                          src={selectedFiles.find((f) => f.type === "video")?.preview}
                          controls
                          className="w-full rounded-lg"
                        />
                      )}

                      {selectedFiles.find((f) => f.type === "audio") && (
                        <div className="p-4 bg-muted rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Music className="h-8 w-8" />
                            <div>
                              <p className="font-medium">Audio File</p>
                              <p className="text-sm text-muted-foreground">
                                {selectedFiles.find((f) => f.type === "audio")?.file.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {tags && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {tags.split(",").map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            #{tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex space-x-4">
                        <Button variant="ghost" size="sm">
                          <span className="mr-2">❤️</span> 0
                        </Button>
                        <Button variant="ghost" size="sm">
                          <span className="mr-2">💬</span> 0
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Upload files to see preview</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      <div className="flex justify-center">
        <Button onClick={handleUpload} disabled={uploading || selectedFiles.length === 0} size="lg" className="px-8">
          {uploading ? "Uploading..." : `Upload ${selectedFiles.length} file(s)`}
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Media Preview</DialogTitle>
          </DialogHeader>
          {selectedPreview && (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {selectedPreview.type === "image" && (
                  <img
                    src={selectedPreview.preview || "/placeholder.svg"}
                    alt={selectedPreview.file.name}
                    className="w-full h-full object-contain"
                  />
                )}
                {selectedPreview.type === "video" && (
                  <video src={selectedPreview.preview} controls className="w-full h-full" />
                )}
                {selectedPreview.type === "audio" && (
                  <div className="w-full h-full flex items-center justify-center">
                    <audio src={selectedPreview.preview} controls />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedPreview.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedPreview.size)}
                    {selectedPreview.duration && ` • ${formatDuration(selectedPreview.duration)}`}
                    {selectedPreview.dimensions &&
                      ` • ${selectedPreview.dimensions.width}×${selectedPreview.dimensions.height}`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
