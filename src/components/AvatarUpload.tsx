import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Progress } from './ui/progress'
import { Upload, X, Camera, Link, User } from 'lucide-react'
import { useAuth } from './AuthContext'
import { projectId } from '../utils/supabase/info'

interface AvatarUploadProps {
  onAvatarChange: (avatarUrl: string) => void
  currentAvatar?: string
  userInitials?: string
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function AvatarUpload({ 
  onAvatarChange, 
  currentAvatar, 
  userInitials = 'U',
  className = "",
  size = 'lg'
}: AvatarUploadProps) {
  const { session } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [previewAvatar, setPreviewAvatar] = useState(currentAvatar || '')
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file')
  const [showUploadOptions, setShowUploadOptions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16', 
    lg: 'h-24 w-24',
    xl: 'h-32 w-32'
  }

  const handleFileUpload = async (file: File) => {
    if (!session) return

    // Validate file type - only images for avatars
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a valid image format (JPEG, PNG, GIF, WebP)')
      return
    }

    // Validate file size (5MB max for avatars)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
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
        setUploadProgress(prev => Math.min(prev + 15, 90))
      }, 150)

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cfac176d/upload/profiles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const { url } = await response.json()
        setPreviewAvatar(url)
        onAvatarChange(url)
        setShowUploadOptions(false)
      } else {
        const { error } = await response.json()
        setUploadError(error || 'Failed to upload avatar')
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
    if (!avatarUrl.trim()) {
      setUploadError('Please enter a valid image URL')
      return
    }

    // Basic URL validation
    try {
      new URL(avatarUrl)
      setPreviewAvatar(avatarUrl)
      onAvatarChange(avatarUrl)
      setUploadError('')
      setShowUploadOptions(false)
    } catch {
      setUploadError('Please enter a valid URL')
    }
  }

  const handleRemoveAvatar = () => {
    setPreviewAvatar('')
    setAvatarUrl('')
    onAvatarChange('')
    setShowUploadOptions(false)
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
      <div className="flex flex-col items-center space-y-4">
        {/* Avatar Display */}
        <div className="relative group">
          <Avatar className={`${sizeClasses[size]} cursor-pointer transition-all duration-200 hover:scale-105`}>
            <AvatarImage src={previewAvatar} alt="Avatar" />
            <AvatarFallback className="bg-primary/10 text-primary">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          
          {/* Hover Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center cursor-pointer"
            onClick={() => setShowUploadOptions(!showUploadOptions)}
          >
            <Camera className="h-6 w-6 text-white" />
          </div>
          
          {/* Remove Button */}
          {previewAvatar && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemoveAvatar}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Upload Options */}
        {showUploadOptions && (
          <div className="glass-card p-4 space-y-4 w-full max-w-sm">
            {/* Upload Method Toggle */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={uploadMethod === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMethod('file')}
                className="gap-2 flex-1"
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <Button
                type="button"
                variant={uploadMethod === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMethod('url')}
                className="gap-2 flex-1"
              >
                <Link className="h-4 w-4" />
                URL
              </Button>
            </div>

            {/* File Upload */}
            {uploadMethod === 'file' && (
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
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
                
                <div className="space-y-2">
                  <div className="mx-auto w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Choose photo</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* URL Input */}
            {uploadMethod === 'url' && (
              <div className="space-y-2">
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
                <Button
                  type="button"
                  onClick={handleUrlSubmit}
                  disabled={!avatarUrl.trim()}
                  className="w-full"
                >
                  Set Avatar
                </Button>
              </div>
            )}

            {/* Cancel Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUploadOptions(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="w-full max-w-sm space-y-2">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Uploading avatar...
              </div>
            </div>
            {uploadProgress > 0 && (
              <Progress value={uploadProgress} className="h-2" />
            )}
          </div>
        )}

        {/* Error State */}
        {uploadError && (
          <Alert variant="destructive" className="max-w-sm">
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        {/* Upload Button (when no options shown) */}
        {!showUploadOptions && !uploading && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowUploadOptions(true)}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            Change Avatar
          </Button>
        )}
      </div>
    </div>
  )
}