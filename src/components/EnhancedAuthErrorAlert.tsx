import React from 'react'
import { Alert, AlertDescription } from './ui/alert'

interface EnhancedAuthErrorAlertProps {
  error?: string
  success?: string
}

export function EnhancedAuthErrorAlert({ error, success }: EnhancedAuthErrorAlertProps) {
  if (!error && !success) return null

  return (
    <Alert className={`glass-card border-0 ${success ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
      <AlertDescription className={success ? 'text-green-400' : 'text-red-400'}>
        <div className="space-y-2">
          <p>{error || success}</p>
          {error && (error.includes('Database error during user creation') || error.includes('Database error saving new user')) && (
            <div className="text-sm bg-red-500/10 border border-red-500/20 rounded p-2">
              <p className="text-red-400 font-medium">🚨 Critical Database Issue Detected</p>
              <p className="text-red-300">This is the exact error preventing user registration. Go to the <strong>Database Setup</strong> section and use the <strong>Database Authentication Checker</strong> for an automatic fix script.</p>
            </div>
          )}
          {error && error.includes('Database') && !error.includes('Database error during user creation') && !error.includes('Database error saving new user') && (
            <div className="text-sm bg-blue-500/10 border border-blue-500/20 rounded p-2">
              <p className="text-blue-400 font-medium">🔧 Need help fixing this?</p>
              <p className="text-blue-300">Run the <strong>Database Authentication Checker</strong> in the Database Setup section for detailed troubleshooting and automatic fixes.</p>
            </div>
          )}
          {error && error.includes('trigger function') && (
            <div className="text-sm bg-purple-500/10 border border-purple-500/20 rounded p-2">
              <p className="text-purple-400 font-medium">💡 Quick Fix Available</p>
              <p className="text-purple-300">This error typically means RLS is enabled on the auth.users table. Use the Database Authentication Checker for an automatic fix.</p>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}