import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../utils/supabase/client'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { MotionCard } from './ui/motion'
import { Star, ThumbsUp, MessageCircle, Edit3, Trash2, Save, X } from 'lucide-react'
import { useNotifications } from './ui/notification'

interface Rating {
  id: string
  user_id: string
  rating: number
  review: string
  created_at: string
  updated_at: string
  profiles: {
    name: string
    avatar_url: string
  }
}

interface RecipeRatingReviewProps {
  recipeId: string
  recipeTitle: string
  authorId: string
}

export function RecipeRatingReview({ recipeId, recipeTitle, authorId }: RecipeRatingReviewProps) {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  
  const [ratings, setRatings] = useState<Rating[]>([])
  const [userRating, setUserRating] = useState<Rating | null>(null)
  const [newRating, setNewRating] = useState(0)
  const [newReview, setNewReview] = useState('')
  const [editingRating, setEditingRating] = useState<string | null>(null)
  const [editReview, setEditReview] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Calculate average rating and total
  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 0
  const totalRatings = ratings.length

  // Helper function to check if user can submit reviews
  const canUserSubmitReviews = () => {
    return user && user.role !== 'student'
  }

  useEffect(() => {
    fetchRatings()
  }, [recipeId])

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from('recipe_ratings')
        .select(`
          *,
          profiles (name, avatar_url)
        `)
        .eq('recipe_id', recipeId)
        .order('created_at', { ascending: false })

      if (error) {
        // Handle missing tables gracefully
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('Recipe ratings table not available. Database setup may be required.')
          setRatings([])
          return
        }
        console.error('Error fetching ratings:', error)
        return
      }

      setRatings(data || [])
      
      // Find user's existing rating
      if (user) {
        const existingRating = data?.find(r => r.user_id === user.id)
        if (existingRating) {
          setUserRating(existingRating)
          setNewRating(existingRating.rating)
          setNewReview(existingRating.review || '')
        }
      }
    } catch (error) {
      console.error('Error fetching ratings:', error)
      setRatings([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitRating = async () => {
    if (!user || !newRating) return

    // Check if user is a student and block submission
    if (user.role === 'student') {
      addNotification({
        title: 'Access Denied',
        message: 'Students are not allowed to submit reviews. Please contact an instructor if you have feedback.',
        type: 'error'
      })
      return
    }

    setSubmitting(true)

    try {
      if (userRating) {
        // Update existing rating
        const { error } = await supabase
          .from('recipe_ratings')
          .update({
            rating: newRating,
            review: newReview,
            updated_at: new Date().toISOString()
          })
          .eq('id', userRating.id)

        if (error) {
          // Handle specific RLS error for students
          if (error.code === '42501' || error.message.includes('permission denied')) {
            addNotification({
              title: 'Access Denied',
              message: 'Students are not allowed to submit reviews. Please contact an instructor if you have feedback.',
              type: 'error'
            })
            return
          }
          throw error
        }

        addNotification({
          title: 'Rating Updated! ⭐',
          message: 'Your recipe rating has been updated.',
          type: 'success'
        })
      } else {
        // Create new rating
        const { error } = await supabase
          .from('recipe_ratings')
          .insert({
            recipe_id: recipeId,
            user_id: user.id,
            rating: newRating,
            review: newReview
          })

        if (error) {
          // Handle specific RLS error for students
          if (error.code === '42501' || error.message.includes('permission denied')) {
            addNotification({
              title: 'Access Denied',
              message: 'Students are not allowed to submit reviews. Please contact an instructor if you have feedback.',
              type: 'error'
            })
            return
          }
          throw error
        }

        // Try to add activity for the recipe author
        if (authorId !== user.id) {
          try {
            await supabase.from('activities').insert({
              user_id: authorId,
              type: 'recipe_rated',
              description: `${user.name} rated your recipe "${recipeTitle}" ${newRating} stars`
            })
          } catch (activityError) {
            console.warn('Activities table not available:', activityError)
          }
        }

        addNotification({
          title: 'Rating Submitted! ⭐',
          message: 'Thank you for rating this recipe!',
          type: 'success'
        })
      }

      // Refresh ratings
      await fetchRatings()
    } catch (error) {
      console.error('Error submitting rating:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to submit rating. Please try again.',
        type: 'error'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditRating = (rating: Rating) => {
    setEditingRating(rating.id)
    setEditReview(rating.review || '')
  }

  const handleUpdateReview = async (ratingId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('recipe_ratings')
        .update({
          review: editReview,
          updated_at: new Date().toISOString()
        })
        .eq('id', ratingId)
        .eq('user_id', user.id)

      if (error) {
        // Handle specific RLS error for students
        if (error.code === '42501' || error.message.includes('permission denied')) {
          addNotification({
            title: 'Access Denied',
            message: 'Students are not allowed to submit reviews. Please contact an instructor if you have feedback.',
            type: 'error'
          })
          return
        }
        throw error
      }

      setEditingRating(null)
      setEditReview('')
      await fetchRatings()

      addNotification({
        title: 'Review Updated! 📝',
        message: 'Your review has been updated.',
        type: 'success'
      })
    } catch (error) {
      console.error('Error updating review:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update review. Please try again.',
        type: 'error'
      })
    }
  }

  const handleDeleteRating = async (ratingId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('recipe_ratings')
        .delete()
        .eq('id', ratingId)
        .eq('user_id', user.id)

      if (error) {
        // Handle specific RLS error for students
        if (error.code === '42501' || error.message.includes('permission denied')) {
          addNotification({
            title: 'Access Denied',
            message: 'Students are not allowed to submit reviews. Please contact an instructor if you have feedback.',
            type: 'error'
          })
          return
        }
        throw error
      }

      await fetchRatings()
      setNewRating(0)
      setNewReview('')

      addNotification({
        title: 'Rating Deleted',
        message: 'Your rating has been removed.',
        type: 'success'
      })
    } catch (error) {
      console.error('Error deleting rating:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to delete rating. Please try again.',
        type: 'error'
      })
    }
  }

  const renderStars = (rating: number, interactive = false, onStarClick?: (star: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            } ${
              interactive 
                ? 'cursor-pointer hover:fill-yellow-300 hover:text-yellow-300 transition-colors' 
                : ''
            }`}
            onClick={() => interactive && onStarClick?.(star)}
          />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <MotionCard 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ratings & Reviews</span>
            <div className="flex items-center gap-2">
              {renderStars(Math.round(averageRating))}
              <span className="font-medium">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({totalRatings} reviews)</span>
            </div>
          </CardTitle>
        </CardHeader>
      </MotionCard>

      {/* User Rating Form */}
      {user && user.id !== authorId && (
        <MotionCard 
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              {userRating ? 'Update Your Rating' : 'Rate This Recipe'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!canUserSubmitReviews() ? (
              // Show restricted message for students
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <X className="w-5 h-5 text-red-500 dark:text-red-400" />
                  <span className="font-medium text-red-700 dark:text-red-300">Reviews Restricted</span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400">
                  Students are not allowed to submit reviews. Please contact an instructor if you have feedback.
                </p>
              </div>
            ) : (
              // Show rating form for instructors and admins
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Rating</label>
                  {renderStars(newRating, true, setNewRating)}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Review (Optional)</label>
                  <Textarea
                    value={newReview}
                    onChange={(e) => setNewReview(e.target.value)}
                    placeholder="Share your thoughts about this recipe..."
                    className="glass-input min-h-20"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {newReview.length}/500 characters
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmitRating}
                    disabled={!newRating || submitting}
                    className="glass-button"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        {userRating ? 'Updating...' : 'Submitting...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {userRating ? 'Update Rating' : 'Submit Rating'}
                      </>
                    )}
                  </Button>
                  
                  {userRating && (
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteRating(userRating.id)}
                      className="glass-input border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Rating
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </MotionCard>
      )}

      {/* Reviews List */}
      {ratings.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">All Reviews</h3>
          
          {ratings.map((rating, index) => (
            <MotionCard 
              key={rating.id}
              className="glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={rating.profiles?.avatar_url} />
                      <AvatarFallback className="bg-calm-gradient text-white">
                        {rating.profiles?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{rating.profiles?.name}</p>
                          <div className="flex items-center gap-2">
                            {renderStars(rating.rating)}
                            <span className="text-sm text-muted-foreground">
                              {new Date(rating.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {user?.id === rating.user_id && canUserSubmitReviews() && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRating(rating)}
                              className="glass-input border-glass-border"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteRating(rating.id)}
                              className="glass-input border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {editingRating === rating.id ? (
                        <div className="space-y-3">
                          <Textarea
                            value={editReview}
                            onChange={(e) => setEditReview(e.target.value)}
                            className="glass-input"
                            placeholder="Update your review..."
                            maxLength={500}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateReview(rating.id)}
                              className="glass-button"
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingRating(null)
                                setEditReview('')
                              }}
                              className="glass-input border-glass-border"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        rating.review && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {rating.review}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </MotionCard>
          ))}
        </div>
      )}

      {ratings.length === 0 && (
        <MotionCard 
          className="glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No reviews yet</h3>
            <p className="text-sm text-muted-foreground">
              Be the first to rate and review this recipe!
            </p>
          </CardContent>
        </MotionCard>
      )}
    </div>
  )
}