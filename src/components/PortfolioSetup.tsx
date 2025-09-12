import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  ExternalLink,
  RefreshCw,
  Play,
  FileText,
  Zap,
  BookOpen
} from 'lucide-react'
import { toast } from 'sonner@2.0.3'
import { supabase } from '../utils/supabase/client'

interface PortfolioSetupProps {
  onSetupComplete?: () => void
}

export function PortfolioSetup({ onSetupComplete }: PortfolioSetupProps) {
  const [isApplying, setIsApplying] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)

  const portfolioSchema = `
-- Enhanced Digital Portfolio Schema for ACWhisk
-- Run this AFTER the main schema has been applied

-- Update portfolios table structure (remove old columns if they exist)
ALTER TABLE portfolios DROP COLUMN IF EXISTS images;
ALTER TABLE portfolios DROP COLUMN IF EXISTS skills;
ALTER TABLE portfolios DROP COLUMN IF EXISTS achievements;

-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('recipe', 'achievement', 'certification', 'project')),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  level INTEGER CHECK (level >= 0 AND level <= 100) DEFAULT 0,
  category TEXT DEFAULT 'general',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  badge_type TEXT DEFAULT 'general',
  verified BOOLEAN DEFAULT false,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at triggers for new tables
CREATE TRIGGER update_portfolio_items_updated_at 
  BEFORE UPDATE ON portfolio_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at 
  BEFORE UPDATE ON user_skills 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for portfolio_items
CREATE POLICY "Users can view portfolio items from public portfolios" 
  ON portfolio_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolios p 
      WHERE p.id = portfolio_items.portfolio_id 
      AND p.is_public = true
    )
  );

CREATE POLICY "Users can view own portfolio items" 
  ON portfolio_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolios p 
      WHERE p.id = portfolio_items.portfolio_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create portfolio items for own portfolios" 
  ON portfolio_items FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios p 
      WHERE p.id = portfolio_items.portfolio_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own portfolio items" 
  ON portfolio_items FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM portfolios p 
      WHERE p.id = portfolio_items.portfolio_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own portfolio items" 
  ON portfolio_items FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM portfolios p 
      WHERE p.id = portfolio_items.portfolio_id 
      AND p.user_id = auth.uid()
    )
  );

-- Create RLS policies for user_skills
CREATE POLICY "Anyone can view user skills" 
  ON user_skills FOR SELECT USING (true);

CREATE POLICY "Users can create own skills" 
  ON user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skills" 
  ON user_skills FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills" 
  ON user_skills FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_achievements
CREATE POLICY "Anyone can view user achievements" 
  ON user_achievements FOR SELECT USING (true);

CREATE POLICY "Users can create own achievements" 
  ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" 
  ON user_achievements FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own achievements" 
  ON user_achievements FOR DELETE USING (auth.uid() = user_id);

-- Update handle_new_user function to create portfolio data for new users
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
  
  -- Create default portfolio
  INSERT INTO portfolios (user_id, title, description, is_public)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'My') || ' Culinary Portfolio', 'Showcasing my culinary journey and achievements', true);
  
  -- Add starter skills
  INSERT INTO user_skills (user_id, name, level, category) VALUES
    (NEW.id, 'Knife Skills', 20, 'techniques'),
    (NEW.id, 'Food Safety', 15, 'fundamentals'),
    (NEW.id, 'Recipe Development', 10, 'creativity'),
    (NEW.id, 'Flavor Pairing', 5, 'advanced')
  ON CONFLICT (user_id, name) DO NOTHING;
  
  -- Add welcome achievement
  INSERT INTO user_achievements (user_id, title, description, badge_type)
  VALUES (NEW.id, 'Welcome to ACWhisk!', 'Joined the ACWhisk culinary community', 'milestone');
  
  RETURN NEW;
END;
$$;

-- Create some sample achievements that users can earn
CREATE TABLE IF NOT EXISTS achievement_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  badge_type TEXT DEFAULT 'general',
  criteria JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample achievement templates
INSERT INTO achievement_templates (title, description, badge_type, criteria) VALUES
  ('First Recipe', 'Created your first recipe', 'milestone', '{"recipes_created": 1}'),
  ('Recipe Master', 'Created 10 recipes', 'achievement', '{"recipes_created": 10}'),
  ('Community Helper', 'Helped 5 fellow cooks in the forum', 'community', '{"forum_replies": 5}'),
  ('Popular Chef', 'Received 50 likes on your recipes', 'social', '{"total_likes": 50}'),
  ('Skill Builder', 'Reached 80% proficiency in 5 skills', 'mastery', '{"high_skills": 5}'),
  ('Portfolio Showcase', 'Added 15 items to your portfolio', 'portfolio', '{"portfolio_items": 15}')
ON CONFLICT DO NOTHING;
`

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Portfolio schema copied to clipboard! 📋')
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  const testPortfolioTables = async () => {
    setIsApplying(true)
    try {
      // Test each portfolio table
      const tables = ['portfolio_items', 'user_skills', 'user_achievements']
      const results = await Promise.all(
        tables.map(async (table) => {
          const { error } = await supabase
            .from(table)
            .select('id', { count: 'exact', head: true })
            .limit(1)
          
          return {
            table,
            exists: !error || (error.code !== 'PGRST205' && error.code !== '42P01')
          }
        })
      )

      const allExist = results.every(r => r.exists)
      
      if (allExist) {
        setSetupComplete(true)
        toast.success('🎉 Portfolio setup complete! All tables are ready.')
        onSetupComplete?.()
      } else {
        const missingTables = results.filter(r => !r.exists).map(r => r.table)
        toast.error(`Missing tables: ${missingTables.join(', ')}`)
      }
    } catch (error) {
      console.error('Error testing portfolio tables:', error)
      toast.error('Failed to test portfolio tables')
    } finally {
      setIsApplying(false)
    }
  }

  if (setupComplete) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            Portfolio Setup Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <Badge className="bg-green-100 text-green-800">
              <Zap className="w-3 h-3 mr-1" />
              All portfolio tables ready
            </Badge>
            <p className="text-muted-foreground">
              Your Digital Portfolio feature is now ready to use!
            </p>
            <Button onClick={() => window.location.reload()} className="glass-button">
              Go to Portfolio
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-500" />
          Digital Portfolio Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The Digital Portfolio feature requires additional database tables. Follow the steps below to set them up.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-medium">Quick Setup Steps:</h4>
          <ol className="space-y-2 text-sm list-decimal list-inside">
            <li>Copy the portfolio schema SQL below</li>
            <li>Open your Supabase project's SQL Editor</li>
            <li>Paste and run the SQL</li>
            <li>Click "Test Setup" to verify</li>
          </ol>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => copyToClipboard(portfolioSchema)}
            className="glass-button"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Portfolio Schema
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
            onClick={testPortfolioTables}
            disabled={isApplying}
            className="glass-input border-glass-border"
          >
            {isApplying ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            Test Setup
          </Button>
        </div>

        {/* Schema Preview */}
        <div className="space-y-2">
          <h4 className="font-medium">Portfolio Schema SQL:</h4>
          <div className="relative">
            <pre className="bg-black/10 rounded-lg p-4 text-sm overflow-x-auto max-h-64 overflow-y-auto">
              <code>{portfolioSchema}</code>
            </pre>
            <Button
              size="sm"
              onClick={() => copyToClipboard(portfolioSchema)}
              className="absolute top-2 right-2 glass-button"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}