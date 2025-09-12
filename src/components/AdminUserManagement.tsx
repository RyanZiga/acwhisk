import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../utils/supabase/client'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { MotionCard } from './ui/motion'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { 
  Users, Search, Filter, MoreVertical, Edit, Trash2, Eye, 
  UserPlus, Shield, ShieldCheck, GraduationCap, Crown,
  Ban, CheckCircle, AlertCircle, Calendar, Mail, Phone, MapPin
} from 'lucide-react'
import { useNotifications } from './ui/notification'

interface UserProfile {
  id: string
  name: string
  email: string
  role: 'student' | 'instructor' | 'admin'
  avatar_url?: string
  bio?: string
  year_level?: string
  specialization?: string
  phone?: string
  location?: string
  created_at: string
  updated_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  is_banned?: boolean
}

interface UserStats {
  totalUsers: number
  students: number
  instructors: number
  admins: number
  activeToday: number
  newThisWeek: number
}

export function AdminUserManagement() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    students: 0,
    instructors: 0,
    admins: 0,
    activeToday: 0,
    newThisWeek: 0
  })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers()
    }
  }, [user])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)

      // Fetch user profiles with auth metadata
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return
      }

      // For demo purposes, we'll generate some additional metadata
      // In a real app, you'd fetch this from auth.users or additional tables
      const enrichedUsers = profiles?.map(profile => ({
        ...profile,
        email: profile.email || `user-${profile.id.slice(0, 8)}@acwhisk.com`,
        last_sign_in_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        email_confirmed_at: profile.created_at,
        is_banned: false
      })) || []

      setUsers(enrichedUsers)
      calculateStats(enrichedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to fetch users',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (userList: UserProfile[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const stats = {
      totalUsers: userList.length,
      students: userList.filter(u => u.role === 'student').length,
      instructors: userList.filter(u => u.role === 'instructor').length,
      admins: userList.filter(u => u.role === 'admin').length,
      activeToday: userList.filter(u => 
        u.last_sign_in_at && new Date(u.last_sign_in_at) >= today
      ).length,
      newThisWeek: userList.filter(u => 
        new Date(u.created_at) >= weekAgo
      ).length
    }

    setStats(stats)
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.specialization?.toLowerCase().includes(term) ||
        user.location?.toLowerCase().includes(term)
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => 
        user.last_sign_in_at && 
        new Date(user.last_sign_in_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      )
    } else if (statusFilter === 'banned') {
      filtered = filtered.filter(user => user.is_banned)
    } else if (statusFilter === 'unverified') {
      filtered = filtered.filter(user => !user.email_confirmed_at)
    }

    setFilteredUsers(filtered)
  }

  const handleRoleChange = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    if (!user || user.role !== 'admin') return

    setActionLoading(userId)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (error) {
        // If no rows were updated, the profile might not exist
        if (error.code === 'PGRST116') {
          // Try to create the profile first
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              name: 'User',
              role: newRole,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (insertError) {
            throw insertError
          }
        } else {
          throw error
        }
      }

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))

      // Try to log activity (handle missing activities table gracefully)
      try {
        await supabase.from('activities').insert({
          user_id: userId,
          type: 'user_joined',
          description: `Role updated to ${newRole} by admin`
        })
      } catch (activityError) {
        console.warn('Activities table not available:', activityError)
      }

      addNotification({
        title: 'Role Updated',
        message: `User role changed to ${newRole}`,
        type: 'success'
      })
    } catch (error) {
      console.error('Error updating role:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update user role',
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleBanUser = async (userId: string, ban: boolean) => {
    if (!user || user.role !== 'admin') return

    setActionLoading(userId)

    try {
      // In a real app, you'd handle this through Supabase Auth API
      // For now, we'll update a flag in profiles
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: ban,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_banned: ban } : u
      ))

      addNotification({
        title: ban ? 'User Banned' : 'User Unbanned',
        message: `User has been ${ban ? 'banned' : 'unbanned'} successfully`,
        type: 'success'
      })
    } catch (error) {
      console.error('Error updating ban status:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to update user status',
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!user || user.role !== 'admin') return
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

    setActionLoading(userId)

    try {
      // Delete user profile (cascading will handle related data)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(prev => prev.filter(u => u.id !== userId))

      addNotification({
        title: 'User Deleted',
        message: 'User has been permanently deleted',
        type: 'success'
      })
    } catch (error) {
      console.error('Error deleting user:', error)
      addNotification({
        title: 'Error',
        message: 'Failed to delete user',
        type: 'error'
      })
    } finally {
      setActionLoading(null)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />
      case 'instructor': return <GraduationCap className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'instructor': return 'bg-blue-100 text-blue-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const getStatusBadge = (user: UserProfile) => {
    if (user.is_banned) {
      return <Badge className="bg-red-100 text-red-800">Banned</Badge>
    }
    if (!user.email_confirmed_at) {
      return <Badge className="bg-yellow-100 text-yellow-800">Unverified</Badge>
    }
    if (user.last_sign_in_at && new Date(user.last_sign_in_at) >= new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
  }

  if (user?.role !== 'admin') {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <Shield className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="font-medium mb-2">Access Denied</h3>
          <p className="text-sm text-muted-foreground">
            You need admin privileges to access user management.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MotionCard 
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-semibold">{stats.totalUsers}</p>
            <p className="text-xs text-muted-foreground">Total Users</p>
          </div>
        </MotionCard>

        <MotionCard 
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <GraduationCap className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-semibold">{stats.students}</p>
            <p className="text-xs text-muted-foreground">Students</p>
          </div>
        </MotionCard>

        <MotionCard 
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center">
            <ShieldCheck className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-semibold">{stats.instructors}</p>
            <p className="text-xs text-muted-foreground">Instructors</p>
          </div>
        </MotionCard>

        <MotionCard 
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center">
            <Crown className="w-6 h-6 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-semibold">{stats.admins}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </div>
        </MotionCard>

        <MotionCard 
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-center">
            <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-semibold">{stats.activeToday}</p>
            <p className="text-xs text-muted-foreground">Active Today</p>
          </div>
        </MotionCard>

        <MotionCard 
          className="glass-card p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="text-center">
            <UserPlus className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-semibold">{stats.newThisWeek}</p>
            <p className="text-xs text-muted-foreground">New This Week</p>
          </div>
        </MotionCard>
      </div>

      {/* Filters */}
      <MotionCard 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input pl-10"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="glass-card border-glass-border">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="instructor">Instructors</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="glass-input">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="glass-card border-glass-border">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </MotionCard>

      {/* Users List */}
      <MotionCard 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No users found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-glass-border">
                  <tr className="text-left">
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Joined</th>
                    <th className="p-4 font-medium">Last Seen</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userProfile) => (
                    <tr key={userProfile.id} className="border-b border-glass-border hover:bg-glass-secondary/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={userProfile.avatar_url} />
                            <AvatarFallback className="bg-calm-gradient text-white">
                              {userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{userProfile.name}</p>
                            <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                            {userProfile.specialization && (
                              <p className="text-xs text-muted-foreground">{userProfile.specialization}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`${getRoleBadgeColor(userProfile.role)} flex items-center gap-1 w-fit`}>
                          {getRoleIcon(userProfile.role)}
                          {userProfile.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(userProfile)}
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{new Date(userProfile.created_at).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">
                          {userProfile.last_sign_in_at 
                            ? new Date(userProfile.last_sign_in_at).toLocaleDateString()
                            : 'Never'
                          }
                        </p>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedUser(userProfile)}
                                className="glass-input border-glass-border"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="glass-modal max-w-2xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Users className="w-5 h-5" />
                                  User Details
                                </DialogTitle>
                                <DialogDescription>
                                  View and manage user profile information
                                </DialogDescription>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-6">
                                  <div className="flex items-center gap-4">
                                    <Avatar className="w-16 h-16">
                                      <AvatarImage src={selectedUser.avatar_url} />
                                      <AvatarFallback className="bg-calm-gradient text-white text-xl">
                                        {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                                      <p className="text-muted-foreground">{selectedUser.email}</p>
                                      <div className="flex gap-2 mt-2">
                                        <Badge className={getRoleBadgeColor(selectedUser.role)}>
                                          {selectedUser.role}
                                        </Badge>
                                        {getStatusBadge(selectedUser)}
                                      </div>
                                    </div>
                                  </div>

                                  {selectedUser.bio && (
                                    <div>
                                      <h4 className="font-medium mb-2">Bio</h4>
                                      <p className="text-sm text-muted-foreground">{selectedUser.bio}</p>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4">
                                    {selectedUser.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{selectedUser.phone}</span>
                                      </div>
                                    )}
                                    {selectedUser.location && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm">{selectedUser.location}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        Joined {new Date(selectedUser.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-sm">
                                        {selectedUser.email_confirmed_at ? 'Verified' : 'Unverified'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          <Select 
                            value={userProfile.role} 
                            onValueChange={(value) => handleRoleChange(userProfile.id, value as any)}
                            disabled={actionLoading === userProfile.id || userProfile.id === user?.id}
                          >
                            <SelectTrigger className="glass-input w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass-card border-glass-border">
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="instructor">Instructor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          {userProfile.id !== user?.id && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBanUser(userProfile.id, !userProfile.is_banned)}
                                disabled={actionLoading === userProfile.id}
                                className={`glass-input text-xs ${
                                  userProfile.is_banned 
                                    ? 'border-green-200 text-green-600 hover:bg-green-50' 
                                    : 'border-red-200 text-red-600 hover:bg-red-50'
                                }`}
                              >
                                {actionLoading === userProfile.id ? (
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                ) : userProfile.is_banned ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <Ban className="w-3 h-3" />
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(userProfile.id)}
                                disabled={actionLoading === userProfile.id}
                                className="glass-input border-red-200 text-red-600 hover:bg-red-50"
                              >
                                {actionLoading === userProfile.id ? (
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </MotionCard>
    </div>
  )
}