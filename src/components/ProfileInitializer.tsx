import React, { useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../utils/supabase/client'

/**
 * Component that ensures user profiles exist in the database
 * Runs once when user logs in to create missing profiles
 */
export function ProfileInitializer() {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      initializeUserProfile()
    }
  }, [user])

  const initializeUserProfile = async () => {
    if (!user) return

    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (fetchError) {
        // If table doesn't exist, skip initialization
        if (fetchError.code === 'PGRST205' || fetchError.code === '42P01') {
          console.warn('Profiles table not available, skipping profile initialization')
          return
        }
        console.error('Error checking profile:', fetchError)
        return
      }

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.name || 'User',
            role: user.role || 'student',
            bio: user.bio,
            avatar_url: user.avatar_url,
            year_level: user.year_level,
            specialization: user.specialization,
            phone: user.phone,
            location: user.location,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (insertError) {
          console.error('Error creating profile:', insertError)
        } else {
          console.log('Profile initialized for user:', user.id)
          
          // Also create a welcome activity if activities table exists
          try {
            await supabase.from('activities').insert({
              user_id: user.id,
              type: 'user_joined',
              description: 'Welcome to ACWhisk! Start your culinary journey.'
            })
          } catch (activityError) {
            console.warn('Activities table not available, skipping welcome activity')
          }
        }
      }
    } catch (error) {
      console.error('Error initializing user profile:', error)
    }
  }

  // This component doesn't render anything
  return null
}