import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { Progress } from './ui/progress'
import { Upload, X, Camera, Link, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from './AuthContext'
import { supabase } from '../utils/supabase/client'
// Removed bucket creation imports since buckets already exist

interface FixedMediaUploadProps {
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

export function FixedMediaUpload({ 
  onMediaChange, 
  currentMedia, 
  currentMediaType = 'image',
  label = "Media Upload", 
  className = "",
  bucket,
  allowVideo = true,
  allowImage = true,
  maxSizeMB
}: FixedMediaUploadProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [previewMedia, setPreviewMedia] = useState(currentMedia || '')
  const [previewMediaType, setPreviewMediaType] = useState(currentMediaType)
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (!user) {
      setUploadError('You must be logged in to upload files')
      return
    }

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
    setUploadSuccess('')
    setUploadProgress(0)

    try {
      // Create file path
      const fileExtension = file.name.split('.').pop()
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const fileName = `${user.id}/${timestamp}-${randomId}.${fileExtension}`
      const bucketName = `make-cfac176d-${bucket}`

      // Set initial progress
      setUploadProgress(20)

      // Skip bucket creation since buckets already exist
      console.log('Using existing bucket:', bucketName)
      setUploadProgress(40)

      // Step 2: Upload file
      console.log('Uploading file to:', bucketName, fileName)
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      setUploadProgress(95)

      // Step 3: Get public URL (more reliable than signed URLs)
      console.log('Getting public URL for:', fileName)
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get file URL')
      }

      setUploadProgress(100)

      const fileType = file.type.startsWith('video/') ? 'video' : 'image'
      setPreviewMedia(urlData.publicUrl)
      setPreviewMediaType(fileType)
      onMediaChange(urlData.publicUrl, fileType)
      
      setUploadSuccess('File uploaded successfully!')
      
      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'An unexpected error occurred during upload')
    } finally {
      setUploading(false)
      // Quick progress reset
      setTimeout(() => {
        setUploadProgress(0)
        setUploadSuccess('')
      }, 1000)
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

    try {
      new URL(mediaUrl)
      const isVideo = /\.(mp4|webm|ogg|mov|avi)$/i.test(mediaUrl) || mediaUrl.includes('video')
      const mediaType = isVideo ? 'video' : 'image'
      
      setPreviewMedia(mediaUrl)
      setPreviewMediaType(mediaType)
      onMediaChange(mediaUrl, mediaType)
      setUploadError('')
      setUploadSuccess('Media URL added successfully!')
    } catch {
      setUploadError('Please enter a valid URL')
    }
  }

  const handleRemoveMedia = () => {
    setPreviewMedia('')
    setMediaUrl('')
    setUploadError('')
    setUploadSuccess('')
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
          disabled={uploading}
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
        <Button
          type="button"
          variant={uploadMethod === 'url' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUploadMethod('url')}
          className="gap-2"
          disabled={uploading}
        >
          <Link className="h-4 w-4" />
          Media URL
        </Button>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            {uploadSuccess}
          </AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {previewMedia && (
        <div className="relative">
          <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden border">
            {previewMediaType === 'video' ? (
              <video
                src={previewMedia}
                controls
                className="w-full h-full object-contain bg-black"
              />
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
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* File Upload */}
      {uploadMethod === 'file' && !previewMedia && (
        <div
          className={`border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors cursor-pointer ${
            uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={getFileInputAccept()}
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
              {allowVideo && allowImage ? (
                <Upload className="h-6 w-6 text-muted-foreground" />
              ) : allowVideo ? (
                <Upload className="h-6 w-6 text-muted-foreground" />
              ) : (
                <Camera className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
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
            disabled={uploading}
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!mediaUrl.trim() || uploading}
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
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}