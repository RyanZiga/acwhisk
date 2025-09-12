import React from 'react'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { 
  Edit, 
  Trash2, 
  Calendar, 
  Eye,
  Star,
  ChefHat,
  Trophy,
  Award,
  Briefcase
} from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'




interface PortfolioItem {
  id: string
  portfolio_id: string
  type: 'recipe' | 'achievement' | 'certification' | 'project'
  title: string
  description: string
  image_url?: string
  video_url?: string
  metadata: any
  created_at: string
}

interface PortfolioItemCardProps {
  item: PortfolioItem
  onEdit?: (item: PortfolioItem) => void
  onDelete?: (itemId: string) => void
  onView?: (item: PortfolioItem) => void
  readonly?: boolean
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'recipe':
      return ChefHat
    case 'achievement':
      return Trophy
    case 'certification':
      return Award
    case 'project':
      return Briefcase
    default:
      return Star
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'recipe':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'achievement':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'certification':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'project':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function PortfolioItemCard({ 
  item, 
  onEdit, 
  onDelete, 
  onView, 
  readonly = false 
}: PortfolioItemCardProps) {
  const TypeIcon = getTypeIcon(item.type)

  return (
    <Card className="glass-card group hover:scale-105 transition-all duration-200 hover:shadow-lg">
      <CardContent className="p-0">
        {/* Image Section */}
        {item.image_url && (
          <div className="relative overflow-hidden rounded-t-lg">
            <ImageWithFallback
              src={item.image_url}
              alt={item.title}
              className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            
            {/* Type Badge Overlay */}
            <div className="absolute top-3 left-3">
              <Badge className={`${getTypeColor(item.type)} border`}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {item.type}
              </Badge>
            </div>

            {/* Action Buttons Overlay */}
            {!readonly && (
              <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(item)
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0 bg-red-500/90 hover:bg-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(item.id)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            {!item.image_url && (
              <Badge className={`${getTypeColor(item.type)} border mb-2`}>
                <TypeIcon className="w-3 h-3 mr-1" />
                {item.type}
              </Badge>
            )}
            
            {!readonly && !item.image_url && (
              <div className="flex space-x-1">
                {onEdit && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(item)
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(item.id)
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Title and Description */}
          <h3 className="font-medium mb-2 line-clamp-1" title={item.title}>
            {item.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3" title={item.description}>
            {item.description}
          </p>

          {/* Metadata */}
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {item.metadata.difficulty && (
                  <Badge variant="outline" className="text-xs">
                    {item.metadata.difficulty}
                  </Badge>
                )}
                {item.metadata.duration && (
                  <Badge variant="outline" className="text-xs">
                    {item.metadata.duration} min
                  </Badge>
                )}
                {item.metadata.rating && (
                  <Badge variant="outline" className="text-xs">
                    <Star className="w-2 h-2 mr-1 fill-current" />
                    {item.metadata.rating}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(item.created_at).toLocaleDateString()}
            </div>
            
            {onView && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-primary hover:text-primary-foreground hover:bg-primary"
                onClick={(e) => {
                  e.stopPropagation()
                  onView(item)
                }}
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}