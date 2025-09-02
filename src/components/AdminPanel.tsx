import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Alert, AlertDescription } from './ui/alert'
import { Skeleton } from './ui/skeleton'
import { Avatar, AvatarFallback } from './ui/avatar'
import { AdminUserManagement } from './AdminUserManagement'
import { 
  Users, 
  MessageCircle, 
  ChefHat, 
  TrendingUp,
  Shield,
  UserCheck,
  UserX,
  Activity,
  Settings,
  BarChart3
} from 'lucide-react'

export function AdminPanel() {
  const { user, session } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    totalRecipes: 0,
    totalPosts: 0
  })

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData()
    } else {
      setError('Admin access required')
      setLoading(false)
    }
  }, [user])

  const fetchAdminData = async () => {
    try {
      let usersCount = 0
      let recipesCount = 0
      let postsCount = 0
      let activeCount = 0
      let usersSample = []

      // Fetch users count with error handling
      try {
        const { count, error: usersError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        
        if (!usersError || (usersError.code !== 'PGRST205' && usersError.code !== '42P01')) {
          usersCount = count || 0
          
          // Also fetch user sample if profiles table exists
          const { data: sampleData, error: sampleError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)
          
          if (!sampleError) {
            usersSample = sampleData || []
          }
        }
      } catch (error) {
        console.warn('Profiles table not available:', error)
      }

      // Fetch recipes count with error handling
      try {
        const { count, error: recipesError } = await supabase
          .from('recipes')
          .select('*', { count: 'exact', head: true })
        
        if (!recipesError || (recipesError.code !== 'PGRST205' && recipesError.code !== '42P01')) {
          recipesCount = count || 0
        }
      } catch (error) {
        console.warn('Recipes table not available:', error)
      }

      // Fetch forum posts count with error handling
      try {
        const { count, error: postsError } = await supabase
          .from('forum_posts')
          .select('*', { count: 'exact', head: true })
        
        if (!postsError || (postsError.code !== 'PGRST205' && postsError.code !== '42P01')) {
          postsCount = count || 0
        }
      } catch (error) {
        console.warn('Forum posts table not available:', error)
      }

      // Calculate active users with error handling
      try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        const { count, error: activeError } = await supabase
          .from('activities')
          .select('user_id', { count: 'exact', head: true })
          .gte('created_at', yesterday)
        
        if (!activeError || (activeError.code !== 'PGRST205' && activeError.code !== '42P01')) {
          activeCount = count || 0
        }
      } catch (error) {
        console.warn('Activities table not available:', error)
      }

      setStats({
        totalUsers: usersCount,
        activeToday: activeCount,
        totalRecipes: recipesCount,
        totalPosts: postsCount
      })

      setUsers(usersSample)

      // Check if any essential tables are missing
      if (usersCount === 0 && recipesCount === 0 && postsCount === 0) {
        setError('Database tables may not be set up yet. Please check the setup instructions.')
      }

    } catch (error) {
      console.error('Error fetching admin data:', error)
      setError('An error occurred while fetching data. Database may need setup.')
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'instructor':
        return 'bg-blue-100 text-blue-800'
      case 'student':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const timeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    const diffInWeeks = Math.floor(diffInDays / 7)
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`
    const diffInMonths = Math.floor(diffInDays / 30)
    return `${diffInMonths} months ago`
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Alert className="max-w-md">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Admin access required. You don't have permission to view this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Manage users, monitor activities, and maintain platform content</p>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.activeToday}</p>
                <p className="text-sm text-muted-foreground">Active Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalRecipes}</p>
                <p className="text-sm text-muted-foreground">Total Recipes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <MessageCircle className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPosts}</p>
                <p className="text-sm text-muted-foreground">Forum Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="content">Content Moderation</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Platform Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>Review and moderate platform content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Content Moderation</h3>
                <p>All content moderation tools will be available here</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ChefHat className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <p className="font-medium">Recipe Reviews</p>
                      <p className="text-sm text-muted-foreground">0 pending</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="font-medium">Forum Posts</p>
                      <p className="text-sm text-muted-foreground">0 reported</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <UserCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="font-medium">User Reports</p>
                      <p className="text-sm text-muted-foreground">0 active</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>View engagement and usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                <p>Detailed analytics and reports will be available here</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">User Engagement</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Daily Active Users</span>
                          <span className="font-medium">{stats.activeToday}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recipe Views</span>
                          <span className="font-medium">1,234</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Forum Interactions</span>
                          <span className="font-medium">456</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Growth Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>New Users (This Week)</span>
                          <span className="font-medium text-green-600">+12</span>
                        </div>
                        <div className="flex justify-between">
                          <span>New Recipes (This Week)</span>
                          <span className="font-medium text-blue-600">+8</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Forum Posts (This Week)</span>
                          <span className="font-medium text-purple-600">+15</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure platform-wide settings and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Platform Configuration</h3>
                <p>Global settings and configuration options will be available here</p>
                <div className="mt-6">
                  <Button variant="outline" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}