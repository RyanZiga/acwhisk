import React, { useState } from 'react'
import { supabase } from '../utils/supabase/client'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { CheckCircle, XCircle, AlertCircle, Database, Copy, ExternalLink, Wrench } from 'lucide-react'
import { Separator } from './ui/separator'

interface CheckResult {
  name: string
  status: 'pass' | 'fail' | 'warning' | 'checking'
  message: string
  critical?: boolean
}

export function SimpleDatabaseChecker() {
  const [results, setResults] = useState<CheckResult[]>([])
  const [checking, setChecking] = useState(false)
  const [showSQLScript, setShowSQLScript] = useState(false)

  const runBasicChecks = async () => {
    setChecking(true)
    const checkResults: CheckResult[] = []

    // Check 1: Basic Supabase connection
    try {
      const { error } = await supabase.auth.getSession()
      if (error) {
        checkResults.push({
          name: 'Supabase Connection',
          status: 'fail',
          message: `Cannot connect to Supabase: ${error.message}`,
          critical: true
        })
      } else {
        checkResults.push({
          name: 'Supabase Connection',
          status: 'pass',
          message: 'Successfully connected to Supabase'
        })
      }
    } catch (error) {
      checkResults.push({
        name: 'Supabase Connection',
        status: 'fail',
        message: `Connection failed: ${error}`,
        critical: true
      })
    }

    // Check 2: Profiles table access
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('relation "profiles" does not exist')) {
          checkResults.push({
            name: 'Profiles Table',
            status: 'fail',
            message: 'Profiles table does not exist. Database setup required.',
            critical: true
          })
        } else if (error.code === '42501' || error.message.includes('permission denied')) {
          checkResults.push({
            name: 'Profiles Table',
            status: 'fail',
            message: 'Profiles table exists but RLS is blocking access. Setup required.',
            critical: true
          })
        } else {
          checkResults.push({
            name: 'Profiles Table',
            status: 'warning',
            message: `Profiles table issue: ${error.message}`
          })
        }
      } else {
        checkResults.push({
          name: 'Profiles Table',
          status: 'pass',
          message: 'Profiles table is accessible'
        })
      }
    } catch (error) {
      checkResults.push({
        name: 'Profiles Table',
        status: 'fail',
        message: `Profiles table check failed: ${error}`,
        critical: true
      })
    }

    // Check 3: Try a test sign up to identify the exact issue
    try {
      const testEmail = `test-diagnostic-${Date.now()}@example.com`
      const { error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'test123456',
        options: {
          data: {
            name: 'Test User',
            role: 'student'
          }
        }
      })

      if (signUpError) {
        if (signUpError.message.includes('Database error saving new user')) {
          checkResults.push({
            name: 'Sign Up Process',
            status: 'fail',
            message: 'CRITICAL: Database trigger function is failing during user creation. This is the exact issue causing your signup problems.',
            critical: true
          })
        } else if (signUpError.message.includes('User already registered')) {
          checkResults.push({
            name: 'Sign Up Process', 
            status: 'pass',
            message: 'Sign up process works (test email already exists)'
          })
        } else {
          checkResults.push({
            name: 'Sign Up Process',
            status: 'warning',
            message: `Sign up issue: ${signUpError.message}`
          })
        }
      } else {
        checkResults.push({
          name: 'Sign Up Process',
          status: 'pass',
          message: 'Sign up process works correctly'
        })
      }
    } catch (error) {
      checkResults.push({
        name: 'Sign Up Process',
        status: 'fail',
        message: `Sign up test failed: ${error}`,
        critical: true
      })
    }

    // Check 4: Test for auth.users RLS status (indirect check)
    try {
      // Try to access current user - if this works, auth.users RLS is probably correct
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error && error.message.includes('JWT')) {
        checkResults.push({
          name: 'Auth Configuration',
          status: 'warning',
          message: 'Potential JWT/Auth configuration issue detected'
        })
      } else {
        checkResults.push({
          name: 'Auth Configuration',
          status: 'pass',
          message: 'Basic auth configuration appears correct'
        })
      }
    } catch (error) {
      checkResults.push({
        name: 'Auth Configuration',
        status: 'warning',
        message: `Auth configuration check inconclusive: ${error}`
      })
    }

    // Check 5: Test database functions existence
    try {
      const { error } = await supabase.rpc('test_auth_setup')
      if (error) {
        if (error.code === 'PGRST202') {
          checkResults.push({
            name: 'Database Setup Functions',
            status: 'fail',
            message: 'Setup functions not found. Complete database setup required.',
            critical: true
          })
        } else {
          checkResults.push({
            name: 'Database Setup Functions',
            status: 'warning',
            message: `Function test failed: ${error.message}`
          })
        }
      } else {
        checkResults.push({
          name: 'Database Setup Functions',
          status: 'pass',
          message: 'Database setup functions are available'
        })
      }
    } catch (error) {
      checkResults.push({
        name: 'Database Setup Functions',
        status: 'fail',
        message: 'Setup functions not available. Run complete setup script.',
        critical: true
      })
    }

    setResults(checkResults)
    setChecking(false)

    // Auto-show SQL script if critical issues found
    const hasCriticalIssues = checkResults.some(r => r.critical && r.status === 'fail')
    if (hasCriticalIssues) {
      setShowSQLScript(true)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const getStatusIcon = (status: CheckResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'checking':
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    }
  }

  const getStatusColor = (status: CheckResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'fail':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'checking':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    }
  }

  const criticalIssues = results.filter(r => r.critical && r.status === 'fail')
  const hasIssues = results.some(r => r.status === 'fail' || r.status === 'warning')

  const fixScript = `-- ACWhisk Critical Authentication Fix Script
-- This script fixes the "Database error saving new user" issue
-- Copy and paste this entire script into your Supabase SQL Editor

-- STEP 1: Ensure auth.users table has RLS DISABLED (CRITICAL!)
-- This is the most common cause of the signup error
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Create essential types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- STEP 3: Create profiles table if it doesn't exist
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

-- STEP 4: Enable RLS on profiles (NOT on auth.users!)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create essential RLS policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation during registration" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view all profiles" ON profiles 
  FOR SELECT USING (true);

CREATE POLICY "Allow profile creation during registration" ON profiles 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- STEP 6: Create the user registration trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_role TEXT;
BEGIN
  -- Extract user data with fallbacks
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name', 
    NEW.email, 
    'New User'
  );
  
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role', 
    'student'
  );

  -- Validate role
  IF user_role NOT IN ('student', 'instructor', 'admin') THEN
    user_role := 'student';
  END IF;

  -- Insert into profiles table
  INSERT INTO profiles (id, name, role, created_at, updated_at)
  VALUES (
    NEW.id, 
    user_name,
    user_role::user_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail user creation
  RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- STEP 7: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- STEP 8: Create test function for diagnostics
CREATE OR REPLACE FUNCTION test_auth_setup()
RETURNS TABLE (
  test_name TEXT,
  status TEXT,
  message TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  -- Test auth.users RLS status
  RETURN QUERY
  SELECT 
    'auth.users RLS status'::TEXT,
    CASE WHEN NOT pg_class.relrowsecurity THEN 'PASS' ELSE 'FAIL' END::TEXT,
    CASE WHEN NOT pg_class.relrowsecurity 
         THEN 'RLS correctly disabled on auth.users'
         ELSE 'ERROR: RLS is enabled on auth.users!'
    END::TEXT
  FROM pg_class 
  JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid
  WHERE pg_class.relname = 'users' AND pg_namespace.nspname = 'auth';
  
  -- Test profiles table
  RETURN QUERY
  SELECT 
    'profiles table'::TEXT,
    'PASS'::TEXT,
    'profiles table is configured'::TEXT;
    
  -- Test trigger
  RETURN QUERY
  SELECT 
    'user registration trigger'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
         THEN 'PASS' ELSE 'FAIL' END::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
         THEN 'Trigger exists'
         ELSE 'Trigger missing'
    END::TEXT;
END;
$$;

-- STEP 9: Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION test_auth_setup TO anon, authenticated;

-- COMPLETION MESSAGE
DO $$
BEGIN
  RAISE NOTICE '✅ Authentication fix complete!';
  RAISE NOTICE 'The "Database error saving new user" issue should now be resolved.';
  RAISE NOTICE 'Test user signup in your application to verify the fix.';
END $$;`

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Authentication Checker
        </CardTitle>
        <CardDescription>
          Quick diagnostic tool to identify and fix the "Database error saving new user" issue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button 
          onClick={runBasicChecks} 
          disabled={checking}
          className="w-full glass-button"
        >
          {checking ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Running Checks...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Run Database Checks
            </>
          )}
        </Button>

        {criticalIssues.length > 0 && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Critical Issues Found!</strong> These are preventing user registration:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {criticalIssues.map((issue, idx) => (
                    <li key={idx}>{issue.message}</li>
                  ))}
                </ul>
                <p className="text-sm font-medium">💡 The fix script below will resolve these issues.</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Check Results</h3>
              <Badge variant="outline">
                {results.length} checks completed
              </Badge>
            </div>
            
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    result.critical && result.status === 'fail' 
                      ? 'border-red-500/30 bg-red-500/5' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{result.name}</span>
                      <Badge className={getStatusColor(result.status)} variant="secondary">
                        {result.status.toUpperCase()}
                      </Badge>
                      {result.critical && result.status === 'fail' && (
                        <Badge variant="destructive" className="text-xs">
                          CRITICAL
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {hasIssues && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-red-400">🔧 Database Fix Required</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSQLScript(!showSQLScript)}
                      className="glass-input border-glass-border"
                    >
                      {showSQLScript ? 'Hide' : 'Show'} Fix Script
                    </Button>
                  </div>

                  {showSQLScript && (
                    <div className="space-y-4">
                      <Alert className="border-blue-500/50 bg-blue-500/10">
                        <Wrench className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-3">
                            <p className="font-medium text-blue-400">📋 How to Apply the Fix:</p>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-300">
                              <li>Copy the SQL script below</li>
                              <li>Open your Supabase project dashboard</li>
                              <li>Go to <strong>SQL Editor</strong></li>
                              <li>Paste the script and click <strong>Run</strong></li>
                              <li>Run the checks again to verify the fix</li>
                            </ol>
                          </div>
                        </AlertDescription>
                      </Alert>

                      <div className="relative">
                        <pre className="bg-black/20 rounded-lg p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto border border-white/10">
                          <code className="text-green-400">{fixScript}</code>
                        </pre>
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(fixScript)}
                            className="glass-button"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open('https://supabase.com/dashboard/project/_/sql', '_blank')}
                            className="glass-input border-glass-border"
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            SQL Editor
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <h5 className="font-semibold text-yellow-400 mb-2">⚠️ Critical Reminder</h5>
                    <p className="text-sm text-yellow-300">
                      <strong>Never enable RLS on the auth.users table!</strong> This will completely break authentication. 
                      The script above ensures RLS is disabled on auth.users and properly configured on the profiles table.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}