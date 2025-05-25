"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Upload, ImageIcon, Video, Type, X } from "lucide-react"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import VideoThumbnailGenerator from "@/components/video-thumbnail-generator"

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState("text")
  const [content, setContent] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [settings, setSettings] = useState({
    allowComments: true,
    allowSharing: true,
    allowDownload: false,
    isPublic: true,
  })
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const router = useRouter()
  const [videoThumbnail, setVideoThumbnail] = useState<{ blob: Blob; url: string } | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFilesToStorage = async (files: File[]): Promise<{ fileUrls: string[]; thumbnailUrl?: string }> => {
    const uploadPromises = files.map(async (file) => {
      const fileRef = ref(storage, `posts/${Date.now()}_${file.name}`)
      await uploadBytes(fileRef, file)
      return getDownloadURL(fileRef)
    })

    const fileUrls = await Promise.all(uploadPromises)

    // Upload thumbnail if exists
    let thumbnailUrl: string | undefined
    if (videoThumbnail && activeTab === "video") {
      const thumbnailRef = ref(storage, `thumbnails/${Date.now()}_thumbnail.jpg`)
      await uploadBytes(thumbnailRef, videoThumbnail.blob)
      thumbnailUrl = await getDownloadURL(thumbnailRef)
    }

    return { fileUrls, thumbnailUrl }
  }

  const handleUpload = async () => {
    if (!content.trim() && selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please add some content or select files to upload.",
        variant: "destructive",
      })
      return
    }

    if (!userProfile) {
      toast({
        title: "Error",
        description: "Please login to create a post.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      let fileUrls: string[] = []
      let thumbnailUrl: string | undefined

      if (selectedFiles.length > 0) {
        setUploadProgress(30)
        const result = await uploadFilesToStorage(selectedFiles)
        fileUrls = result.fileUrls
        thumbnailUrl = result.thumbnailUrl
        setUploadProgress(60)
      }

      const postData = {
        author: {
          uid: userProfile.uid,
          name: userProfile.displayName,
          username: userProfile.email.split("@")[0],
          avatar: userProfile.avatar || null,
        },
        content: {
          text: content.trim() || null,
          images: activeTab === "image" ? fileUrls : [],
          video: activeTab === "video" && fileUrls.length > 0 ? fileUrls[0] : null,
          videoThumbnail: thumbnailUrl || null,
        },
        type: activeTab,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        settings: settings,
        isPublic: settings.isPublic,
      }

      setUploadProgress(80)

      // Save post to Firestore
      await addDoc(collection(db, "posts"), postData)

      setUploadProgress(100)

      toast({
        title: "Success!",
        description: "Your post has been uploaded successfully.",
      })

      // Reset form
      setContent("")
      setSelectedFiles([])
      setUploadProgress(0)
      setUploading(false)

      // Redirect to home page
      router.push("/")
    } catch (error: any) {
      console.error("Error uploading post:", error)
      toast({
        title: "Error",
        description: "Failed to upload post. Please try again.",
        variant: "destructive",
      })
      setUploading(false)
      setUploadProgress(0)
    }
  }

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Please Login</h1>
        <p className="text-muted-foreground">You need to be logged in to create posts.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Create New Post</h1>
        <p className="text-muted-foreground">Share your thoughts, images, or videos with the community</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <CardDescription>Choose the type of content you want to share</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text" className="flex items-center space-x-2">
                    <Type className="h-4 w-4" />
                    <span>Text</span>
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4" />
                    <span>Image</span>
                  </TabsTrigger>
                  <TabsTrigger value="video" className="flex items-center space-x-2">
                    <Video className="h-4 w-4" />
                    <span>Video</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label htmlFor="text-content">Your Message</Label>
                    <Textarea
                      id="text-content"
                      placeholder="What's on your mind?"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[200px] mt-2"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="image" className="space-y-4">
                  <div>
                    <Label htmlFor="image-content">Caption</Label>
                    <Textarea
                      id="image-content"
                      placeholder="Write a caption for your images..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Images</Label>
                    <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload images or drag and drop</p>
                      </label>
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative">
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                            {file.type.startsWith("image/") ? (
                              <img
                                src={URL.createObjectURL(file) || "/placeholder.svg"}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <Badge variant="secondary" className="absolute top-2 left-2">
                            {file.name.split(".").pop()?.toUpperCase()}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="video" className="space-y-4">
                  <div>
                    <Label htmlFor="video-content">Description</Label>
                    <Textarea
                      id="video-content"
                      placeholder="Describe your video..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Video File</Label>
                    <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="video-upload"
                      />
                      <label htmlFor="video-upload" className="cursor-pointer">
                        <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload video or drag and drop</p>
                      </label>
                    </div>
                  </div>

                  {selectedFiles.length > 0 && selectedFiles[0].type.startsWith("video/") && (
                    <VideoThumbnailGenerator
                      videoFile={selectedFiles[0]}
                      onThumbnailGenerated={(blob, url) => {
                        setVideoThumbnail({ blob, url })
                      }}
                    />
                  )}

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Video className="h-5 w-5" />
                            <span className="text-sm font-medium">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              {uploading && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
              <CardDescription>Configure how others can interact with your post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-comments">Allow Comments</Label>
                <Switch
                  id="allow-comments"
                  checked={settings.allowComments}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowComments: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allow-sharing">Allow Sharing</Label>
                <Switch
                  id="allow-sharing"
                  checked={settings.allowSharing}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowSharing: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allow-download">Allow Download</Label>
                <Switch
                  id="allow-download"
                  checked={settings.allowDownload}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowDownload: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="is-public">Public Post</Label>
                <Switch
                  id="is-public"
                  checked={settings.isPublic}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, isPublic: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                    {userProfile.displayName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{userProfile.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{userProfile.email.split("@")[0]}</p>
                  </div>
                </div>
                {content && (
                  <p className="text-sm">
                    {content.slice(0, 100)}
                    {content.length > 100 ? "..." : ""}
                  </p>
                )}
                {selectedFiles.length > 0 && (
                  <div className="text-xs text-muted-foreground">{selectedFiles.length} file(s) attached</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleUpload} disabled={uploading} className="w-full" size="lg">
            {uploading ? "Uploading..." : "Publish Post"}
          </Button>
        </div>
      </div>
    </div>
  )
}
