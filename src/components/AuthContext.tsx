import React, { createContext, useContext, useState, useEffect } from 'react'
import { getSupabaseClient } from '../utils/supabase/client'
import { projectId, publicAnonKey } from '../utils/supabase/info'

export interface User {
  id: string
  email: string
  name: string
  role: 'student' | 'instructor' | 'admin'
  profile_complete: boolean
  created_at: string
  avatar_url?: string
  bio?: string
  year_level?: string
  specialization?: string
  phone?: string
  location?: string
}

interface AuthContextType {
  user: User | null
  session: any | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  loading: boolean
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = getSupabaseClient()

  useEffect(() => {
    // Check for existing session
    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchUserProfile(session.access_token)
      } else {
        setUser(null)
        setSession(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session && !error) {
        setSession(session)
        await fetchUserProfile(session.access_token)
      }
    } catch (error) {
      console.error('Session check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async (accessToken?: string) => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        console.error('Auth error:', authError)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()

      if (profileError) {
        // Handle table not existing - create a basic user profile from auth data
        if (profileError.code === 'PGRST205' || profileError.code === '42P01') {
          console.warn('Profiles table does not exist. Using basic auth data.')
          const userData: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: 'student',
            profile_complete: false,
            created_at: authUser.created_at || new Date().toISOString(),
            avatar_url: authUser.user_metadata?.avatar_url,
            bio: undefined,
            year_level: undefined,
            specialization: undefined,
            phone: undefined,
            location: undefined
          }
          setUser(userData)
          return
        }
        
        console.error('Profile fetch error:', profileError)
        return
      }

      // If no profile exists, create one
      if (!profile) {
        console.log('No profile found for user, creating one...')
        try {
          // First try to upsert to avoid conflicts
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert({
              id: authUser.id,
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              role: authUser.user_metadata?.role || 'student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { 
              onConflict: 'id',
              ignoreDuplicates: false 
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            // Fallback to basic user data
            const userData: User = {
              id: authUser.id,
              email: authUser.email || '',
              name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
              role: 'student',
              profile_complete: false,
              created_at: authUser.created_at || new Date().toISOString(),
              avatar_url: authUser.user_metadata?.avatar_url,
              bio: undefined,
              year_level: undefined,
              specialization: undefined,
              phone: undefined,
              location: undefined
            }
            setUser(userData)
            return
          }

          // Use the newly created profile
          if (newProfile) {
            const userData: User = {
              id: newProfile.id,
              email: authUser.email || '',
              name: newProfile.name || 'User',
              role: newProfile.role || 'student',
              profile_complete: !!(newProfile.name && newProfile.bio),
              created_at: newProfile.created_at,
              avatar_url: newProfile.avatar_url,
              bio: newProfile.bio,
              year_level: newProfile.year_level,
              specialization: newProfile.specialization,
              phone: newProfile.phone,
              location: newProfile.location
            }
            setUser(userData)
          }
        } catch (createProfileError) {
          console.error('Failed to create profile:', createProfileError)
          // Fallback to basic user data
          const userData: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: 'student',
            profile_complete: false,
            created_at: authUser.created_at || new Date().toISOString(),
            avatar_url: authUser.user_metadata?.avatar_url,
            bio: undefined,
            year_level: undefined,
            specialization: undefined,
            phone: undefined,
            location: undefined
          }
          setUser(userData)
        }
        return
      }

      if (profile) {
        const userData: User = {
          id: profile.id,
          email: authUser.email || '',
          name: profile.name || 'User',
          role: profile.role || 'student',
          profile_complete: !!(profile.name && profile.bio),
          created_at: profile.created_at,
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          year_level: profile.year_level,
          specialization: profile.specialization,
          phone: profile.phone,
          location: profile.location
        }
        setUser(userData)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Fallback to basic auth data if profile fetch fails completely
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const userData: User = {
            id: authUser.id,
            email: authUser.email || '',
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: 'student',
            profile_complete: false,
            created_at: authUser.created_at || new Date().toISOString(),
            avatar_url: authUser.user_metadata?.avatar_url,
            bio: undefined,
            year_level: undefined,
            specialization: undefined,
            phone: undefined,
            location: undefined
          }
          setUser(userData)
        }
      } catch (fallbackError) {
        console.error('Fallback profile creation failed:', fallbackError)
      }
    }
  }

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.session) {
        setSession(data.session)
        await fetchUserProfile(data.session.access_token)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred during sign in' }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string, role: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true)
      
      // Debug logging
      console.log('Starting sign up process for:', { email, name, role })
      
      // Use the server-side signup route which auto-confirms emails
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-cfac176d/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          email,
          password,
          name,
          role
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Server signup error:', result)
        return { success: false, error: result.error || 'Signup failed' }
      }

      console.log('Server signup successful:', result)

      // After successful server signup, sign in the user to get a session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        console.error('Auto sign-in error after signup:', signInError)
        return { 
          success: true, 
          error: 'Account created successfully! Please sign in to continue.' 
        }
      }

      if (signInData.session) {
        setSession(signInData.session)
        await fetchUserProfile(signInData.session.access_token)
      }

      return { success: true }
    } catch (error) {
      console.error('Unexpected signup error:', error)
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message.includes('Database error')) {
          return { 
            success: false, 
            error: 'Database configuration issue. Please run the Auth Diagnostics tool for detailed troubleshooting.' 
          }
        }
        
        if (error.message.includes('fetch')) {
          return {
            success: false,
            error: 'Network error. Please check your connection and try again.'
          }
        }
      }
      
      return { success: false, error: 'An unexpected error occurred during signup. Please try again.' }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const updateProfile = async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      // Try to update existing profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: updates.name,
          bio: updates.bio,
          avatar_url: updates.avatar_url,
          year_level: updates.year_level,
          specialization: updates.specialization,
          phone: updates.phone,
          location: updates.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        // If profile doesn't exist or no rows were updated, try to create it
        if (error.code === 'PGRST116' || error.code === 'PGRST205') {
          const { data: insertData, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              name: updates.name || user.name,
              bio: updates.bio,
              avatar_url: updates.avatar_url,
              year_level: updates.year_level,
              specialization: updates.specialization,
              phone: updates.phone,
              location: updates.location,
              role: user.role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (insertError) {
            // If table doesn't exist, just update local state
            if (insertError.code === 'PGRST205' || insertError.code === '42P01') {
              setUser(prev => prev ? { ...prev, ...updates } : null)
              return { success: true }
            }
            return { success: false, error: insertError.message }
          }
        } else {
          return { success: false, error: error.message }
        }
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates } : null)
      return { success: true }
    } catch (error) {
      // Fallback to local state update only
      setUser(prev => prev ? { ...prev, ...updates } : null)
      return { success: true }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}