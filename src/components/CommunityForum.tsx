import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Alert, AlertDescription } from './ui/alert'
import { Skeleton } from './ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  Plus, 
  MessageCircle, 
  Heart, 
  Reply, 
  Search,
  Filter,
  TrendingUp,
  Clock,
  Users,
  Pin,
  ChefHat,
  BookOpen,
  HelpCircle,
  Lightbulb
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'
import { MediaUpload } from './MediaUpload'

export function CommunityForum() {
  const { user, session } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general',
    media_url: '',
    media_type: 'image' as 'image' | 'video'
  })

  const categories = [
    { id: 'all', label: 'All Posts', icon: MessageCircle, color: 'text-gray-600' },
    { id: 'recipes', label: 'Recipe Help', icon: ChefHat, color: 'text-orange-600' },
    { id: 'techniques', label: 'Techniques', icon: BookOpen, color: 'text-blue-600' },
    { id: 'equipment', label: 'Equipment', icon: Users, color: 'text-green-600' },
    { id: 'general', label: 'General Discussion', icon: MessageCircle, color: 'text-purple-600' },
    { id: 'tips', label: 'Tips & Tricks', icon: Lightbulb, color: 'text-yellow-600' },
    { id: 'help', label: 'Help & Support', icon: HelpCircle, color: 'text-red-600' }
  ]

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cfac176d/forum/posts`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const { posts } = await response.json()
        // Fetch user names for posts
        const postsWithUserData = await Promise.all(
          (posts || []).map(async (post: any) => {
            try {
              const userResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cfac176d/profile`, {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`,
                  'Content-Type': 'application/json'
                }
              })
              // For demo, we'll use a default user name
              return {
                ...post,
                author_name: 'Community Member',
                author_role: 'student'
              }
            } catch {
              return {
                ...post,
                author_name: 'Community Member',
                author_role: 'student'
              }
            }
          })
        )
        setPosts(postsWithUserData)
      }
    } catch (error) {
      console.error('Error fetching forum posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) return

    setCreateLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cfac176d/forum/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPost)
      })

      if (response.ok) {
        const { post } = await response.json()
        const postWithUserData = {
          ...post,
          author_name: user?.name || 'You',
          author_role: user?.role || 'student'
        }
        setPosts(prev => [postWithUserData, ...prev])
        setNewPost({ title: '', content: '', category: 'general', media_url: '', media_type: 'image' })
        setShowCreateDialog(false)
        setSuccess('Post created successfully!')
      } else {
        const { error } = await response.json()
        setError(error || 'Failed to create post')
      }
    } catch (error) {
      setError('An unexpected error occurred')
      console.error('Create post error:', error)
    } finally {
      setCreateLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0]
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
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  const PostCard = ({ post }: { post: any }) => {
    const categoryInfo = getCategoryInfo(post.category)
    const CategoryIcon = categoryInfo.icon

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {post.author_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'CM'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{post.author_name}</p>
                    <Badge className={getRoleColor(post.author_role)} variant="secondary">
                      {post.author_role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CategoryIcon className={`h-3 w-3 ${categoryInfo.color}`} />
                    <span>{categoryInfo.label}</span>
                    <span>•</span>
                    <Clock className="h-3 w-3" />
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{post.title}</h3>
              <p className="text-muted-foreground line-clamp-3">{post.content}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2 border-t">
              <Button variant="ghost" size="sm" className="gap-2">
                <Heart className="h-4 w-4" />
                <span>{post.likes || 0}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Reply className="h-4 w-4" />
                <span>{post.replies?.length || 0} replies</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-16 w-full" />
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Community Forum</h1>
          <p className="text-muted-foreground">Connect, discuss, and learn with fellow culinary enthusiasts</p>
        </div>
        
        {session && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Post</DialogTitle>
                <DialogDescription>
                  Share your thoughts, ask questions, or start a discussion
                </DialogDescription>
              </DialogHeader>
              
              {(error || success) && (
                <Alert className={success ? 'border-green-200 bg-green-50' : ''}>
                  <AlertDescription className={success ? 'text-green-800' : ''}>
                    {error || success}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={newPost.category}
                    onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    {categories.slice(1).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newPost.title}
                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What's your post about?"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Share your thoughts, questions, or tips..."
                    rows={6}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? 'Posting...' : 'Create Post'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <TabsTrigger key={category.id} value={category.id} className="text-xs">
                <Icon className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">{category.label.split(' ')[0]}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            {/* Category Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{filteredPosts.length}</p>
                      <p className="text-sm text-muted-foreground">Total Posts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">24</p>
                      <p className="text-sm text-muted-foreground">Active Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-2xl font-bold">156</p>
                      <p className="text-sm text-muted-foreground">Contributors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms' 
                      : 'Be the first to start a discussion in this category!'
                    }
                  </p>
                  {session && !searchTerm && (
                    <Button onClick={() => setShowCreateDialog(true)}>
                      Create First Post
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Community Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pin className="h-5 w-5" />
            Community Guidelines
          </CardTitle>
          <CardDescription>
            Help us maintain a welcoming and helpful community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-800 mb-2">✅ Do:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Be respectful and constructive</li>
                <li>• Share helpful tips and experiences</li>
                <li>• Ask questions when learning</li>
                <li>• Credit original recipes and sources</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-800 mb-2">❌ Don't:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Post spam or promotional content</li>
                <li>• Share inappropriate content</li>
                <li>• Be disrespectful to other members</li>
                <li>• Post duplicate questions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}