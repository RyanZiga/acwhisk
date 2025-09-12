import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { Progress } from './ui/progress'
import { Upload, X, Camera, Link } from 'lucide-react'
import { useAuth } from './AuthContext'
import { supabase } from '../utils/supabase/client'
// Removed bucket creation imports since buckets already exist

interface SimpleImageUploadProps {
  onImageChange: (imageUrl: string) => void
  currentImage?: string
  label?: string
  className?: string
  bucket: 'recipes' | 'profiles' | 'forums' | 'resources' | 'chat-media'
  maxSizeMB?: number
}

export function SimpleImageUpload({ 
  onImageChange, 
  currentImage, 
  label = "Image Upload", 
  className = "",
  bucket,
  maxSizeMB = 10
}: SimpleImageUploadProps) {
  const { user } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [previewImage, setPreviewImage] = useState(currentImage || '')
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (file: File) => {
    if (!user) {
      setUploadError('You must be logged in to upload images')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid image file (JPEG, PNG, GIF, WebP)')
      return
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024
    if (file.size > maxSize) {
      setUploadError(`File size must be less than ${maxSizeMB}MB`)
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadProgress(0)

    try {
      // Set progress efficiently
      setUploadProgress(30)

      // Create file path
      const fileExtension = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
      const bucketName = `make-cfac176d-${bucket}`

      // Skip bucket creation since buckets already exist
      setUploadProgress(50)

      // Upload to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        })

      setUploadProgress(90)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setUploadError('Failed to upload image. Please try again.')
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      if (urlData?.publicUrl) {
        setUploadProgress(100)
        setPreviewImage(urlData.publicUrl)
        onImageChange(urlData.publicUrl)
        
        // Reset form
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setUploadError('Failed to get image URL')
      }
    } catch (error) {
      console.error('Upload error:', error)
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
    if (!imageUrl.trim()) {
      setUploadError('Please enter a valid image URL')
      return
    }

    try {
      new URL(imageUrl)
      setPreviewImage(imageUrl)
      onImageChange(imageUrl)
      setUploadError('')
    } catch {
      setUploadError('Please enter a valid URL')
    }
  }

  const handleRemoveImage = () => {
    setPreviewImage('')
    setImageUrl('')
    onImageChange('')
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
          <Upload className="h-4 w-4" />
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
          Image URL
        </Button>
      </div>

      {/* Preview */}
      {previewImage && (
        <div className="relative">
          <div className="aspect-video w-full max-w-md rounded-lg overflow-hidden border">
            <ImageWithFallback
              src={previewImage}
              alt="Image preview"
              className="w-full h-full object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-8 w-8"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* File Upload */}
      {uploadMethod === 'file' && !previewImage && (
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">
                Images (JPEG, PNG, GIF, WebP) up to {maxSizeMB}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* URL Input */}
      {uploadMethod === 'url' && !previewImage && (
        <div className="flex gap-2">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!imageUrl.trim()}
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
              Uploading image...
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