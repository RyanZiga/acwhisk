import React, { useEffect } from 'react'
import { useRealtime } from './hooks/useRealtime'
import { useNotifications } from './ui/notification'
import { ChefHat, MessageCircle, Heart, Users, Star } from 'lucide-react'

interface RealTimeNotificationsProps {
  onTabChange: (tab: string) => void
}

export function RealTimeNotifications({ onTabChange }: RealTimeNotificationsProps) {
  const { activities, connectionStatus, recipes, forumPosts } = useRealtime()
  const { addNotification } = useNotifications()
  
  const showSuccess = React.useCallback((title: string, message: string, action?: any) => {
    addNotification({ type: 'success', title, message, action })
  }, [addNotification])
  
  const showInfo = React.useCallback((title: string, message: string, action?: any) => {
    addNotification({ type: 'info', title, message, action })
  }, [addNotification])

  // Track previous data to detect new items
  const [prevActivitiesCount, setPrevActivitiesCount] = React.useState(0)
  const [prevRecipesCount, setPrevRecipesCount] = React.useState(0)
  const [prevForumPostsCount, setPrevForumPostsCount] = React.useState(0)
  const [hasShownConnectionNotification, setHasShownConnectionNotification] = React.useState(false)

  // Connection status notifications
  useEffect(() => {
    if (connectionStatus === 'connected' && !hasShownConnectionNotification) {
      showSuccess(
        'Connected!',
        'Ready for real-time updates when Supabase is integrated',
        {
          label: 'View Dashboard',
          onClick: () => onTabChange('dashboard')
        }
      )
      setHasShownConnectionNotification(true)
    }
  }, [connectionStatus, hasShownConnectionNotification, showSuccess, onTabChange])

  // New activity notifications
  useEffect(() => {
    if (activities.length > prevActivitiesCount && prevActivitiesCount > 0) {
      const newActivities = activities.slice(0, activities.length - prevActivitiesCount)
      
      // Add small delay to prevent spam
      const timer = setTimeout(() => {
        newActivities.forEach((activity, index) => {
          setTimeout(() => {
            showInfo(
              'New Activity',
              activity.description,
              {
                label: 'View Details',
                onClick: () => getActivityAction(activity.type, onTabChange)
              }
            )
          }, index * 500) // Stagger notifications
        })
      }, 1000)
      
      return () => clearTimeout(timer)
    }
    setPrevActivitiesCount(activities.length)
  }, [activities.length])

  // New recipe notifications
  useEffect(() => {
    if (recipes.length > prevRecipesCount && prevRecipesCount > 0) {
      const newRecipes = recipes.slice(0, recipes.length - prevRecipesCount)
      
      newRecipes.forEach(recipe => {
        showSuccess(
          'New Recipe Shared!',
          `"${recipe.title}" by ${recipe.author}`,
          {
            label: 'View Recipe',
            onClick: () => onTabChange('recipes')
          }
        )
      })
    }
    setPrevRecipesCount(recipes.length)
  }, [recipes.length])

  // New forum post notifications
  useEffect(() => {
    if (forumPosts.length > prevForumPostsCount && prevForumPostsCount > 0) {
      const newPosts = forumPosts.slice(0, forumPosts.length - prevForumPostsCount)
      
      newPosts.forEach(post => {
        showInfo(
          'New Discussion',
          `"${post.title}" in ${post.category}`,
          {
            label: 'Join Discussion',
            onClick: () => onTabChange('forum')
          }
        )
      })
    }
    setPrevForumPostsCount(forumPosts.length)
  }, [forumPosts.length])

  return null // This component only handles notifications
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'recipe_created':
      return ChefHat
    case 'post_created':
    case 'comment_added':
      return MessageCircle
    case 'recipe_liked':
      return Heart
    case 'user_joined':
      return Users
    case 'achievement_earned':
      return Star
    default:
      return MessageCircle
  }
}

function getActivityAction(type: string, onTabChange: (tab: string) => void) {
  switch (type) {
    case 'recipe_created':
    case 'recipe_liked':
      onTabChange('recipes')
      break
    case 'post_created':
    case 'comment_added':
      onTabChange('forum')
      break
    case 'achievement_earned':
      onTabChange('portfolio')
      break
    default:
      onTabChange('dashboard')
  }
}