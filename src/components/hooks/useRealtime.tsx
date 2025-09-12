import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../AuthContext'
import { supabase } from '../../utils/supabase/client'

interface RealtimeData {
  recipes: any[]
  forumPosts: any[]
  activities: any[]
  loading: boolean
  error: string | null
}

interface ActivityItem {
  id: string
  user_id: string
  type: 'recipe_created' | 'post_created' | 'comment_added' | 'recipe_liked'
  description: string
  timestamp: string
  metadata?: any
}

export function useRealtime() {
  const { session, user } = useAuth()
  const [data, setData] = useState<RealtimeData>({
    recipes: [],
    forumPosts: [],
    activities: [],
    loading: true,
    error: null
  })

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting')

  // Load real data from Supabase
  const loadRealData = useCallback(async () => {
    if (!session) return { recipes: [], forumPosts: [], activities: [] }

    try {
      let recipes = []
      let forumPosts = []
      let activities = []

      // Try to fetch recipes with error handling for missing tables
      try {
        const { data: recipesData, error: recipesError } = await supabase
          .from('recipes')
          .select(`
            *,
            profiles:author_id (name, avatar_url),
            recipe_likes (id),
            recipe_ratings (rating)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!recipesError || (recipesError.code !== 'PGRST205' && recipesError.code !== '42P01')) {
          recipes = recipesData?.map(recipe => ({
            id: recipe.id,
            title: recipe.title,
            author: recipe.profiles?.name || 'Unknown',
            author_avatar: recipe.profiles?.avatar_url,
            likes: recipe.recipe_likes?.length || 0,
            rating_count: recipe.recipe_ratings?.length || 0,
            average_rating: recipe.recipe_ratings?.length > 0 
              ? recipe.recipe_ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / recipe.recipe_ratings.length 
              : 0,
            image: recipe.image_url,
            created_at: recipe.created_at,
            difficulty: recipe.difficulty,
            cookTime: `${(recipe.prep_time || 0) + (recipe.cook_time || 0)} min`,
            description: recipe.description,
            servings: recipe.servings
          })) || []
        }
      } catch (error) {
        console.warn('Recipes table not available:', error)
      }

      // Try to fetch forum posts with error handling
      try {
        const { data: forumData, error: forumError } = await supabase
          .from('forum_posts')
          .select(`
            *,
            profiles:author_id (name, avatar_url),
            forum_categories (name, color),
            forum_replies (id)
          `)
          .order('created_at', { ascending: false })
          .limit(20)

        if (!forumError || (forumError.code !== 'PGRST205' && forumError.code !== '42P01')) {
          forumPosts = forumData?.map(post => ({
            id: post.id,
            title: post.title,
            author: post.profiles?.name || 'Unknown',
            author_avatar: post.profiles?.avatar_url,
            replies: post.forum_replies?.length || 0,
            likes: 0,
            created_at: post.created_at,
            category: post.forum_categories?.name || 'General',
            category_color: post.forum_categories?.color || '#A18CFF'
          })) || []
        }
      } catch (error) {
        console.warn('Forum tables not available:', error)
      }

      // Try to fetch activities with error handling
      try {
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (!activitiesError || (activitiesError.code !== 'PGRST205' && activitiesError.code !== '42P01')) {
          activities = activitiesData?.map(activity => ({
            id: activity.id,
            user_id: activity.user_id,
            type: activity.type,
            description: activity.description,
            timestamp: activity.created_at,
            metadata: activity.metadata
          })) || []
        }
      } catch (error) {
        console.warn('Activities table not available:', error)
      }

      return {
        recipes,
        forumPosts,
        activities
      }
    } catch (error) {
      console.error('Error loading real-time data:', error)
      return {
        recipes: [],
        forumPosts: [],
        activities: []
      }
    }
  }, [session, user?.id])

  // Initialize connection and load real data
  useEffect(() => {
    if (!session) return

    setConnectionStatus('connecting')
    setData(prev => ({ ...prev, loading: true, error: null }))

    // Initialize real-time connection
    const initializeConnection = async () => {
      try {
        const realData = await loadRealData()
        
        setConnectionStatus('connected')
        setData({
          recipes: realData.recipes,
          forumPosts: realData.forumPosts,
          activities: realData.activities,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Connection failed:', error)
        setConnectionStatus('disconnected')
        setData(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to connect to real-time updates' 
        }))
      }
    }

    // Small delay to show loading state
    const connectTimer = setTimeout(initializeConnection, 1000)
    return () => clearTimeout(connectTimer)
  }, [session, loadRealData])

  // Set up real-time subscriptions
  useEffect(() => {
    if (connectionStatus !== 'connected') return

    const channel = supabase.channel('realtime-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'recipes'
      }, async (payload) => {
        console.log('Recipe updated:', payload)
        // Refresh recipes data
        const newData = await loadRealData()
        setData(prev => ({ ...prev, recipes: newData.recipes }))
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'forum_posts'
      }, async (payload) => {
        console.log('Forum post updated:', payload)
        // Refresh forum posts data
        const newData = await loadRealData()
        setData(prev => ({ ...prev, forumPosts: newData.forumPosts }))
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'activities',
        filter: `user_id=eq.${user?.id}`
      }, async (payload) => {
        console.log('Activity updated:', payload)
        // Refresh activities data
        const newData = await loadRealData()
        setData(prev => ({ ...prev, activities: newData.activities }))
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [connectionStatus, user?.id, loadRealData])

  // Functions for manual data updates
  const addRecipe = useCallback(async (recipe: any) => {
    if (!user) {
      console.error('No user found when trying to add recipe')
      throw new Error('User not authenticated')
    }

    console.log('Adding recipe with user ID:', user.id)
    console.log('User object:', user)

    try {
      const insertData = {
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        difficulty: recipe.difficulty,
        servings: recipe.servings,
        image_url: recipe.image_url,
        image_urls: recipe.image_urls,
        tags: recipe.tags,
        author_id: user.id,
        is_public: recipe.is_public ?? true
      }

      console.log('Insert data:', insertData)

      const { data: newRecipe, error } = await supabase
        .from('recipes')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        // If table doesn't exist, handle gracefully
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('Recipes table not available. Please set up the database schema.')
          throw new Error('Recipes table not available. Please set up the database schema.')
        }
        console.error('Error adding recipe:', error)
        throw error
      }

      // Try to add activity (handle missing table gracefully)
      try {
        await supabase.from('activities').insert({
          user_id: user.id,
          type: 'recipe_created',
          description: `You shared a new recipe: "${recipe.title}"`
        })
      } catch (activityError) {
        console.warn('Activities table not available:', activityError)
      }

      // Refresh data
      const newData = await loadRealData()
      setData(prev => ({ ...prev, recipes: newData.recipes, activities: newData.activities }))
    } catch (error) {
      console.error('Error adding recipe:', error)
    }
  }, [user, loadRealData])

  const addForumPost = useCallback(async (post: any) => {
    if (!user) return

    try {
      const { data: newPost, error } = await supabase
        .from('forum_posts')
        .insert({
          title: post.title,
          content: post.content,
          author_id: user.id,
          category_id: post.category_id
        })
        .select()
        .single()

      if (error) {
        // If table doesn't exist, handle gracefully
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.warn('Forum tables not available. Please set up the database schema.')
          return
        }
        console.error('Error adding forum post:', error)
        return
      }

      // Try to add activity (handle missing table gracefully)
      try {
        await supabase.from('activities').insert({
          user_id: user.id,
          type: 'post_created',
          description: `You posted: "${post.title}"`
        })
      } catch (activityError) {
        console.warn('Activities table not available:', activityError)
      }

      // Refresh data
      const newData = await loadRealData()
      setData(prev => ({ ...prev, forumPosts: newData.forumPosts, activities: newData.activities }))
    } catch (error) {
      console.error('Error adding forum post:', error)
    }
  }, [user, loadRealData])

  return {
    ...data,
    connectionStatus,
    addRecipe,
    addForumPost,
    refresh: async () => {
      const realData = await loadRealData()
      setData({
        recipes: realData.recipes,
        forumPosts: realData.forumPosts,
        activities: realData.activities,
        loading: false,
        error: null
      })
    }
  }
}