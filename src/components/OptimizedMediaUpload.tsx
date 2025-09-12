import React, { useState, useRef, useCallback } from 'react'
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
  FileVideo,
  Zap,
  CheckCircle
} from 'lucide-react'
import { useAuth } from './AuthContext'
import { projectId } from '../utils/supabase/info'

interface OptimizedMediaUploadProps {
  onMediaChange: (mediaUrl: string, mediaType: 'image' | 'video') => void
  currentMedia?: string
  currentMediaType?: 'image' | 'video'
  label?: string
  className?: string
  bucket: 'recipes' | 'profiles' | 'forums' | 'resources' | 'chat-media'
  allowVideo?: boolean
  allowImage?: boolean
  maxSizeMB?: number
  enableOptimization?: boolean
  targetImageWidth?: number
  compressionQuality?: number
}

// Image compression utility
const compressImage = (
  file: File, 
  maxWidth: number = 1200, 
  quality: number = 0.85
): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      canvas.width = width
      canvas.height = height
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
              type: 'image/webp',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        },
        'image/webp',
        quality
      )
    }
    
    img.src = URL.createObjectURL(file)
  })
}

// Generate responsive image sizes
const generateResponsiveVersions = async (
  file: File,
  originalQuality: number = 0.85
): Promise<{ desktop: File; tablet: File; mobile: File }> => {
  const [desktop, tablet, mobile] = await Promise.all([
    compressImage(file, 1200, originalQuality),
    compressImage(file, 800, originalQuality),
    compressImage(file, 400, originalQuality)
  ])
  
  return { desktop, tablet, mobile }
}

export function OptimizedMediaUpload({ 
  onMediaChange, 
  currentMedia, 
  currentMediaType = 'image',
  label = "Media Upload", 
  className = "",
  bucket,
  allowVideo = true,
  allowImage = true,
  maxSizeMB,
  enableOptimization = true,
  targetImageWidth = 1200,
  compressionQuality = 0.85
}: OptimizedMediaUploadProps) {
  const { session } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [mediaUrl, setMediaUrl] = useState('')
  const [previewMedia, setPreviewMedia] = useState(currentMedia || '')
  const [previewMediaType, setPreviewMediaType] = useState(currentMediaType)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number
    compressedSize: number
    savings: number
  } | null>(null)
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const optimizeImageFile = useCallback(async (file: File): Promise<File> => {
    if (!enableOptimization || !file.type.startsWith('image/')) {
      return file
    }

    setOptimizing(true)
    setOptimizationProgress(30)

    try {
      const optimizedFile = await compressImage(file, targetImageWidth, compressionQuality)
      
      setOptimizationProgress(100)

      // Calculate compression savings
      const originalSize = file.size
      const compressedSize = optimizedFile.size
      const savings = Math.round(((originalSize - compressedSize) / originalSize) * 100)

      setCompressionStats({
        originalSize,
        compressedSize,
        savings
      })

      // Quick cleanup
      setOptimizing(false)
      setOptimizationProgress(0)

      return optimizedFile
    } catch (error) {
      console.error('Optimization error:', error)
      setOptimizing(false)
      setOptimizationProgress(0)
      return file
    }
  }, [enableOptimization, targetImageWidth, compressionQuality])

  const handleFileUpload = async (file: File) => {
    if (!session) return

    const acceptedTypes = getAcceptedTypes()
    const maxSize = getMaxSize()

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setUploadError(`Please upload a valid file: ${getFileTypeDescription()}`)
      return
    }

    // Validate file size before optimization
    const sizeLimitMB = maxSizeMB || (file.type.startsWith('video/') ? 50 : 10)
    if (file.size > maxSize) {
      setUploadError(`File size must be less than ${sizeLimitMB}MB`)
      return
    }

    try {
      setUploadError('')
      setCompressionStats(null)

      // Optimize image files
      const processedFile = await optimizeImageFile(file)

      setUploading(true)
      setUploadProgress(20)

      const formData = new FormData()
      formData.append('file', processedFile)

      setUploadProgress(40)

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cfac176d/upload/${bucket}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      })

      setUploadProgress(100)

      if (response.ok) {
        const { url, fileType } = await response.json()
        setPreviewMedia(url)
        setPreviewMediaType(fileType)
        onMediaChange(url, fileType)
        
        // Show success message for optimized images (auto-hide after 3 seconds)
        if (compressionStats && compressionStats.savings > 0) {
          setTimeout(() => {
            setCompressionStats(null)
          }, 3000)
        }
      } else {
        const { error } = await response.json()
        setUploadError(error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setUploadError('An unexpected error occurred during upload')
    } finally {
      setUploading(false)
      // Quick progress reset
      setTimeout(() => setUploadProgress(0), 200)
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
    setCompressionStats(null)
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
          {enableOptimization && allowImage ? (
            <Zap className="h-4 w-4" />
          ) : (
            getFileTypeIcon()
          )}
          {enableOptimization && allowImage ? 'Smart Upload' : 'Upload File'}
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

      {/* Compression Stats */}
      {compressionStats && (
        <div className="glass-card p-3 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
            <CheckCircle className="h-4 w-4" />
            Image Optimized Successfully!
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Original:</span> {formatFileSize(compressionStats.originalSize)}
            </div>
            <div>
              <span className="font-medium">Compressed:</span> {formatFileSize(compressionStats.compressedSize)}
            </div>
            <div className="col-span-2">
              <span className="font-medium">Space Saved:</span> {compressionStats.savings}% 
              ({formatFileSize(compressionStats.originalSize - compressionStats.compressedSize)})
            </div>
          </div>
        </div>
      )}

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
                  preload="metadata"
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
                loading="lazy"
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
              {enableOptimization && allowImage ? (
                <Zap className="h-6 w-6 text-primary" />
              ) : allowVideo && allowImage ? (
                <Upload className="h-6 w-6 text-muted-foreground" />
              ) : allowVideo ? (
                <Video className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {enableOptimization && allowImage 
                  ? 'Click to upload with auto-optimization'
                  : 'Click to upload or drag and drop'
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {getFileTypeDescription()} up to {maxSizeMB || (allowVideo ? 50 : 10)}MB
              </p>
              {enableOptimization && allowImage && (
                <p className="text-xs text-primary mt-1">
                  ⚡ Images will be automatically compressed to WebP format
                </p>
              )}
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

      {/* Optimization Progress */}
      {optimizing && (
        <div className="space-y-2">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm text-primary">
              <Zap className="w-4 h-4" />
              Optimizing image...
            </div>
          </div>
          {optimizationProgress > 0 && (
            <Progress value={optimizationProgress} className="h-2" />
          )}
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