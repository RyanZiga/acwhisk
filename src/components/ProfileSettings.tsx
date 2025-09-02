import React, { useState } from 'react'
import { useAuth } from './AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  User, 
  Mail, 
  Calendar, 
  Shield,
  Camera,
  Save,
  CheckCircle
} from 'lucide-react'

export function ProfileSettings() {
  const { user, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: '',
    specialties: '',
    experience_level: 'Beginner',
    favorite_cuisine: '',
    cooking_goals: ''
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await updateProfile({
        ...formData,
        profile_complete: true
      })

      if (result.success) {
        setSuccess('Profile updated successfully!')
        setEditing(false)
      } else {
        setError(result.error || 'Failed to update profile')
      }
    } catch (error) {
      setError('An unexpected error occurred')
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

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      {(error || success) && (
        <Alert className={success ? 'border-green-200 bg-green-50' : ''}>
          <AlertDescription className={success ? 'text-green-800' : ''}>
            {error || success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="" alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                  disabled
                >
                  <Camera className="h-3 w-3" />
                </Button>
              </div>
              
              <h3 className="text-lg font-semibold mb-1">{user.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
              
              <Badge className={getRoleColor(user.role)} variant="secondary">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Badge>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span>{new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Profile status</span>
                  <div className="flex items-center gap-1">
                    {user.profile_complete ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Complete</span>
                      </>
                    ) : (
                      <>
                        <div className="h-3 w-3 rounded-full bg-yellow-400" />
                        <span className="text-yellow-600">Incomplete</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recipes Shared</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Forum Posts</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Learning Progress</span>
                <span className="font-medium">0%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information and culinary preferences</CardDescription>
                </div>
                {!editing && (
                  <Button onClick={() => setEditing(true)} variant="outline">
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experience_level">Experience Level</Label>
                      <select
                        id="experience_level"
                        value={formData.experience_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                        <option value="Professional">Professional</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself and your culinary journey..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="favorite_cuisine">Favorite Cuisine</Label>
                      <Input
                        id="favorite_cuisine"
                        value={formData.favorite_cuisine}
                        onChange={(e) => setFormData(prev => ({ ...prev, favorite_cuisine: e.target.value }))}
                        placeholder="Italian, Asian, Mediterranean..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialties">Specialties</Label>
                      <Input
                        id="specialties"
                        value={formData.specialties}
                        onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                        placeholder="Baking, Grilling, Vegetarian..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cooking_goals">Cooking Goals</Label>
                    <Textarea
                      id="cooking_goals"
                      value={formData.cooking_goals}
                      onChange={(e) => setFormData(prev => ({ ...prev, cooking_goals: e.target.value }))}
                      placeholder="What do you hope to achieve in your culinary journey?"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={loading}>
                      {loading ? (
                        <>Saving...</>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Personal Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span>{user.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Email:</span>
                            <span>{user.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Role:</span>
                            <span>{user.role}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-1 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Account Status
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profile:</span>
                            <span className={user.profile_complete ? 'text-green-600' : 'text-yellow-600'}>
                              {user.profile_complete ? 'Complete' : 'Incomplete'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Member since:</span>
                            <span>{new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-1">Culinary Profile</h4>
                        <div className="text-sm text-muted-foreground">
                          {!user.profile_complete ? (
                            <p>Complete your profile to showcase your culinary interests and goals.</p>
                          ) : (
                            <p>Your culinary profile helps connect you with like-minded food enthusiasts.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!user.profile_complete && (
                    <Alert>
                      <AlertDescription>
                        Complete your profile to get the most out of ACWhisk! Add your bio, specialties, and cooking goals.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}