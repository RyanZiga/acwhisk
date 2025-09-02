import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { Progress } from './ui/progress'
import { 
  Upload, 
  X, 
  Camera, 
  Video, 
  Link, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  FileImage,
  FileVideo
} from 'lucide-react'
import { useAuth } from './AuthContext'
import { projectId } from '../utils/supabase/info'

interface MediaUploadProps {
  onMediaChange: (mediaUrl: string, mediaType: 'image' | 'video') => void
  currentMedia?: string
  currentMediaType?: 'image' | 'video'
  label?: string
  className?: string
  bucket: 'recipes' | 'profiles' | 'forums' | 'resources' | 'chat-media'
  allowVideo?: boolean
  allowImage?: boolean
  maxSizeMB?: number
}

export function MediaUpload({ 
  onMediaChange, 
  currentMedia, 
  currentMediaType = 'image',
  label = "Media Upload", 
  className = "",
  bucket,
  allowVideo = true,
  allowImage = true,
  maxSizeMB 
}: MediaUploadProps) {
  const { session } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [previewMedia, setPreviewMedia] = useState(currentMedia || '')
  const [previewMediaType, setPreviewMediaType] = useState(currentMediaType)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const getMaxSize = () => {
    if (maxSizeMB) return maxSizeMB * 1024 * 1024
    return allowVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024 // 50MB for video, 10MB for image
  }

  const getAcceptedTypes = () => {
    const imageTypes = allowImage ? ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'] : []
    const videoTypes = allowVideo ? ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'] : []
    return [...imageTypes, ...videoTypes]
  }

  const getFileTypeDescription = () => {
    const parts = []
    if (allowImage) parts.push('Images (JPEG, PNG, GIF, WebP)')
    if (allowVideo) parts.push('Videos (MP4, WebM, OGG, MOV)')
    return parts.join(' or ')
  }

  const handleFileUpload = async (file: File) => {
    if (!session) return

    const acceptedTypes = getAcceptedTypes()
    const maxSize = getMaxSize()

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setUploadError(`Please upload a valid file: ${getFileTypeDescription()}`)
      return
    }

    // Validate file size
    const sizeLimitMB = maxSizeMB || (file.type.startsWith('video/') ? 50 : 10)
    if (file.size > maxSize) {
      setUploadError(`File size must be less than ${sizeLimitMB}MB`)
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cfac176d/upload/${bucket}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const { url, fileType } = await response.json()
        setPreviewMedia(url)
        setPreviewMediaType(fileType)
        onMediaChange(url, fileType)
      } else {
        const { error } = await response.json()
        setUploadError(error || 'Failed to upload file')
      }
    } catch (error) {
      setUploadError('An unexpected error occurred during upload')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleUrlSubmit = () => {
    if (!mediaUrl.trim()) {
      setUploadError('Please enter a valid media URL')
      return
    }

    // Basic URL validation
    try {
      new URL(mediaUrl)
      // Determine media type from URL extension or content type
      const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(mediaUrl) || mediaUrl.includes('video')
      const mediaType = isVideo ? 'video' : 'image'
      
      setPreviewMedia(mediaUrl)
      setPreviewMediaType(mediaType)
      onMediaChange(mediaUrl, mediaType)
      setUploadError('')
    } catch {
      setUploadError('Please enter a valid URL')
    }
  }

  const handleRemoveMedia = () => {
    setPreviewMedia('')
    setMediaUrl('')
    onMediaChange('', 'image')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted
      setIsVideoMuted(!isVideoMuted)
    }
  }

  const getFileTypeIcon = () => {
    if (allowImage && allowVideo) return <Upload className="h-6 w-6" />
    if (allowVideo) return <FileVideo className="h-6 w-6" />
    return <FileImage className="h-6 w-6" />
  }

  const getFileInputAccept = () => {
    const types = []
    if (allowImage) types.push('image/*')
    if (allowVideo) types.push('video/*')
    return types.join(',')
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      
      {/* Upload Method Toggle */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={uploadMethod === 'file' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMethod('file')}
          className="gap-2"
        >
          {getFileTypeIcon()}
          Upload File
        </Button>
        <Button
          type="button"
          variant={uploadMethod === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMethod('url')}
          className="gap-2"
        >
          <Link className="h-4 w-4" />
          Media URL
        </Button>
      </div>

      {/* Preview */}
      {previewMedia && (
        <div className="relative">
          <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden border">
            {previewMediaType === 'video' ? (
              <div className="relative w-full h-full bg-black">
                <video
                  ref={videoRef}
                  src={previewMedia}
                  className="w-full h-full object-contain"
                  muted={isVideoMuted}
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onEnded={() => setIsVideoPlaying(false)}
                />
                
                {/* Video Controls */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-black/50 hover:bg-black/70"
                    onClick={toggleVideoPlay}
                  >
                    {isVideoPlaying ? 
                      <Pause className="h-4 w-4 text-white" /> : 
                      <Play className="h-4 w-4 text-white" />
                    }
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8 bg-black/50 hover:bg-black/70"
                    onClick={toggleVideoMute}
                  >
                    {isVideoMuted ? 
                      <VolumeX className="h-4 w-4 text-white" /> : 
                      <Volume2 className="h-4 w-4 text-white" />
                    }
                  </Button>
                </div>
              </div>
            ) : (
              <ImageWithFallback
                src={previewMedia}
                alt="Media preview"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8"
            onClick={handleRemoveMedia}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* File Upload */}
      {uploadMethod === 'file' && !previewMedia && (
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={getFileInputAccept()}
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
              {allowVideo && allowImage ? (
                <Upload className="h-6 w-6 text-muted-foreground" />
              ) : allowVideo ? (
                <Video className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">
                {getFileTypeDescription()} up to {maxSizeMB || (allowVideo ? 50 : 10)}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* URL Input */}
      {uploadMethod === 'url' && !previewMedia && (
        <div className="flex gap-2">
          <Input
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://example.com/media.jpg"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!mediaUrl.trim()}
          >
            Add
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Uploading media...
            </div>
          </div>
          {uploadProgress > 0 && (
            <Progress value={uploadProgress} className="h-2" />
          )}
        </div>
      )}

      {/* Error State */}
      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}