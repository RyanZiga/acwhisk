import React, { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { MotionCard } from './ui/motion'
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  RefreshCw,
  Play,
  FileText,
  Zap
} from 'lucide-react'
import { useNotifications } from './ui/notification'

interface TableStatus {
  name: string
  exists: boolean
  required: boolean
  description: string
}

export function DatabaseSetup() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [checking, setChecking] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [tables, setTables] = useState<TableStatus[]>([
    { name: 'profiles', exists: false, required: true, description: 'User profiles and account information' },
    { name: 'recipes', exists: false, required: true, description: 'Recipe posts and content' },
    { name: 'recipe_ratings', exists: false, required: true, description: 'Recipe ratings and reviews' },
    { name: 'recipe_likes', exists: false, required: true, description: 'Recipe likes and favorites' },
    { name: 'forum_posts', exists: false, required: true, description: 'Community forum posts' },
    { name: 'forum_replies', exists: false, required: true, description: 'Forum post replies' },
    { name: 'forum_categories', exists: false, required: true, description: 'Forum category organization' },
    { name: 'activities', exists: false, required: true, description: 'User activity tracking' },
    { name: 'portfolios', exists: false, required: false, description: 'Student portfolios (optional)' },
    { name: 'learning_resources', exists: false, required: false, description: 'Learning content (optional)' }
  ])

  useEffect(() => {
    checkDatabaseTables()
  }, [])

  const checkDatabaseTables = async () => {
    setChecking(true)
    
    try {
      const updatedTables = await Promise.all(
        tables.map(async (table) => {
          try {
            const { error } = await supabase
              .from(table.name)
              .select('*', { count: 'exact', head: true })
              .limit(1)
            
            return {
              ...table,
              exists: !error || (error.code !== 'PGRST205' && error.code !== '42P01')
            }
          } catch {
            return { ...table, exists: false }
          }
        })
      )

      setTables(updatedTables)
      
      const requiredTables = updatedTables.filter(t => t.required)
      const existingRequired = requiredTables.filter(t => t.exists)
      setSetupComplete(existingRequired.length === requiredTables.length)
      
    } catch (error) {
      console.error('Error checking database tables:', error)
    } finally {
      setChecking(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      addNotification({
        title: 'Copied to clipboard! 📋',
        message: 'Schema SQL has been copied to your clipboard.',
        type: 'success'
      })
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      addNotification({
        title: 'Copy failed',
        message: 'Please manually copy the SQL from the schema file.',
        type: 'error'
      })
    }
  }

  const schemaInstructions = `
-- ACWhisk Platform Database Schema
-- Copy and paste this entire content into your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE activity_type AS ENUM ('recipe_created', 'recipe_liked', 'recipe_rated', 'post_created', 'comment_added', 'user_joined', 'achievement_earned');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard', 'expert');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'student',
  year_level TEXT,
  specialization TEXT,
  phone TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,
  instructions JSONB NOT NULL,
  prep_time INTEGER,
  cook_time INTEGER,
  difficulty difficulty_level DEFAULT 'medium',
  servings INTEGER DEFAULT 1,
  image_url TEXT,
  image_urls TEXT[],
  tags TEXT[],
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe ratings table
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- Create recipe likes table
CREATE TABLE IF NOT EXISTS recipe_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- Create forum categories table
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#A18CFF',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum posts table
CREATE TABLE IF NOT EXISTS forum_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES forum_categories(id) ON DELETE SET NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forum replies table
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES forum_replies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  images TEXT[],
  skills TEXT[],
  achievements TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create learning resources table
CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  resource_type TEXT,
  difficulty difficulty_level DEFAULT 'medium',
  duration INTEGER,
  image_url TEXT,
  video_url TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default forum categories
INSERT INTO forum_categories (name, description, color) VALUES
  ('General Discussion', 'General cooking and culinary discussions', '#A18CFF'),
  ('Techniques', 'Cooking techniques and methods', '#4FACFE'),
  ('Equipment', 'Kitchen tools and equipment discussions', '#667EEA'),
  ('Ingredients', 'Ingredient selection and preparation', '#764BA2'),
  ('Recipes', 'Recipe sharing and modifications', '#EACCF8'),
  ('Career', 'Culinary career advice and opportunities', '#A855F7')
ON CONFLICT (name) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipe_ratings_updated_at BEFORE UPDATE ON recipe_ratings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON forum_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forum_replies_updated_at BEFORE UPDATE ON forum_replies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_resources_updated_at BEFORE UPDATE ON learning_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_resources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Recipes policies
CREATE POLICY "Anyone can view public recipes" ON recipes FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "Users can create recipes" ON recipes FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own recipes" ON recipes FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own recipes" ON recipes FOR DELETE USING (auth.uid() = author_id);

-- Recipe ratings policies
CREATE POLICY "Anyone can view ratings" ON recipe_ratings FOR SELECT USING (true);
CREATE POLICY "Users can create ratings" ON recipe_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON recipe_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON recipe_ratings FOR DELETE USING (auth.uid() = user_id);

-- Recipe likes policies
CREATE POLICY "Anyone can view likes" ON recipe_likes FOR SELECT USING (true);
CREATE POLICY "Users can create likes" ON recipe_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON recipe_likes FOR DELETE USING (auth.uid() = user_id);

-- Forum posts policies
CREATE POLICY "Anyone can view forum posts" ON forum_posts FOR SELECT USING (true);
CREATE POLICY "Users can create forum posts" ON forum_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own forum posts" ON forum_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Admins can update any forum post" ON forum_posts FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Forum replies policies
CREATE POLICY "Anyone can view forum replies" ON forum_replies FOR SELECT USING (true);
CREATE POLICY "Users can create forum replies" ON forum_replies FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update own forum replies" ON forum_replies FOR UPDATE USING (auth.uid() = author_id);

-- Activities policies
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Portfolios policies
CREATE POLICY "Anyone can view public portfolios" ON portfolios FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own portfolios" ON portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create portfolios" ON portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own portfolios" ON portfolios FOR UPDATE USING (auth.uid() = user_id);

-- Learning resources policies
CREATE POLICY "Anyone can view published resources" ON learning_resources FOR SELECT USING (is_published = true);
CREATE POLICY "Instructors can view all resources" ON learning_resources FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('instructor', 'admin'))
);
CREATE POLICY "Instructors can create resources" ON learning_resources FOR INSERT WITH CHECK (
  auth.uid() = author_id AND 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('instructor', 'admin'))
);
CREATE POLICY "Authors can update own resources" ON learning_resources FOR UPDATE USING (auth.uid() = author_id);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'New User'), 'student');
  
  INSERT INTO activities (user_id, type, description)
  VALUES (NEW.id, 'user_joined', 'Welcome to ACWhisk! Start your culinary journey.');
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
`

  if (setupComplete) {
    return (
      <MotionCard 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Database Setup Complete!
          </CardTitle>
          <CardDescription>
            Your ACWhisk database is properly configured and ready to use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                <Zap className="w-3 h-3 mr-1" />
                All systems operational
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkDatabaseTables}
              disabled={checking}
              className="glass-input border-glass-border"
            >
              {checking ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </MotionCard>
    )
  }

  return (
    <div className="space-y-6">
      <MotionCard 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-500" />
            Database Setup Required
          </CardTitle>
          <CardDescription>
            To use ACWhisk, you need to set up the database schema in your Supabase project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some database tables are missing. Follow the steps below to complete the setup.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-medium">Setup Steps:</h4>
            <ol className="space-y-2 text-sm list-decimal list-inside">
              <li>Open your Supabase project dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Copy the schema SQL below and paste it into the editor</li>
              <li>Click "Run" to execute the schema</li>
              <li>Refresh this page to verify the setup</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => copyToClipboard(schemaInstructions)}
              className="glass-button"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Schema SQL
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard/project/_/sql', '_blank')}
              className="glass-input border-glass-border"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open SQL Editor
            </Button>
            
            <Button
              variant="outline"
              onClick={checkDatabaseTables}
              disabled={checking}
              className="glass-input border-glass-border"
            >
              {checking ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Check Status
            </Button>
          </div>
        </CardContent>
      </MotionCard>

      {/* Table Status */}
      <MotionCard 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Database Tables Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tables.map((table) => (
              <div key={table.name} className="flex items-center justify-between p-3 glass-input rounded-lg">
                <div className="flex items-center gap-3">
                  {table.exists ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{table.name}</p>
                    <p className="text-sm text-muted-foreground">{table.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {table.required && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                  <Badge className={table.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {table.exists ? 'Exists' : 'Missing'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </MotionCard>

      {/* Schema Preview */}
      <MotionCard 
        className="glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Schema SQL Preview
          </CardTitle>
          <CardDescription>
            Copy this SQL and run it in your Supabase SQL Editor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <pre className="bg-black/10 rounded-lg p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto">
              <code>{schemaInstructions}</code>
            </pre>
            <Button
              size="sm"
              onClick={() => copyToClipboard(schemaInstructions)}
              className="absolute top-2 right-2 glass-button"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </MotionCard>
    </div>
  )
}