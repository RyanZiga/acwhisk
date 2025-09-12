import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { Input } from './ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Search, Users, ChefHat, MessageSquare, Eye, MessageCircle, UserPlus, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner@2.0.3'

interface SearchResultsProps {
  onBack: () => void
  initialQuery?: string
}

interface UserResult {
  id: string
  name: string
  avatar_url?: string
  bio?: string
  role: string
  created_at: string
  recipes_count?: number
  forum_posts_count?: number
}

interface RecipeResult {
  id: string
  title: string
  description?: string
  difficulty_level?: string
  prep_time?: number
  cook_time?: number
  image_url?: string
  created_at: string
  author: {
    name: string
    avatar_url?: string
  }
}

interface ForumResult {
  id: string
  title: string
  content: string
  category: string
  created_at: string
  author: {
    name: string
    avatar_url?: string
  }
  replies_count?: number
  likes_count?: number
}

export function SearchResults({ onBack, initialQuery = '' }: SearchResultsProps) {
  const { session } = useAuth()
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(false)
  const [userResults, setUserResults] = useState<UserResult[]>([])
  const [recipeResults, setRecipeResults] = useState<RecipeResult[]>([])
  const [forumResults, setForumResults] = useState<ForumResult[]>([])
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (query.trim()) {
      handleSearch()
    }
  }, [query])

  useEffect(() => {
    loadFollowingUsers()
  }, [session])

  const loadFollowingUsers = async () => {
    if (!session?.user?.id) return

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', session.user.id)

      if (error) {
        console.error('Error loading following users:', error)
        return
      }

      if (data) {
        setFollowingUsers(new Set(data.map(f => f.following_id)))
      }
    } catch (error) {
      console.error('Error loading following users:', error)
    }
  }

  const handleSearch = async () => {
    if (!query.trim() || loading) return

    setLoading(true)
    try {
      await Promise.all([
        searchUsers(),
        searchRecipes(),
        searchForum()
      ])
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          avatar_url,
          bio,
          role,
          created_at
        `)
        .or(`name.ilike.%${query}%,bio.ilike.%${query}%`)
        .neq('id', session?.user?.id || '')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error searching users:', error)
        return
      }

      setUserResults(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  const searchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          title,
          description,
          difficulty,
          prep_time,
          cook_time,
          image_url,
          created_at,
          author_id,
          profiles!recipes_author_id_fkey (
            name,
            avatar_url
          )
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error searching recipes:', error)
        return
      }

      const formattedResults = (data || []).map(recipe => ({
        ...recipe,
        difficulty_level: recipe.difficulty, // Map difficulty to difficulty_level for compatibility
        author: {
          name: recipe.profiles?.name || 'Unknown Chef',
          avatar_url: recipe.profiles?.avatar_url
        }
      }))

      setRecipeResults(formattedResults)
    } catch (error) {
      console.error('Error searching recipes:', error)
    }
  }

  const searchForum = async () => {
    try {
      const { data, error } = await supabase
        .from('forum_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          author_id,
          category_id,
          profiles!forum_posts_author_id_fkey (
            name,
            avatar_url
          ),
          forum_categories (
            name
          )
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error searching forum posts:', error)
        return
      }

      const formattedResults = (data || []).map(post => ({
        ...post,
        category: post.forum_categories?.name || 'General', // Map category name for compatibility
        author: {
          name: post.profiles?.name || 'Unknown User',
          avatar_url: post.profiles?.avatar_url
        },
        replies_count: 0,
        likes_count: 0
      }))

      setForumResults(formattedResults)
    } catch (error) {
      console.error('Error searching forum posts:', error)
    }
  }

  const handleFollowUser = async (userId: string) => {
    if (!session?.user?.id) {
      toast.error('Please sign in to follow users')
      return
    }

    try {
      const isFollowing = followingUsers.has(userId)
      
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', session.user.id)
          .eq('following_id', userId)

        if (error) throw error

        setFollowingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(userId)
          return newSet
        })

        toast.success('User unfollowed')
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: session.user.id,
            following_id: userId
          })

        if (error) throw error

        setFollowingUsers(prev => new Set(prev).add(userId))
        toast.success('User followed successfully')
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error)
      toast.error('Failed to update follow status')
    }
  }

  const handleViewProfile = (userId: string) => {
    // This would navigate to user profile - implement based on your routing
    toast.info('Profile view feature coming soon!')
  }

  const handleMessageUser = (userId: string) => {
    // This would open chat with user - implement based on your chat system
    toast.info('Direct messaging feature coming soon!')
  }

  const totalResults = userResults.length + recipeResults.length + forumResults.length

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-16">
      <div className="mx-auto mb-6 w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center">
        {type === 'users' && <Users className="w-10 h-10 text-muted-foreground" />}
        {type === 'recipes' && <ChefHat className="w-10 h-10 text-muted-foreground" />}
        {type === 'forum' && <MessageSquare className="w-10 h-10 text-muted-foreground" />}
        {type === 'all' && <Search className="w-10 h-10 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {query ? `No ${type === 'all' ? 'results' : type} found` : 'Start your search'}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {query 
          ? `We couldn't find any ${type === 'all' ? 'results' : type} matching "${query}". Try different keywords or check your spelling.`
          : `Search for users, recipes, or forum discussions to connect with the ACWhisk community.`
        }
      </p>
      {query && (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium">Try:</p>
          <ul className="space-y-1">
            <li>• Using different keywords</li>
            <li>• Checking your spelling</li>
            <li>• Using more general terms</li>
            <li>• Searching in different categories</li>
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header with back button and search */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for users, recipes, or forums..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Results summary */}
      {query.trim() && totalResults > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Found {totalResults} result{totalResults !== 1 ? 's' : ''} for</span>
          <Badge variant="secondary" className="px-2 py-1">
            "{query}"
          </Badge>
        </div>
      )}

      {/* Results tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="gap-2">
            <Search className="w-4 h-4" />
            All ({totalResults})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Users ({userResults.length})
          </TabsTrigger>
          <TabsTrigger value="recipes" className="gap-2">
            <ChefHat className="w-4 h-4" />
            Recipes ({recipeResults.length})
          </TabsTrigger>
          <TabsTrigger value="forum" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Forum ({forumResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {!query.trim() || totalResults === 0 ? (
            <EmptyState type="all" />
          ) : (
            <>
              {/* Users section */}
              {userResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Users ({userResults.length})
                  </h3>
                  <div className="grid gap-4">
                    {userResults.slice(0, 3).map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        isFollowing={followingUsers.has(user.id)}
                        onFollow={() => handleFollowUser(user.id)}
                        onViewProfile={() => handleViewProfile(user.id)}
                        onMessage={() => handleMessageUser(user.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Recipes section */}
              {recipeResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-primary" />
                    Recipes ({recipeResults.length})
                  </h3>
                  <div className="grid gap-4">
                    {recipeResults.slice(0, 3).map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                  </div>
                </div>
              )}

              {/* Forum section */}
              {forumResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Forum Posts ({forumResults.length})
                  </h3>
                  <div className="grid gap-4">
                    {forumResults.slice(0, 3).map((post) => (
                      <ForumCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          {userResults.length === 0 ? (
            <EmptyState type="users" />
          ) : (
            <div className="grid gap-4">
              {userResults.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  isFollowing={followingUsers.has(user.id)}
                  onFollow={() => handleFollowUser(user.id)}
                  onViewProfile={() => handleViewProfile(user.id)}
                  onMessage={() => handleMessageUser(user.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recipes" className="space-y-4">
          {recipeResults.length === 0 ? (
            <EmptyState type="recipes" />
          ) : (
            <div className="grid gap-4">
              {recipeResults.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="forum" className="space-y-4">
          {forumResults.length === 0 ? (
            <EmptyState type="forum" />
          ) : (
            <div className="grid gap-4">
              {forumResults.map((post) => (
                <ForumCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UserCard({ 
  user, 
  isFollowing, 
  onFollow, 
  onViewProfile, 
  onMessage 
}: {
  user: UserResult
  isFollowing: boolean
  onFollow: () => void
  onViewProfile: () => void
  onMessage: () => void
}) {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'instructor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'student': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar_url} alt={user.name} />
              <AvatarFallback className="text-lg">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold truncate">{user.name}</h3>
                <Badge className={getRoleBadgeColor(user.role)}>
                  {user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1)}
                </Badge>
              </div>
              
              {user.bio && (
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {user.bio}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                {user.recipes_count && (
                  <span>{user.recipes_count} recipes</span>
                )}
                {user.forum_posts_count && (
                  <span>{user.forum_posts_count} posts</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewProfile}
              className="gap-2 whitespace-nowrap"
            >
              <Eye className="w-4 h-4" />
              View Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onMessage}
              className="gap-2 whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" />
              Message
            </Button>
            <Button
              variant={isFollowing ? "secondary" : "default"}
              size="sm"
              onClick={onFollow}
              className="gap-2 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RecipeCard({ recipe }: { recipe: RecipeResult }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          {recipe.image_url && (
            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
              <img
                src={recipe.image_url}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-1 line-clamp-1">{recipe.title}</h3>
                {recipe.description && (
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {recipe.description}
                  </p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <span>By {recipe.author.name}</span>
                  {recipe.difficulty_level && (
                    <Badge variant="secondary" className="text-xs">
                      {recipe.difficulty_level}
                    </Badge>
                  )}
                  {recipe.prep_time && (
                    <span>{recipe.prep_time}min prep</span>
                  )}
                  {recipe.cook_time && (
                    <span>{recipe.cook_time}min cook</span>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {new Date(recipe.created_at).toLocaleDateString()}
                </p>
              </div>
              
              <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
                <Eye className="w-4 h-4" />
                View Recipe
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ForumCard({ post }: { post: ForumResult }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold line-clamp-1">{post.title}</h3>
              <Badge variant="outline" className="text-xs">
                {post.category}
              </Badge>
            </div>
            
            <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
              {post.content}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>By {post.author.name}</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              {post.replies_count > 0 && (
                <span>{post.replies_count} replies</span>
              )}
              {post.likes_count > 0 && (
                <span>{post.likes_count} likes</span>
              )}
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
            <MessageSquare className="w-4 h-4" />
            View Post
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}