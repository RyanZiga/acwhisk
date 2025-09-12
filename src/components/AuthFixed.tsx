import React, { useState } from 'react'
import { useAuth } from './AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { EnhancedAuthErrorAlert } from './EnhancedAuthErrorAlert'
import { ChefHat, Users, GraduationCap, Star, BookOpen, Sparkles, Zap, Heart } from 'lucide-react'
import { ImageWithFallback } from './figma/ImageWithFallback'
import logoImage from 'figma:asset/868eb8cd441d8d76debd4a1fae08c51899b81cd8.png'

export function AuthFixed() {
  const { signIn, signUp, loading } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'student'
  })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!signInData.email || !signInData.password) {
      setError('Please fill in all fields')
      return
    }

    const result = await signIn(signInData.email, signInData.password)
    if (!result.success) {
      setError(result.error || 'Sign in failed')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!signUpData.email || !signUpData.password || !signUpData.name || !signUpData.confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (signUpData.name.length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (signUpData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // Basic email format check (no strict validation for testing)
    if (!signUpData.email.includes('@')) {
      setError('Please enter a basic email format (e.g., test@example.com)')
      return
    }

    try {
      const result = await signUp(signUpData.email, signUpData.password, signUpData.name, signUpData.role)
      if (result.success) {
        if (result.error) {
          // This means email confirmation is required
          setSuccess(result.error)
        } else {
          setSuccess('🎉 Welcome to ACWhisk! Your account has been created successfully. You can now switch to the Sign In tab to access your account!')
          // Clear the form
          setSignUpData({
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
            role: 'student'
          })
          
          // Auto-switch to sign in tab after 3 seconds
          setTimeout(() => {
            const signInTab = document.querySelector('[value="signin"]') as HTMLElement
            if (signInTab) {
              signInTab.click()
            }
          }, 3000)
        }
      } else {
        setError(result.error || 'Sign up failed')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Sign up error:', error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="w-4 h-4" />
      case 'instructor':
        return <ChefHat className="w-4 h-4" />
      case 'admin':
        return <Users className="w-4 h-4" />
      default:
        return <GraduationCap className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-glass-gradient relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-aurora-gradient rounded-full opacity-20 blur-3xl floating"></div>
        <div className="absolute top-1/2 -left-40 w-60 h-60 bg-calm-gradient rounded-full opacity-15 blur-3xl floating" style={{ animationDelay: '-2s' }}></div>
        <div className="absolute -bottom-40 right-1/3 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl floating" style={{ animationDelay: '-4s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src={logoImage} 
              alt="ACWhisk Logo" 
              className="w-16 h-16 object-contain" 
              style={{ filter: 'drop-shadow(0 0 8px rgba(161, 140, 255, 0.3))' }}
            />
            <div className="text-left">
              <h1 className="text-4xl font-bold text-foreground">ACWhisk</h1>
              <p className="text-muted-foreground">Where culinary dreams come alive</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Section */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="space-y-6">
              <h2 className="text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Your Culinary<br />
                Journey Starts<br />
                <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                  Here
                </span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Connect with chefs, share recipes, and master culinary arts in our vibrant community of food enthusiasts.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="glass-card border-0 shadow-none p-6 text-center floating">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                    <ChefHat className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">50K+</div>
                    <div className="text-sm text-muted-foreground">Recipes Shared</div>
                  </div>
                </div>
              </Card>

              <Card className="glass-card border-0 shadow-none p-6 text-center floating" style={{ animationDelay: '-1s' }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">25K+</div>
                    <div className="text-sm text-muted-foreground">Active Cooks</div>
                  </div>
                </div>
              </Card>

              <Card className="glass-card border-0 shadow-none p-6 text-center floating" style={{ animationDelay: '-2s' }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                    <BookOpen className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">1000+</div>
                    <div className="text-sm text-muted-foreground">Learning Resources</div>
                  </div>
                </div>
              </Card>

              <Card className="glass-card border-0 shadow-none p-6 text-center floating" style={{ animationDelay: '-3s' }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20">
                    <Star className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-bold text-foreground">500+</div>
                    <div className="text-sm text-muted-foreground">Expert Instructors</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Testimonial */}
            <Card className="glass-card border-0 shadow-none p-6 bg-aurora-gradient">
              <CardContent className="p-0 text-center">
                <Heart className="h-8 w-8 text-white mx-auto mb-4" />
                <blockquote className="text-white text-lg mb-4">
                  "ACWhisk transformed my cooking journey. The community is amazing!"
                </blockquote>
                <div className="text-white/80 text-sm">
                  — Sarah, Professional Chef
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Auth Card */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md glass-card border-0 shadow-none">
              <CardHeader className="space-y-2 text-center pb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                  <CardTitle className="text-2xl font-bold text-foreground">Welcome Back!</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">
                  Ready to continue your culinary adventure?
                  <br />
                  <span className="text-xs text-purple-400 mt-1 block">
                    ✨ Testing Mode: Use any email format - no verification required!
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <Tabs defaultValue="signin" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 glass-input border-0 p-1 rounded-2xl">
                    <TabsTrigger 
                      value="signin" 
                      className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-foreground"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      className="rounded-xl data-[state=active]:bg-white/20 data-[state=active]:text-foreground"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <EnhancedAuthErrorAlert error={error} success={success} />

                  <TabsContent value="signin" className="space-y-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-sm font-medium text-foreground">Email</Label>
                        <Input
                          id="signin-email"
                          type="text"
                          placeholder="Enter your email"
                          value={signInData.email}
                          onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                          className="glass-input border-white/20 rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-purple-400 focus:ring-purple-400/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-sm font-medium text-foreground">Password</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Enter your password"
                          value={signInData.password}
                          onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                          className="glass-input border-white/20 rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-purple-400 focus:ring-purple-400/20"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full glass-button text-white border-0 rounded-2xl py-3 hover:glow-purple transition-all duration-300" 
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Signing In...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Sign In
                          </div>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-medium text-foreground">Full Name</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={signUpData.name}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                          className="glass-input border-white/20 rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-purple-400 focus:ring-purple-400/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium text-foreground">Email</Label>
                        <Input
                          id="signup-email"
                          type="text"
                          placeholder="Enter any email (e.g., test@example.com)"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                          className="glass-input border-white/20 rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-purple-400 focus:ring-purple-400/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-role" className="text-sm font-medium text-foreground">Role</Label>
                        <Select
                          value={signUpData.role}
                          onValueChange={(value) => setSignUpData(prev => ({ ...prev, role: value }))}
                        >
                          <SelectTrigger className="glass-input border-white/20 rounded-2xl text-foreground focus:border-purple-400 focus:ring-purple-400/20">
                            <div className="flex items-center gap-2">
                              {getRoleIcon(signUpData.role)}
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent className="glass-card border-glass-border">
                            <SelectItem value="student" className="hover:bg-white/10">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                Student
                              </div>
                            </SelectItem>
                            <SelectItem value="instructor" className="hover:bg-white/10">
                              <div className="flex items-center gap-2">
                                <ChefHat className="w-4 h-4" />
                                Instructor
                              </div>
                            </SelectItem>
                            <SelectItem value="admin" className="hover:bg-white/10">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium text-foreground">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Create a password"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                          className="glass-input border-white/20 rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-purple-400 focus:ring-purple-400/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="text-sm font-medium text-foreground">Confirm Password</Label>
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="glass-input border-white/20 rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-purple-400 focus:ring-purple-400/20"
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full glass-button text-white border-0 rounded-2xl py-3 hover:glow-purple transition-all duration-300" 
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Creating Account...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            Join ACWhisk
                          </div>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            Join thousands of culinary enthusiasts who trust ACWhisk with their journey
          </p>
        </div>
      </div>
    </div>
  )
}