import React, { useState } from 'react'
import { useAuth, type User } from './AuthContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { MotionCard } from './ui/motion'
import { AvatarUpload } from './AvatarUpload'
import { Save, X, User, GraduationCap } from 'lucide-react'
import { useNotifications } from './ui/notification'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ProfileData {
  name: string
  email: string
  bio: string
  avatar_url: string
  year_level: string
  specialization: string
  phone?: string
  location?: string
}

const YEAR_LEVELS = [
  { value: '1st_year', label: '1st Year' },
  { value: '2nd_year', label: '2nd Year' },
  { value: '3rd_year', label: '3rd Year' },
  { value: '4th_year', label: '4th Year' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'other', label: 'Other' }
]

const SPECIALIZATIONS = [
  { value: 'culinary_arts', label: 'Culinary Arts' },
  { value: 'pastry_baking', label: 'Pastry & Baking' },
  { value: 'food_service', label: 'Food Service Management' },
  { value: 'nutrition', label: 'Nutrition & Dietetics' },
  { value: 'hospitality', label: 'Hospitality Management' },
  { value: 'food_science', label: 'Food Science & Technology' },
  { value: 'beverage', label: 'Beverage Management' },
  { value: 'catering', label: 'Catering Services' },
  { value: 'other', label: 'Other' }
]

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { user, updateProfile } = useAuth()
  const { addNotification } = useNotifications()
  
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    year_level: user?.year_level || '',
    specialization: user?.specialization || '',
    phone: user?.phone || '',
    location: user?.location || ''
  })

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarChange = (avatarUrl: string) => {
    setProfileData(prev => ({ ...prev, avatar_url: avatarUrl }))
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)

    try {
      // Update local auth context (in production, this would sync with Supabase)
      await updateProfile(profileData)

      addNotification({
        title: 'Profile Updated! ✅',
        message: 'Your profile has been successfully updated. Connect to Supabase for permanent storage.',
        type: 'success'
      })

      onClose()

    } catch (error) {
      console.error('Profile update error:', error)
      addNotification({
        title: 'Update Failed',
        message: 'Failed to update profile. Please try again.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-glass-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <User className="w-5 h-5" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your profile information, avatar, and academic details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Section */}
          <MotionCard 
            className="glass-card p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AvatarUpload
              currentAvatar={profileData.avatar_url}
              onAvatarChange={handleAvatarChange}
              userInitials={profileData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              size="xl"
            />
          </MotionCard>

          {/* Basic Information */}
          <MotionCard 
            className="glass-card p-6 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="flex items-center gap-2 font-medium">
              <User className="w-4 h-4" />
              Basic Information
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="glass-input"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="glass-input"
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="glass-input"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profileData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="glass-input"
                  placeholder="City, Country"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="glass-input min-h-20"
                placeholder="Tell us about yourself, your culinary interests, and goals..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {profileData.bio.length}/500 characters
              </p>
            </div>
          </MotionCard>

          {/* Academic Information */}
          <MotionCard 
            className="glass-card p-6 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="flex items-center gap-2 font-medium">
              <GraduationCap className="w-4 h-4" />
              Academic Information
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year_level">Year Level</Label>
                <Select 
                  value={profileData.year_level} 
                  onValueChange={(value) => handleInputChange('year_level', value)}
                >
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select your year level" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border">
                    {YEAR_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="specialization">Specialization</Label>
                <Select 
                  value={profileData.specialization} 
                  onValueChange={(value) => handleInputChange('specialization', value)}
                >
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="Select your specialization" />
                  </SelectTrigger>
                  <SelectContent className="glass-card border-glass-border">
                    {SPECIALIZATIONS.map((spec) => (
                      <SelectItem key={spec.value} value={spec.value}>
                        {spec.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </MotionCard>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t border-glass-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="glass-input border-glass-border"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="glass-button"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}