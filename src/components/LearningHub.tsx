import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Progress } from './ui/progress'
import { Skeleton } from './ui/skeleton'
import { 
  BookOpen, 
  Play, 
  Clock, 
  Award, 
  TrendingUp,
  ChefHat,
  Utensils,
  GraduationCap,
  Star,
  CheckCircle,
  PlayCircle
} from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { projectId, publicAnonKey } from '../utils/supabase/info'

export function LearningHub() {
  const { user, session } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState({
    completedLessons: 12,
    totalLessons: 50,
    currentStreak: 7,
    totalPoints: 2450
  })

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cfac176d/resources`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const { resources } = await response.json()
        setResources(resources || [])
      }
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const skillCategories = [
    {
      id: 'basics',
      title: 'Culinary Basics',
      description: 'Master fundamental cooking techniques',
      icon: ChefHat,
      color: 'text-blue-600',
      lessons: 15,
      completed: 8,
      image: 'https://images.unsplash.com/photo-1578366941741-9e517759c620?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWxpbmFyeSUyMHN0dWRlbnRzJTIwbGVhcm5pbmd8ZW58MXx8fHwxNzU2NTMyNzU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 'knife-skills',
      title: 'Knife Skills',
      description: 'Perfect your cutting techniques',
      icon: Utensils,
      color: 'text-green-600',
      lessons: 8,
      completed: 3,
      image: 'https://images.unsplash.com/photo-1622001545761-9bd12a4b465b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwY29va2luZyUyMHJlY2lwZXN8ZW58MXx8fHwxNzU2NTMyNzU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 'baking',
      title: 'Baking & Pastry',
      description: 'Learn the art of baking',
      icon: Award,
      color: 'text-purple-600',
      lessons: 12,
      completed: 1,
      image: 'https://images.unsplash.com/photo-1671725501632-3980b640f420?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb29raW5nJTIwa2l0Y2hlbiUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NTY1MzI3NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: 'advanced',
      title: 'Advanced Techniques',
      description: 'Professional-level skills',
      icon: GraduationCap,
      color: 'text-orange-600',
      lessons: 15,
      completed: 0,
      image: 'https://images.unsplash.com/photo-1578366941741-9e517759c620?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWxpbmFyeSUyMHN0dWRlbnRzJTIwbGVhcm5pbmd8ZW58MXx8fHwxNzU2NTMyNzU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    }
  ]

  const featuredLessons = [
    {
      id: 1,
      title: 'Perfect Pasta: From Scratch to Plate',
      instructor: 'Chef Maria Rodriguez',
      duration: '45 mins',
      difficulty: 'Beginner',
      rating: 4.8,
      thumbnail: 'https://images.unsplash.com/photo-1622001545761-9bd12a4b465b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVmJTIwY29va2luZyUyMHJlY2lwZXN8ZW58MXx8fHwxNzU2NTMyNzU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      completed: false
    },
    {
      id: 2,
      title: 'Knife Skills Masterclass',
      instructor: 'Chef David Kim',
      duration: '30 mins',
      difficulty: 'Intermediate',
      rating: 4.9,
      thumbnail: 'https://images.unsplash.com/photo-1671725501632-3980b640f420?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb29raW5nJTIwa2l0Y2hlbiUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NTY1MzI3NTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      completed: true
    },
    {
      id: 3,
      title: 'Bread Baking Fundamentals',
      instructor: 'Chef Sarah Johnson',
      duration: '60 mins',
      difficulty: 'Beginner',
      rating: 4.7,
      thumbnail: 'https://images.unsplash.com/photo-1578366941741-9e517759c620?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdWxpbmFyeSUyMHN0dWRlbnRzJTIwbGVhcm5pbmd8ZW58MXx8fHwxNzU2NTMyNzU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      completed: false
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800'
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'Advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const LessonCard = ({ lesson }: { lesson: any }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="relative">
        <div className="aspect-video w-full bg-accent rounded-t-lg overflow-hidden">
          <ImageWithFallback
            src={lesson.thumbnail}
            alt={lesson.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <PlayCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>
        {lesson.completed && (
          <div className="absolute top-2 right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <h3 className="font-semibold line-clamp-2">{lesson.title}</h3>
          <p className="text-sm text-muted-foreground">by {lesson.instructor}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={getDifficultyColor(lesson.difficulty)} variant="secondary">
                {lesson.difficulty}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {lesson.duration}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">{lesson.rating}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-32 w-full rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-2/3" />
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
        <h1 className="text-2xl font-bold">Learning Hub</h1>
        <p className="text-muted-foreground">Enhance your culinary skills with expert-led courses and resources</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{progress.completedLessons}</p>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{progress.currentStreak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Award className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{progress.totalPoints}</p>
                <p className="text-sm text-muted-foreground">Learning Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <GraduationCap className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{Math.round((progress.completedLessons / progress.totalLessons) * 100)}%</p>
                <p className="text-sm text-muted-foreground">Overall Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="featured" className="space-y-6">
        <TabsList>
          <TabsTrigger value="featured">Featured Lessons</TabsTrigger>
          <TabsTrigger value="skills">Skill Categories</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Featured Lessons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Skill Categories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skillCategories.map((category) => {
                const Icon = category.icon
                const progressPercent = (category.completed / category.lessons) * 100
                
                return (
                  <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="flex">
                      <div className="w-32 h-32 flex-shrink-0">
                        <ImageWithFallback
                          src={category.image}
                          alt={category.title}
                          className="w-full h-full object-cover rounded-l-lg"
                        />
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`h-5 w-5 ${category.color}`} />
                              <h3 className="font-semibold">{category.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{category.completed} of {category.lessons} lessons</span>
                            <span>{Math.round(progressPercent)}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                        <Button size="sm" className="mt-3 w-full" variant="outline">
                          Continue Learning
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Learning Resources</h2>
            {resources.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No resources available yet</h3>
                <p className="text-muted-foreground">
                  Instructors will upload learning materials and resources here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource: any) => (
                  <Card key={resource.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                      <CardDescription className="line-clamp-3">{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{resource.type}</Badge>
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">My Learning Progress</h2>
            <div className="space-y-6">
              {skillCategories.map((category) => {
                const Icon = category.icon
                const progressPercent = (category.completed / category.lessons) * 100
                
                return (
                  <Card key={category.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Icon className={`h-6 w-6 ${category.color}`} />
                          <div>
                            <h3 className="font-semibold">{category.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {category.completed} of {category.lessons} lessons completed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{Math.round(progressPercent)}%</p>
                          <p className="text-xs text-muted-foreground">Complete</p>
                        </div>
                      </div>
                      <Progress value={progressPercent} className="h-3" />
                    </CardContent>
                  </Card>
                )
              })}
              
              <Card>
                <CardHeader>
                  <CardTitle>Learning Achievements</CardTitle>
                  <CardDescription>Your culinary learning milestones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                    <Award className="h-8 w-8 text-yellow-600" />
                    <div>
                      <h4 className="font-medium">First Recipe Shared</h4>
                      <p className="text-sm text-muted-foreground">Completed your first recipe upload</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                    <Star className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Community Contributor</h4>
                      <p className="text-sm text-muted-foreground">Made 5 helpful forum posts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg opacity-50">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-medium">Consistent Learner</h4>
                      <p className="text-sm text-muted-foreground">Complete 30 days of learning (7/30)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}