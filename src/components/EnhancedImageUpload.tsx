import React, { useState, useRef, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../utils/supabase/client'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Card, CardContent } from './ui/card'
import { 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Image as ImageIcon, 
  Loader2,
  Camera,
  FileImage,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
// Removed motion/react for performance

interface EnhancedImageUploadProps {
  onUpload: (url: string, metadata?: ImageMetadata) => void
  onError?: (error: string) => void
  bucket?: string
  path?: string
  className?: string
  accept?: string
  maxSize?: number // in MB
  disabled?: boolean
  showPreview?: boolean
  allowMultiple?: boolean
  variant?: 'default' | 'compact' | 'avatar'
}

interface ImageMetadata {
  originalSize: number
  compressedSize: number
  dimensions: {
    width: number
    height: number
  }
  format: string
  compressionRatio: number
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error'
  progress: number
  file?: File
  preview?: string
  metadata?: ImageMetadata
  error?: string
}

const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif']
}

const MAX_FILE_SIZE_MB = 10
const COMPRESSION_QUALITY = 0.8

export function EnhancedImageUpload({
  onUpload,
  onError,
  bucket = 'avatars',
  path = '',
  className = '',
  accept = 'image/*',
  maxSize = MAX_FILE_SIZE_MB,
  disabled = false,
  showPreview = true,
  allowMultiple = false,
  variant = 'default'
}: EnhancedImageUploadProps) {
  const { session } = useAuth()
  const [uploadState, setUploadState] = useState<UploadState>({ status: 'idle', progress: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      return `Invalid file type. Please upload ${Object.values(ALLOWED_FILE_TYPES).flat().join(', ')} files only.`
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSize) {
      return `File size too large. Maximum allowed size is ${maxSize}MB. Your file is ${fileSizeMB.toFixed(1)}MB.`
    }

    return null
  }

  const compressImage = async (file: File): Promise<{ compressedFile: File; metadata: ImageMetadata }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate optimal dimensions
        let { width, height } = img
        const maxDimension = 1920

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height)
          width *= ratio
          height *= ratio
        }

        canvas.width = width
        canvas.height = height

        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })

            const metadata: ImageMetadata = {
              originalSize: file.size,
              compressedSize: compressedFile.size,
              dimensions: { width, height },
              format: file.type,
              compressionRatio: ((file.size - compressedFile.size) / file.size) * 100
            }

            resolve({ compressedFile, metadata })
          },
          file.type,
          COMPRESSION_QUALITY
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const uploadFile = async (file: File) => {
    if (!session?.user?.id) {
      throw new Error('User not authenticated')
    }

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      throw new Error(validationError)
    }

    setUploadState({ status: 'uploading', progress: 10, file })

    try {
      // Compress image
      setUploadState(prev => ({ ...prev, progress: 30 }))
      const { compressedFile, metadata } = await compressImage(file)
      
      // Show compression feedback
      if (metadata.compressionRatio > 10) {
        toast.success(
          `Image optimized! Reduced file size by ${metadata.compressionRatio.toFixed(0)}% (${formatFileSize(metadata.originalSize)} → ${formatFileSize(metadata.compressedSize)})`,
          { duration: 4000 }
        )
      }

      setUploadState(prev => ({ ...prev, progress: 50, metadata }))

      // Generate unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = path ? `${path}/${fileName}` : fileName

      setUploadState(prev => ({ ...prev, progress: 70 }))

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      setUploadState(prev => ({ ...prev, progress: 90 }))

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      setUploadState(prev => ({
        ...prev,
        status: 'success',
        progress: 100,
        preview: publicUrl
      }))

      // Call success callback
      onUpload(publicUrl, metadata)
      
      toast.success('Image uploaded successfully!')

    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMessage = error.message || 'Failed to upload image'
      
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }))

      onError?.(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return
    
    const file = files[0] // Handle single file for now
    uploadFile(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return
    
    const files = e.dataTransfer.files
    handleFileSelect(files)
  }, [disabled, handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleClick = () => {
    if (disabled || uploadState.status === 'uploading') return
    fileInputRef.current?.click()
  }

  const handleReset = () => {
    setUploadState({ status: 'idle', progress: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'compact':
        return 'h-32'
      case 'avatar':
        return 'h-40 rounded-full max-w-40 mx-auto'
      default:
        return 'h-64'
    }
  }

  const renderContent = () => {
    switch (uploadState.status) {
      case 'uploading':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4 transition-opacity duration-300">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <p className="font-medium">Uploading image...</p>
              <p className="text-sm text-muted-foreground">
                {uploadState.file?.name}
              </p>
              <Progress value={uploadState.progress} className="w-48" />
              <p className="text-xs text-muted-foreground">
                {uploadState.progress}% complete
              </p>
            </div>
          </div>
        )

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4 transition-all duration-300">
            {showPreview && uploadState.preview && (
              <div className="relative max-w-full max-h-40 rounded-lg overflow-hidden">
                <img
                  src={uploadState.preview}
                  alt="Uploaded"
                  className="object-cover"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0"
                  onClick={handleReset}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-green-600">
              <div className="transition-transform duration-300 hover:scale-110">
                <Check className="w-6 h-6" />
              </div>
              <span className="font-medium">Upload successful!</span>
            </div>

            {uploadState.metadata && uploadState.metadata.compressionRatio > 0 && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground transition-all duration-300">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span>
                  Optimized by {uploadState.metadata.compressionRatio.toFixed(0)}%
                </span>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="mt-4"
            >
              Upload Another
            </Button>
          </div>
        )

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4 p-6 transition-all duration-300">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-8 h-8" />
              <span className="font-medium">Upload failed</span>
            </div>
            
            <Alert className="border-destructive/50 bg-destructive/5">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive">
                {uploadState.error}
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Try Again
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleClick}
              >
                Choose Different File
              </Button>
            </div>
          </div>
        )

      default:
        return (
          <div className={`flex flex-col items-center justify-center h-full space-y-4 p-6 cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-dashed border-2 border-muted-foreground/25 hover:border-primary hover:bg-primary/5'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {variant === 'avatar' ? (
                  <Camera className="w-8 h-8 text-primary" />
                ) : (
                  <Upload className="w-8 h-8 text-primary" />
                )}
              </div>
              {isDragOver && (
                <div className="absolute inset-0 border-2 border-primary rounded-full animate-pulse" />
              )}
            </div>

            <div className="text-center space-y-2">
              <p className="font-medium">
                {isDragOver 
                  ? 'Drop your image here' 
                  : variant === 'avatar'
                  ? 'Upload profile picture'
                  : 'Click to upload or drag and drop'
                }
              </p>
              <p className="text-sm text-muted-foreground">
                {Object.values(ALLOWED_FILE_TYPES).flat().join(', ')} up to {maxSize}MB
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="secondary" className="gap-1">
                <FileImage className="w-3 h-3" />
                Auto-optimize
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <ImageIcon className="w-3 h-3" />
                Smart resize
              </Badge>
            </div>
          </div>
        )
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={allowMultiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
        disabled={disabled}
      />
      
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            className={`w-full ${getVariantClasses()}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
          >
            {renderContent()}
          </div>
        </CardContent>
      </Card>
      
      {uploadState.metadata && uploadState.status === 'success' && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm space-y-1 transition-all duration-300">
          <div className="flex justify-between">
            <span>Original size:</span>
            <span className="font-medium">{formatFileSize(uploadState.metadata.originalSize)}</span>
          </div>
          <div className="flex justify-between">
            <span>Optimized size:</span>
            <span className="font-medium text-green-600">{formatFileSize(uploadState.metadata.compressedSize)}</span>
          </div>
          <div className="flex justify-between">
            <span>Dimensions:</span>
            <span className="font-medium">
              {uploadState.metadata.dimensions.width} × {uploadState.metadata.dimensions.height}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}