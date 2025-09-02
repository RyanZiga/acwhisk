import React, { useState } from 'react'
import { useAuth } from './AuthContext'
import { useTheme } from './ThemeContext'
import { useRealtime } from './hooks/useRealtime'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu'
import { Badge } from './ui/badge'
import { MotionCard, MotionButton } from './ui/motion'
import { ProfileEditModal } from './ProfileEditModal'
import { 
  ChefHat, 
  BookOpen, 
  MessageCircle, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Home,
  FileText,
  Star,
  Upload,
  HelpCircle,
  Search,
  Bell,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  Edit,
  User
} from 'lucide-react'
import { ACWhiskLogo } from './ACWhiskLogo'

interface LayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme, isDark } = useTheme()
  const { connectionStatus, activities } = useRealtime()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileEditOpen, setProfileEditOpen] = useState(false)

  if (!user) return null

  const unreadActivities = activities.filter(activity => 
    new Date(activity.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last hour
  ).length

  const getNavItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'recipes', label: 'Recipes', icon: ChefHat },
      { id: 'portfolio', label: 'Portfolio', icon: FileText },
      { id: 'learning', label: 'Learning Hub', icon: BookOpen },
      { id: 'forum', label: 'Community Forum', icon: MessageCircle },
      { id: 'chat', label: 'Chat Assistant', icon: HelpCircle }
    ]

    if (user.role === 'instructor') {
      baseItems.push(
        { id: 'feedback', label: 'Student Feedback', icon: Star },
        { id: 'resources', label: 'Teaching Resources', icon: Upload }
      )
    }

    if (user.role === 'admin') {
      baseItems.push(
        { id: 'admin', label: 'Admin Panel', icon: Users },
        { id: 'feedback', label: 'Student Feedback', icon: Star },
        { id: 'resources', label: 'Teaching Resources', icon: Upload }
      )
    }

    return baseItems
  }

  const navItems = getNavItems()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-glass-gradient relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-aurora-gradient rounded-full opacity-20 blur-3xl floating"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-calm-gradient rounded-full opacity-15 blur-3xl floating" style={{ animationDelay: '-3s' }}></div>
      </div>

      {/* Header */}
      <header className="glass-card fixed top-4 left-4 right-4 z-50 h-16 border-0 shadow-none">
        <div className="flex h-full items-center px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 h-8 w-8 rounded-full glass-input"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <ACWhiskLogo size={32} className="transition-all duration-300 hover:scale-110" />
            <h1 className="text-xl font-bold text-foreground">ACWhisk</h1>
          </div>

          <div className="flex-1 max-w-md mx-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search recipes, posts, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 glass-input rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2">
              {connectionStatus === 'connected' ? (
                <div className="flex items-center gap-1">
                  <Wifi className="h-4 w-4 text-green-400 pulse-online" />
                  <span className="text-xs text-muted-foreground hidden sm:inline">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground hidden sm:inline">Offline</span>
                </div>
              )}
            </div>

            {/* Theme Toggle */}
            <Button 
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full glass-input p-0 transition-all duration-200 hover:bg-white/20"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-yellow-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-600" />
              )}
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-full glass-input p-0 relative transition-all duration-200 hover:bg-white/20"
                >
                  <Bell className="h-4 w-4" />
                  {unreadActivities > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs text-white">
                      {unreadActivities}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 glass-card border-glass-border" align="end">
                <DropdownMenuLabel>
                  <div className="flex items-center justify-between">
                    <span>Recent Activity</span>
                    <Badge variant="secondary" className="text-xs">
                      {unreadActivities} new
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <div className="max-h-96 overflow-y-auto">
                  {activities.slice(0, 5).map((activity, index) => (
                    <DropdownMenuItem key={activity.id} className="hover:bg-white/10 p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 transition-all duration-200 hover:ring-4 hover:ring-white/20">
                  <Avatar className="h-10 w-10 ring-2 ring-white/20">
                    <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                    <AvatarFallback className="bg-calm-gradient text-white font-medium">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 glass-card border-glass-border" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 ring-2 ring-white/20">
                      <AvatarImage src={user.avatar_url || ""} alt={user.name} />
                      <AvatarFallback className="bg-calm-gradient text-white">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      {user.year_level && user.specialization && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.year_level} • {user.specialization}
                        </p>
                      )}
                      {user.bio && (
                        <p className="text-xs leading-none text-muted-foreground mt-1 line-clamp-2">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={() => setProfileEditOpen(true)} className="hover:bg-white/10 cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTabChange('profile')} className="hover:bg-white/10 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleSignOut} className="hover:bg-white/10 cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Badge className="bg-aurora-gradient text-white border-0 px-3 py-1 rounded-full">
              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </Badge>
          </div>
        </div>
      </header>

      <div className="flex pt-24">
        {/* Minimal Circular Sidebar */}
        <aside className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-all duration-300 ease-in-out
          fixed lg:static inset-y-0 left-0 z-40
          w-20 pt-0 glass-sidebar
          flex flex-col items-center py-6 gap-4
        `}>
          <div className="flex flex-col gap-3 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <div key={item.id} className="group relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`
                      h-12 w-12 rounded-full p-0 transition-all duration-200 border-0
                      ${isActive 
                        ? 'glass-button text-white glow-purple hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600' 
                        : 'glass-input hover:bg-white/20 text-foreground'
                      }
                    `}
                    onClick={() => {
                      onTabChange(item.id)
                      setSidebarOpen(false)
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                  
                  {/* Tooltip */}
                  <div className="absolute left-16 top-1/2 transform -translate-y-1/2 px-3 py-2 glass-card text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    {item.label}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-px bg-white/20"></div>
            <div className="text-xs text-muted-foreground text-center">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-6rem)] p-6 lg:pl-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal 
        isOpen={profileEditOpen} 
        onClose={() => setProfileEditOpen(false)} 
      />
    </div>
  )
}