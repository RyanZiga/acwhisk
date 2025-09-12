import React, { useState, useEffect, Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './components/AuthContext'
import { ThemeProvider } from './components/ThemeContext'
import { NotificationProvider } from './components/ui/notification'
import { ErrorBoundary, AsyncErrorBoundary } from './components/ErrorBoundary'
import { ServiceWorkerManager } from './components/ServiceWorkerManager'
import { AuthFixed as Auth } from './components/AuthFixed'
import { Layout } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { OfflineIndicator } from './components/OfflineIndicator'
import { Toaster } from './components/ui/sonner'
import { MotionSpinner } from './components/ui/motion'
import { supabase } from './utils/supabase/client'

// Lazy load heavy components to improve initial load time
const RecipeManager = lazy(() => import('./components/RecipeManager'))
const LearningHub = lazy(() => import('./components/LearningHub'))
const CommunityForum = lazy(() => import('./components/CommunityForum'))
const ChatAssistant = lazy(() => import('./components/ChatAssistant'))
const AdminPanel = lazy(() => import('./components/AdminPanel'))
const ProfileSettings = lazy(() => import('./components/ProfileSettings'))
const DigitalPortfolio = lazy(() => import('./components/DigitalPortfolio'))
const DatabaseSetup = lazy(() => import('./components/DatabaseSetup'))
const ProfileInitializer = lazy(() => import('./components/ProfileInitializer'))
const RealTimeNotifications = lazy(() => import('./components/RealTimeNotifications'))

function AppContent() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [databaseReady, setDatabaseReady] = useState<boolean | null>(null)

  useEffect(() => {
    checkDatabaseSetup()
  }, [user])

  const checkDatabaseSetup = async () => {
    if (!user) {
      setDatabaseReady(null)
      return
    }

    try {
      // Quick and lightweight check with reduced timeout
      const { error } = await Promise.race([
        supabase
          .from('profiles')
          .select('id')
          .limit(1)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database check timeout')), 2000)
        )
      ])

      // If profiles table doesn't exist, database needs setup
      if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
        setDatabaseReady(false)
        return
      }

      // For other errors or timeout, assume database is ready to avoid blocking
      setDatabaseReady(true)
    } catch (error) {
      console.warn('Database check failed, proceeding anyway:', error)
      // On timeout or error, assume database is ready to avoid blocking the app
      setDatabaseReady(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-glass-gradient flex items-center justify-center">
        <div className="text-center space-y-6">
          <MotionSpinner size={60} color="var(--primary)" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">ACWhisk</h1>
            <p className="text-muted-foreground">Loading your culinary platform...</p>
            <div className="w-2 h-2 bg-primary rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  // Show database setup if database is not ready
  if (databaseReady === false) {
    return (
      <div className="min-h-screen bg-glass-gradient">        
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome to ACWhisk! 🍳</h1>
              <p className="text-muted-foreground">
                Let's set up your database to get started with your culinary platform.
              </p>
              
              {/* Emergency fix banner for critical auth issues */}
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h2 className="text-lg font-semibold text-red-400 mb-2">🚨 Getting "Database error saving new user"?</h2>
                <p className="text-red-300 text-sm mb-3">
                  This critical error prevents user registration. Use the <strong>Database Authentication Checker</strong> below for an immediate fix.
                </p>
                <div className="text-xs text-red-300/80">
                  The most common cause is RLS being enabled on the auth.users table, which breaks authentication completely.
                </div>
              </div>
            </div>
            <ErrorBoundary>
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <MotionSpinner size={40} color="var(--primary)" />
                </div>
              }>
                <DatabaseSetup />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while checking database
  if (databaseReady === null) {
    return (
      <div className="min-h-screen bg-glass-gradient flex items-center justify-center">
        <div className="text-center space-y-6">
          <MotionSpinner size={60} color="var(--primary)" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">ACWhisk</h1>
            <p className="text-muted-foreground">Checking database setup...</p>
            <div className="w-2 h-2 bg-primary rounded-full mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  const LoadingFallback = () => (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <MotionSpinner size={40} color="var(--primary)" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ErrorBoundary>
            <Dashboard onTabChange={setActiveTab} />
          </ErrorBoundary>
        )
      case 'recipes':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <RecipeManager />
            </Suspense>
          </ErrorBoundary>
        )
      case 'portfolio':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <DigitalPortfolio />
            </Suspense>
          </ErrorBoundary>
        )
      case 'learning':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <LearningHub />
            </Suspense>
          </ErrorBoundary>
        )
      case 'forum':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <CommunityForum />
            </Suspense>
          </ErrorBoundary>
        )
      case 'chat':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ChatAssistant />
            </Suspense>
          </ErrorBoundary>
        )
      case 'feedback':
        return (
          <ErrorBoundary>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Student Feedback</h2>
              <p className="text-muted-foreground mb-6">
                Review and provide feedback on student submissions
              </p>
              <div className="bg-accent/50 rounded-lg p-8 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground">
                  Feedback system is coming soon! Instructors will be able to:
                </p>
                <ul className="text-sm text-muted-foreground mt-4 space-y-1 text-left">
                  <li>• Review student recipes</li>
                  <li>• Provide detailed feedback</li>
                  <li>• Rate submissions</li>
                  <li>• Track student progress</li>
                </ul>
              </div>
            </div>
          </ErrorBoundary>
        )
      case 'resources':
        return (
          <ErrorBoundary>
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Teaching Resources</h2>
              <p className="text-muted-foreground mb-6">
                Upload and manage your educational content and materials
              </p>
              <div className="bg-accent/50 rounded-lg p-8 max-w-md mx-auto">
                <p className="text-sm text-muted-foreground">
                  Resource management is coming soon! Instructors will be able to:
                </p>
                <ul className="text-sm text-muted-foreground mt-4 space-y-1 text-left">
                  <li>• Upload video tutorials</li>
                  <li>• Share lesson plans</li>
                  <li>• Create learning modules</li>
                  <li>• Organize by skill level</li>
                </ul>
              </div>
            </div>
          </ErrorBoundary>
        )
      case 'admin':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AdminPanel />
            </Suspense>
          </ErrorBoundary>
        )
      case 'database':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <DatabaseSetup />
            </Suspense>
          </ErrorBoundary>
        )
      case 'profile':
        return (
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <ProfileSettings />
            </Suspense>
          </ErrorBoundary>
        )
      default:
        return (
          <ErrorBoundary>
            <Dashboard onTabChange={setActiveTab} />
          </ErrorBoundary>
        )
    }
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <ProfileInitializer />
      </Suspense>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        <Suspense fallback={null}>
          <RealTimeNotifications onTabChange={setActiveTab} />
        </Suspense>
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <AsyncErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          <ServiceWorkerManager>
            <AuthProvider>
              <ErrorBoundary>
                <AppContent />
                <OfflineIndicator />
                <Toaster />
              </ErrorBoundary>
            </AuthProvider>
          </ServiceWorkerManager>
        </NotificationProvider>
      </ThemeProvider>
    </AsyncErrorBoundary>
  )
}