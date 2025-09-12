import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { useRealtime } from './hooks/useRealtime'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Skeleton } from './ui/skeleton'
import { MotionCard, MotionButton, MotionList, MotionProgress, MotionSpinner } from './ui/motion'
import { 
  ChefHat, 
  BookOpen, 
  MessageCircle, 
  Users, 
  Star,
  TrendingUp,
  Clock,
  Award,
  Plus,
  Zap,
  Target,
  Calendar,
  BarChart3,
  Sparkles,
  Coffee,
  Heart,
  Activity,
  Eye
} from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface DashboardProps {
  onTabChange: (tab: string) => void
}

export function Dashboard({ onTabChange }: DashboardProps) {
  const { user, session } = useAuth()
  const { isDark } = useTheme()
  const { 
    recipes, 
    forumPosts, 
    activities, 
    loading, 
    connectionStatus, 
    addRecipe, 
    addForumPost 
  } = useRealtime()
  
  const [stats, setStats] = useState({
    recipes: 0,
    forumPosts: 0,
    learningProgress: 65,
    communityRank: 12
  })

  useEffect(() => {
    // Update stats based on real-time data
    setStats(prev => ({
      ...prev,
      recipes: recipes.length,
      forumPosts: forumPosts.length
    }))
  }, [recipes.length, forumPosts.length])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const getMotivationalMessage = React.useMemo(() => {
    const messages = [
      "Ready to create something amazing today?",
      "Your culinary journey is looking fantastic!",
      "Let's cook up some magic together!",
      "What delicious adventure awaits today?",
      "You're on fire with your progress!"
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }, []) // Only generate once per component mount

  const firstName = user?.name.split(' ')[0] || user?.name

  if (loading) {
    return (
      <div className="space-y-8 flex flex-col items-center justify-center min-h-[50vh]">
        <MotionSpinner size={50} color="var(--primary)" />
        <MotionCard variant="fadeInUp" delay={0.2} className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Loading your dashboard...</h2>
          <p className="text-muted-foreground">Getting the latest updates from your culinary community</p>
        </MotionCard>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center lg:text-left">
        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-3">
          {getGreeting()}, {firstName}! <span className="wave">👋</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          {getMotivationalMessage}
        </p>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
          <Button 
            onClick={() => onTabChange('chat')}
            className="glass-button text-white border-0 px-6 py-3 rounded-2xl hover:glow-purple transition-all duration-300"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Ask AI Assistant
          </Button>
          <Button 
            onClick={() => onTabChange('recipes')}
            variant="outline" 
            className="glass-input border-white/20 text-foreground px-6 py-3 rounded-2xl hover:bg-white/20 transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Recipe
          </Button>
          <Button 
            onClick={() => onTabChange('forum')}
            variant="outline" 
            className="glass-input border-white/20 text-foreground px-6 py-3 rounded-2xl hover:bg-white/20 transition-all duration-300"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Join Discussion
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-0 shadow-none p-6 text-center floating">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <ChefHat className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.recipes}</div>
              <div className="text-sm text-muted-foreground">Recipes Shared</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-0 shadow-none p-6 text-center floating" style={{ animationDelay: '-1s' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
              <MessageCircle className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.forumPosts}</div>
              <div className="text-sm text-muted-foreground">Forum Posts</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-0 shadow-none p-6 text-center floating" style={{ animationDelay: '-2s' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{stats.learningProgress}%</div>
              <div className="text-sm text-muted-foreground">Learning Progress</div>
            </div>
          </div>
        </Card>

        <Card className="glass-card border-0 shadow-none p-6 text-center floating" style={{ animationDelay: '-3s' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20">
              <Award className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">#{stats.communityRank}</div>
              <div className="text-sm text-muted-foreground">Community Rank</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Tasks & Progress */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Focus */}
          <Card className="glass-card border-0 shadow-none">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                    <Target className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-foreground">Today's Focus</CardTitle>
                    <CardDescription className="text-muted-foreground">Let's make today count!</CardDescription>
                  </div>
                </div>
                <Badge className="bg-aurora-gradient text-white border-0 rounded-full px-3">
                  3 tasks
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 glass-input rounded-2xl cursor-pointer hover:bg-white/20 transition-colors" onClick={() => onTabChange('recipes')}>
                  <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">Share your signature dish recipe</div>
                    <div className="text-sm text-muted-foreground">Due today • High priority</div>
                  </div>
                  <Badge className="bg-red-100 text-red-600 text-xs rounded-full">High</Badge>
                </div>

                <div className="flex items-center gap-3 p-4 glass-input rounded-2xl cursor-pointer hover:bg-white/20 transition-colors" onClick={() => onTabChange('learning')}>
                  <div className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">Complete "Advanced Plating" module</div>
                    <div className="text-sm text-muted-foreground">3 days left • Medium priority</div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-600 text-xs rounded-full">Medium</Badge>
                </div>

                <div className="flex items-center gap-3 p-4 glass-input rounded-2xl cursor-pointer hover:bg-white/20 transition-colors" onClick={() => onTabChange('forum')}>
                  <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">Reply to community questions</div>
                    <div className="text-sm text-muted-foreground">1 week left • Low priority</div>
                  </div>
                  <Badge className="bg-green-100 text-green-600 text-xs rounded-full">Low</Badge>
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="w-full mt-4 glass-input rounded-2xl text-purple-400 hover:bg-white/20 transition-colors"
                onClick={() => onTabChange('recipes')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add new task
              </Button>
            </CardContent>
          </Card>

          {/* Learning Progress */}
          <Card className="glass-card border-0 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Learning Journey</CardTitle>
                  <CardDescription className="text-muted-foreground">You're making great progress!</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Recipe Development</span>
                    <span className="text-sm font-bold text-purple-400">{Math.min(100, stats.recipes * 20)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, stats.recipes * 20)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Community Engagement</span>
                    <span className="text-sm font-bold text-orange-400">{Math.min(100, stats.forumPosts * 10)}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, stats.forumPosts * 10)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Skill Mastery</span>
                    <span className="text-sm font-bold text-green-400">{stats.learningProgress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${stats.learningProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  size="sm" 
                  onClick={() => onTabChange('learning')}
                  className="glass-button text-white border-0 rounded-xl flex-1"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Continue Learning
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onTabChange('chat')}
                  className="glass-input border-white/20 text-foreground rounded-xl"
                >
                  <Zap className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="glass-card border-0 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20">
                  <Sparkles className="h-5 w-5 text-pink-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
                  <CardDescription className="text-muted-foreground">What would you like to do?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="ghost" 
                className="w-full justify-start glass-input rounded-2xl p-4 h-auto hover:bg-white/20 transition-colors"
                onClick={() => onTabChange('recipes')}
              >
                <ChefHat className="mr-3 h-5 w-5 text-purple-400" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Share a Recipe</div>
                  <div className="text-sm text-muted-foreground">Upload your latest creation</div>
                </div>
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start glass-input rounded-2xl p-4 h-auto hover:bg-white/20 transition-colors"
                onClick={() => onTabChange('forum')}
              >
                <MessageCircle className="mr-3 h-5 w-5 text-blue-400" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Join Discussion</div>
                  <div className="text-sm text-muted-foreground">Connect with the community</div>
                </div>
              </Button>

              <Button 
                variant="ghost" 
                className="w-full justify-start glass-input rounded-2xl p-4 h-auto hover:bg-white/20 transition-colors"
                onClick={() => onTabChange('learning')}
              >
                <BookOpen className="mr-3 h-5 w-5 text-green-400" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Learn Something</div>
                  <div className="text-sm text-muted-foreground">Expand your skills</div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card className="glass-card border-0 shadow-none">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500/20 to-blue-500/20">
                  <Calendar className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">Today's Schedule</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 glass-input rounded-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                  <span className="font-medium text-foreground">Cooking Masterclass</span>
                </div>
                <div className="text-sm text-muted-foreground mb-3">10:00 AM - 11:30 AM</div>
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-muted-foreground">Advanced Pastry Techniques</span>
                </div>
                <div className="flex -space-x-2 mt-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full border-2 border-white"></div>
                  <div className="w-6 h-6 bg-white/20 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-xs">+5</span>
                  </div>
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="w-full glass-input rounded-2xl text-purple-400 hover:bg-white/20 transition-colors"
                onClick={() => onTabChange('learning')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add to calendar
              </Button>
            </CardContent>
          </Card>

          {/* Motivation Card */}
          <Card className="glass-card border-0 shadow-none bg-aurora-gradient">
            <CardContent className="p-6 text-center">
              <Heart className="h-8 w-8 text-white mx-auto mb-4" />
              <h3 className="font-bold text-lg text-white mb-2">You're amazing!</h3>
              <p className="text-white/90 text-sm mb-4">
                Keep up the fantastic work. Your dedication to learning is inspiring!
              </p>
              <Button 
                variant="secondary"
                size="sm"
                className="bg-white/20 text-white border-0 rounded-xl hover:bg-white/30 transition-colors"
                onClick={() => onTabChange('forum')}
              >
                Share your progress
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}