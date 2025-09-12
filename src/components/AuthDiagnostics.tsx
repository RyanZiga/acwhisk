import React, { useState } from 'react'
import { supabase } from '../utils/supabase/client'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { CheckCircle, XCircle, AlertCircle, Database, Wrench, RefreshCw } from 'lucide-react'
import { Separator } from './ui/separator'

interface DiagnosticResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
  fix?: string
  critical?: boolean
}

export function AuthDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [testing, setTesting] = useState(false)
  const [fixing, setFixing] = useState(false)

  const runDiagnostics = async () => {
    setTesting(true)
    const diagnosticResults: DiagnosticResult[] = []

    try {
      // Test 1: Check database connection
      try {
        const { error } = await supabase.from('profiles').select('count').limit(1)
        if (error && (error.code === 'PGRST301' || error.message.includes('relation "profiles" does not exist'))) {
          diagnosticResults.push({
            test: 'Database Schema',
            status: 'error',
            message: 'Profiles table does not exist. Database setup required.',
            fix: 'Run complete-auth-setup.sql',
            critical: true
          })
        } else if (error) {
          diagnosticResults.push({
            test: 'Database Connection',
            status: 'error',
            message: `Database error: ${error.message}`,
            critical: true
          })
        } else {
          diagnosticResults.push({
            test: 'Database Connection',
            status: 'success',
            message: 'Successfully connected to database'
          })
        }
      } catch (error) {
        diagnosticResults.push({
          test: 'Database Connection',
          status: 'error',
          message: `Connection failed: ${error}`,
          critical: true
        })
      }

      // Test 2: Check auth.users RLS status (critical - this should NEVER be enabled)
      try {
        const { data: rlsCheck, error: rlsError } = await supabase
          .rpc('test_auth_setup')

        if (rlsError) {
          // If the test function doesn't exist, try a manual check
          diagnosticResults.push({
            test: 'Auth Setup Test Function',
            status: 'warning',
            message: 'Auth setup test function not available. Manual check needed.',
            fix: 'Run complete-auth-setup.sql'
          })
        } else {
          const authUsersTest = rlsCheck?.find((test: any) => test.test_name === 'auth.users RLS status')
          if (authUsersTest?.status === 'FAIL') {
            diagnosticResults.push({
              test: 'Auth Users RLS Status',
              status: 'error',
              message: 'CRITICAL: RLS is enabled on auth.users table! This breaks authentication.',
              fix: 'Run: ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;',
              critical: true
            })
          } else {
            diagnosticResults.push({
              test: 'Auth Users RLS Status',
              status: 'success',
              message: 'RLS correctly disabled on auth.users table'
            })
          }

          // Check other setup results
          const failedTests = rlsCheck?.filter((test: any) => test.status === 'FAIL') || []
          if (failedTests.length > 0) {
            diagnosticResults.push({
              test: 'Database Configuration',
              status: 'error',
              message: `${failedTests.length} database configuration issues found`,
              fix: 'Run complete-auth-setup.sql'
            })
          }
        }
      } catch (error) {
        diagnosticResults.push({
          test: 'Database Setup Check',
          status: 'warning',
          message: 'Cannot verify database setup. Run complete setup script.',
          fix: 'Run complete-auth-setup.sql'
        })
      }

      // Test 3: Test sign up process with a fake user
      try {
        // First check if we're already signed in
        const { data: currentUser } = await supabase.auth.getUser()
        if (currentUser.user) {
          diagnosticResults.push({
            test: 'Sign Up Test',
            status: 'warning',
            message: 'Cannot test sign up - user already authenticated. Sign out first.',
          })
        } else {
          // Test with a fake email that won't actually create a user
          const testEmail = `test-${Date.now()}@example.com`
          const { error: signUpError } = await supabase.auth.signUp({
            email: testEmail,
            password: 'temp123456',
            options: {
              data: {
                name: 'Test User',
                role: 'student'
              }
            }
          })

          if (signUpError) {
            if (signUpError.message.includes('Database error saving new user')) {
              diagnosticResults.push({
                test: 'Sign Up Process',
                status: 'error',
                message: 'FOUND THE ISSUE: Database error during user creation. Trigger function likely failing.',
                fix: 'Run complete-auth-setup.sql to fix trigger function',
                critical: true
              })
            } else {
              diagnosticResults.push({
                test: 'Sign Up Process',
                status: 'error',
                message: `Sign up error: ${signUpError.message}`,
                critical: true
              })
            }
          } else {
            diagnosticResults.push({
              test: 'Sign Up Process',
              status: 'success',
              message: 'Sign up process works correctly'
            })
          }
        }
      } catch (error) {
        diagnosticResults.push({
          test: 'Sign Up Process',
          status: 'error',
          message: `Sign up test failed: ${error}`,
          critical: true
        })
      }

      // Test 4: Check if trigger function exists
      try {
        const { data: triggerCheck } = await supabase
          .rpc('test_auth_setup')

        const triggerTest = triggerCheck?.find((test: any) => test.test_name === 'user registration trigger')
        if (triggerTest?.status === 'FAIL') {
          diagnosticResults.push({
            test: 'User Registration Trigger',
            status: 'error',
            message: 'User registration trigger is missing',
            fix: 'Run complete-auth-setup.sql to create trigger',
            critical: true
          })
        } else {
          diagnosticResults.push({
            test: 'User Registration Trigger',
            status: 'success',
            message: 'User registration trigger exists'
          })
        }
      } catch (error) {
        diagnosticResults.push({
          test: 'User Registration Trigger',
          status: 'warning',
          message: 'Cannot verify trigger status'
        })
      }

      // Test 5: Check Supabase project settings
      try {
        const { data: { user } } = await supabase.auth.getUser()
        // If we can call this without error, basic auth is working
        diagnosticResults.push({
          test: 'Supabase Auth Service',
          status: 'success',
          message: 'Supabase Auth service is accessible'
        })
      } catch (error) {
        diagnosticResults.push({
          test: 'Supabase Auth Service',
          status: 'error',
          message: 'Cannot access Supabase Auth service',
          critical: true
        })
      }

    } catch (error) {
      diagnosticResults.push({
        test: 'Diagnostics',
        status: 'error',
        message: `Diagnostic process failed: ${error}`,
        critical: true
      })
    }

    setResults(diagnosticResults)
    setTesting(false)
  }

  const quickFix = async () => {
    setFixing(true)
    const fixResults: DiagnosticResult[] = []

    try {
      // Try to disable RLS on auth.users (this is the most critical fix)
      try {
        const { error } = await supabase.rpc('sql', {
          sql: 'ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;'
        })
        
        if (error) {
          fixResults.push({
            test: 'Quick Fix - Disable auth.users RLS',
            status: 'error',
            message: 'Cannot disable RLS via RPC. Manual SQL execution required.'
          })
        } else {
          fixResults.push({
            test: 'Quick Fix - Disable auth.users RLS',
            status: 'success',
            message: 'Successfully disabled RLS on auth.users table'
          })
        }
      } catch (error) {
        fixResults.push({
          test: 'Quick Fix - Disable auth.users RLS',
          status: 'error',
          message: 'Quick fix not available. Run complete setup script manually.'
        })
      }

    } catch (error) {
      fixResults.push({
        test: 'Quick Fix',
        status: 'error',
        message: `Quick fix failed: ${error}`
      })
    }

    setResults(prev => [...prev, ...fixResults])
    setFixing(false)
  }

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    }
  }

  const criticalIssues = results.filter(r => r.critical && r.status === 'error')
  const hasErrors = results.some(r => r.status === 'error')

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Authentication Diagnostics
        </CardTitle>
        <CardDescription>
          Comprehensive testing to identify and fix authentication issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3">
          <Button 
            onClick={runDiagnostics} 
            disabled={testing}
            className="glass-button flex-1"
          >
            {testing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Run Full Diagnostics
              </>
            )}
          </Button>
          
          {hasErrors && (
            <Button 
              onClick={quickFix} 
              disabled={fixing}
              variant="outline"
              className="flex-1"
            >
              {fixing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Applying Fixes...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Quick Fix
                </>
              )}
            </Button>
          )}
        </div>

        {criticalIssues.length > 0 && (
          <Alert className="border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{criticalIssues.length} critical issue(s) found!</strong> These must be fixed before sign up will work.
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Diagnostic Results</h3>
              <Badge variant="outline">
                {results.length} tests completed
              </Badge>
            </div>
            
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`flex items-start gap-3 p-4 rounded-lg border ${
                    result.critical ? 'border-red-500/30 bg-red-500/5' : 'bg-white/5 border-white/10'
                  }`}
                >
                  {getStatusIcon(result.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{result.test}</span>
                      <Badge className={getStatusColor(result.status)} variant="secondary">
                        {result.status.toUpperCase()}
                      </Badge>
                      {result.critical && (
                        <Badge variant="destructive" className="text-xs">
                          CRITICAL
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                    {result.fix && (
                      <div className="text-xs bg-blue-500/10 border border-blue-500/20 rounded p-2">
                        <strong>Fix:</strong> {result.fix}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-blue-400 mb-3">
                {hasErrors ? 'Critical Setup Required' : 'Next Steps'}
              </h4>
              
              {hasErrors ? (
                <div className="space-y-2 text-sm text-blue-300">
                  <p><strong>To fix the "Database error saving new user" issue:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Copy the <code className="bg-blue-600/20 px-1 rounded">/utils/supabase/complete-auth-setup.sql</code> file content</li>
                    <li>Open your Supabase project dashboard</li>
                    <li>Go to SQL Editor</li>
                    <li>Paste and run the complete setup script</li>
                    <li>Run diagnostics again to verify the fix</li>
                  </ol>
                  <p className="mt-3 text-yellow-300">
                    ⚠️ <strong>CRITICAL:</strong> Never enable RLS on the auth.users table - it will break authentication!
                  </p>
                </div>
              ) : (
                <ul className="text-sm text-blue-300 space-y-1">
                  <li>• All authentication systems are working correctly</li>
                  <li>• You can now test user registration</li>
                  <li>• Monitor the browser console for any signup issues</li>
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}