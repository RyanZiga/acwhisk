import React, { useState } from 'react'
import { supabase } from '../utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Copy,
  Wrench
} from 'lucide-react'
import { useNotifications } from './ui/notification'

interface ColumnCheck {
  tableName: string
  columnName: string
  exists: boolean
  required: boolean
  defaultValue?: string
  description: string
}

export function SchemaFixer() {
  const { addNotification } = useNotifications()
  const [checking, setChecking] = useState(false)
  const [columnChecks, setColumnChecks] = useState<ColumnCheck[]>([])

  const expectedColumns: Omit<ColumnCheck, 'exists'>[] = [
    {
      tableName: 'recipes',
      columnName: 'media_type',
      required: true,
      defaultValue: 'image',
      description: 'Type of media content (image or video)'
    },
    {
      tableName: 'recipes',
      columnName: 'cuisine',
      required: false,
      description: 'Cuisine type (Italian, Mexican, Asian, etc.)'
    }
  ]

  const checkColumns = async () => {
    setChecking(true)
    const checks: ColumnCheck[] = []

    for (const expected of expectedColumns) {
      try {
        // Try a simple select to test if column exists
        const { error } = await supabase
          .from(expected.tableName)
          .select(expected.columnName)
          .limit(1)

        checks.push({
          ...expected,
          exists: !error || (error.code !== 'PGRST204' && error.code !== 'PGRST205')
        })

        if (error && error.code === 'PGRST204') {
          console.log(`Column ${expected.columnName} missing from ${expected.tableName}`)
        }
      } catch (err) {
        checks.push({
          ...expected,
          exists: false
        })
      }
    }

    setColumnChecks(checks)
    setChecking(false)
  }

  const getMigrationSQL = () => {
    const missingColumns = columnChecks.filter(check => !check.exists)
    
    if (missingColumns.length === 0) return ''

    return `-- Fix missing columns in ACWhisk recipes table
-- Run this in your Supabase SQL Editor

${missingColumns.map(col => `
-- Add ${col.columnName} column to ${col.tableName} table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = '${col.tableName}' 
        AND column_name = '${col.columnName}'
    ) THEN
        ALTER TABLE ${col.tableName} ADD COLUMN ${col.columnName} TEXT${col.defaultValue ? ` DEFAULT '${col.defaultValue}'` : ''};
        ${col.defaultValue ? `
        -- Update existing records with default value
        UPDATE ${col.tableName} SET ${col.columnName} = '${col.defaultValue}' WHERE ${col.columnName} IS NULL;` : ''}
        
        -- Add documentation comment
        COMMENT ON COLUMN ${col.tableName}.${col.columnName} IS '${col.description}';
        
        RAISE NOTICE 'Added ${col.columnName} column to ${col.tableName} table';
    ELSE
        RAISE NOTICE '${col.columnName} column already exists in ${col.tableName} table';
    END IF;
END $$;`).join('\n')}

-- Refresh schema cache to ensure changes are recognized
NOTIFY pgrst, 'reload schema';`
  }

  const copyMigrationSQL = async () => {
    const sql = getMigrationSQL()
    if (!sql) return

    try {
      await navigator.clipboard.writeText(sql)
      addNotification({
        title: 'Copied! 📋',
        message: 'Migration SQL copied to clipboard',
        type: 'success'
      })
    } catch (error) {
      addNotification({
        title: 'Copy failed',
        message: 'Please manually copy the SQL commands',
        type: 'error'
      })
    }
  }

  React.useEffect(() => {
    checkColumns()
  }, [])

  const missingColumns = columnChecks.filter(check => !check.exists)
  const allGood = columnChecks.length > 0 && missingColumns.length === 0

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-500" />
              Schema Column Checker
            </CardTitle>
            <CardDescription>
              Check for missing database columns that are causing recipe errors
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {allGood && (
              <Badge className="bg-green-100 text-green-800">
                ✅ Schema OK
              </Badge>
            )}
            {missingColumns.length > 0 && (
              <Badge className="bg-red-100 text-red-800">
                ❌ {missingColumns.length} Missing
              </Badge>
            )}
            <Button
              onClick={checkColumns}
              disabled={checking}
              size="sm"
              variant="outline"
              className="glass-input"
            >
              {checking ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {columnChecks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Column Status</h4>
            {columnChecks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4" />
                  <div>
                    <p className="font-medium text-sm">{check.tableName}.{check.columnName}</p>
                    <p className="text-xs text-muted-foreground">{check.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={check.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {check.exists ? 'Exists' : 'Missing'}
                  </Badge>
                  {check.exists ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {missingColumns.length > 0 && (
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Missing columns detected!</strong> The recipe creation is failing because 
                some expected columns don't exist in your database.
              </AlertDescription>
            </Alert>

            <div>
              <h4 className="font-medium mb-2">Fix SQL Migration</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Copy and run this SQL in your Supabase SQL Editor to add the missing columns:
              </p>
              <div className="relative">
                <pre className="bg-black/10 rounded-lg p-4 text-sm overflow-x-auto max-h-60 overflow-y-auto">
                  <code>{getMigrationSQL()}</code>
                </pre>
                <Button
                  size="sm"
                  onClick={copyMigrationSQL}
                  className="absolute top-2 right-2 glass-button"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={copyMigrationSQL}
                className="glass-button"
                disabled={!getMigrationSQL()}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Migration SQL
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard/project/_/sql', '_blank')}
                className="glass-input border-glass-border"
              >
                Open SQL Editor
              </Button>
            </div>
          </div>
        )}

        {allGood && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>🎉 Schema is up to date!</strong> All required columns exist. 
              Recipe creation should work without errors now.
            </AlertDescription>
          </Alert>
        )}

        {checking && (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Checking database schema...</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}