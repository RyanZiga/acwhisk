import React, { useState } from 'react'
import { supabase } from '../utils/supabase/client'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { CheckCircle, XCircle, AlertCircle, Database } from 'lucide-react'

interface TestResult {
  test: string
  status: 'success' | 'error' | 'warning'
  message: string
}

export function SignUpDebugger() {
  const [results, setResults] = useState<TestResult[]>([])
  const [testing, setTesting] = useState(false)

  const runTests = async () => {
    setTesting(true)
    const testResults: TestResult[] = []

    try {
      // Test 1: Check if we can connect to Supabase
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        if (error) {
          testResults.push({
            test: 'Database Connection',
            status: 'error',
            message: `Failed to connect to database: ${error.message}`
          })
        } else {
          testResults.push({
            test: 'Database Connection',
            status: 'success',
            message: 'Successfully connected to Supabase'
          })
        }
      } catch (error) {
        testResults.push({
          test: 'Database Connection',
          status: 'error',
          message: `Database connection failed: ${error}`
        })
      }

      // Test 2: Check if profiles table exists and is accessible
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, role')
          .limit(1)

        if (error) {
          testResults.push({
            test: 'Profiles Table Access',
            status: 'error',
            message: `Cannot access profiles table: ${error.message}`
          })
        } else {
          testResults.push({
            test: 'Profiles Table Access',
            status: 'success',
            message: 'Profiles table is accessible'
          })
        }
      } catch (error) {
        testResults.push({
          test: 'Profiles Table Access',
          status: 'error',
          message: `Profiles table test failed: ${error}`
        })
      }

      // Test 3: Check current auth state
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
          testResults.push({
            test: 'Auth State Check',
            status: 'warning',
            message: `Auth check warning: ${error.message}`
          })
        } else if (user) {
          testResults.push({
            test: 'Auth State Check',
            status: 'warning',
            message: `Already signed in as ${user.email}`
          })
        } else {
          testResults.push({
            test: 'Auth State Check',
            status: 'success',
            message: 'Ready for sign up (no user currently signed in)'
          })
        }
      } catch (error) {
        testResults.push({
          test: 'Auth State Check',
          status: 'error',
          message: `Auth state check failed: ${error}`
        })
      }

      // Test 4: Check auth setup using the database function
      try {
        const { data: authTestResults, error: authTestError } = await supabase
          .rpc('test_auth_setup')

        if (authTestError) {
          testResults.push({
            test: 'Database Auth Setup',
            status: 'error',
            message: `Cannot run auth setup test: ${authTestError.message}`
          })
        } else {
          const failedTests = authTestResults?.filter((test: any) => test.status === 'FAIL') || []
          if (failedTests.length === 0) {
            testResults.push({
              test: 'Database Auth Setup',
              status: 'success',
              message: 'All authentication setup tests passed'
            })
          } else {
            testResults.push({
              test: 'Database Auth Setup',
              status: 'error',
              message: `${failedTests.length} auth setup test(s) failed. Check database configuration.`
            })
          }
        }
      } catch (error) {
        testResults.push({
          test: 'Database Auth Setup',
          status: 'warning',
          message: 'Auth setup test function not available - run complete-auth-setup.sql'
        })
      }

      // Test 5: Check if manual profile creation works
      try {
        const { data: currentUser } = await supabase.auth.getUser()
        if (currentUser.user) {
          // Try the manual profile creation function (this should work even if profile exists)
          const { data: profileTest, error: profileError } = await supabase
            .rpc('create_user_profile', {
              user_id: currentUser.user.id,
              user_name: 'Test Profile Update',
              user_role: 'student'
            })

          if (profileError) {
            testResults.push({
              test: 'Manual Profile Creation',
              status: 'error',
              message: `Manual profile creation failed: ${profileError.message}`
            })
          } else {
            testResults.push({
              test: 'Manual Profile Creation',
              status: 'success',
              message: 'Manual profile creation function works correctly'
            })
          }
        } else {
          testResults.push({
            test: 'Manual Profile Creation',
            status: 'warning',
            message: 'Cannot test profile creation - no authenticated user'
          })
        }
      } catch (error) {
        testResults.push({
          test: 'Manual Profile Creation',
          status: 'warning',
          message: 'Profile creation function not available - run complete-auth-setup.sql'
        })
      }

    } catch (error) {
      testResults.push({
        test: 'General Test',
        status: 'error',
        message: `Unexpected error during testing: ${error}`
      })
    }

    setResults(testResults)
    setTesting(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Sign Up Diagnostics
        </CardTitle>
        <CardDescription>
          Test the sign up system to identify any issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={testing}
          className="w-full glass-button"
        >
          {testing ? 'Running Tests...' : 'Run Diagnostic Tests'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Test Results:</h3>
            {results.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{result.test}</span>
                    <Badge className={getStatusColor(result.status)} variant="secondary">
                      {result.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                </div>
              </div>
            ))}

            <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-semibold text-sm text-blue-400 mb-2">Next Steps:</h4>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• If any tests failed, run <code className="bg-blue-600/20 px-1 rounded">/utils/supabase/complete-auth-setup.sql</code> in your Supabase SQL Editor</li>
                <li>• The complete setup script fixes all common authentication and RLS issues</li>
                <li>• Check the browser console for detailed error messages during sign up</li>
                <li>• Ensure email confirmation is disabled in Supabase Auth settings for development</li>
                <li>• ⚠️ Never enable RLS on the auth.users table - it will break authentication</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}