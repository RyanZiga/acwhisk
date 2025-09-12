import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { RefreshCw, CheckCircle, AlertCircle, Database, Trash2 } from 'lucide-react'
import { supabase } from '../utils/supabase/client'
// Using stub bucket functions since buckets already exist
import { ensureBucketsExist, createBucketIfNotExists } from '../utils/supabase/bucket-setup'
import { debugBucketAccess, testUploadToAnyBucket } from '../utils/supabase/bucket-debug'

interface BucketInfo {
  name: string
  exists: boolean
  public: boolean
  error?: string
  createdAt?: string
}

export function StorageBucketManager() {
  const [buckets, setBuckets] = useState<BucketInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const expectedBuckets = [
    'make-cfac176d-recipes',
    'make-cfac176d-profiles',
    'make-cfac176d-forums',
    'make-cfac176d-resources',
    'make-cfac176d-chat-media'
  ]

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 5000)
  }

  const checkBuckets = async () => {
    setLoading(true)
    try {
      const { data: existingBuckets, error } = await supabase.storage.listBuckets()
      
      if (error) {
        console.error('Error listing buckets:', error)
        showMessage(`Error checking buckets: ${error.message}`, 'error')
        return
      }

      const bucketStatus: BucketInfo[] = expectedBuckets.map(bucketName => {
        const existingBucket = existingBuckets?.find(b => b.name === bucketName)
        return {
          name: bucketName,
          exists: !!existingBucket,
          public: existingBucket?.public || false,
          createdAt: existingBucket?.created_at
        }
      })

      setBuckets(bucketStatus)
      
      const existingCount = bucketStatus.filter(b => b.exists).length
      showMessage(`Found ${existingCount}/${expectedBuckets.length} buckets`, 'success')
    } catch (error) {
      console.error('Error checking buckets:', error)
      showMessage('Failed to check bucket status', 'error')
    } finally {
      setLoading(false)
    }
  }

  const createAllBuckets = async () => {
    setCreating(true)
    try {
      const success = await ensureBucketsExist()
      if (success) {
        showMessage('Storage buckets initialized successfully!', 'success')
        await checkBuckets() // Refresh status
      } else {
        showMessage('Some buckets failed to initialize. Check console for details.', 'error')
      }
    } catch (error) {
      console.error('Error creating buckets:', error)
      showMessage('Failed to initialize storage buckets', 'error')
    } finally {
      setCreating(false)
    }
  }

  const createSingleBucket = async (bucketName: string) => {
    try {
      const success = await createBucketIfNotExists(bucketName)
      if (success) {
        showMessage(`Successfully created bucket: ${bucketName}`, 'success')
        await checkBuckets() // Refresh status
      } else {
        showMessage(`Failed to create bucket: ${bucketName}`, 'error')
      }
    } catch (error) {
      console.error('Error creating bucket:', error)
      showMessage(`Error creating bucket: ${bucketName}`, 'error')
    }
  }

  const deleteBucket = async (bucketName: string) => {
    if (!confirm(`Are you sure you want to delete bucket "${bucketName}"? This will remove all files in it.`)) {
      return
    }

    try {
      const { error } = await supabase.storage.deleteBucket(bucketName)
      if (error) {
        showMessage(`Failed to delete bucket: ${error.message}`, 'error')
      } else {
        showMessage(`Successfully deleted bucket: ${bucketName}`, 'success')
        await checkBuckets() // Refresh status
      }
    } catch (error) {
      console.error('Error deleting bucket:', error)
      showMessage(`Error deleting bucket: ${bucketName}`, 'error')
    }
  }

  const runDiagnostics = async () => {
    setTesting(true)
    try {
      console.log('\n=== Starting Storage Diagnostics ===')
      
      // Test each bucket
      for (const bucketName of expectedBuckets) {
        await debugBucketAccess(bucketName)
      }
      
      // Test upload functionality
      const uploadSuccess = await testUploadToAnyBucket()
      
      if (uploadSuccess) {
        showMessage('✅ All storage diagnostics passed! Uploads should work correctly.', 'success')
      } else {
        showMessage('⚠️ Some diagnostics failed. Check console for details.', 'error')
      }
    } catch (error) {
      console.error('Diagnostics error:', error)
      showMessage('❌ Diagnostics failed with error. Check console for details.', 'error')
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    checkBuckets()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Storage Bucket Manager
        </CardTitle>
        <CardDescription>
          Manage Supabase storage buckets for file uploads. All buckets are set to public for easier access.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {message && (
          <Alert variant={messageType === 'error' ? 'destructive' : 'default'}>
            {messageType === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={checkBuckets} 
            disabled={loading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          
          <Button 
            onClick={createAllBuckets} 
            disabled={creating || loading}
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            {creating ? 'Creating...' : 'Initialize All Buckets'}
          </Button>
          
          <Button 
            onClick={runDiagnostics} 
            disabled={testing || loading}
            variant="outline"
            className="gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            {testing ? 'Testing...' : 'Run Diagnostics'}
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Bucket Status:</h4>
          
          {buckets.length === 0 && !loading ? (
            <p className="text-sm text-muted-foreground">Click "Refresh Status" to check buckets</p>
          ) : (
            <div className="space-y-2">
              {buckets.map((bucket) => (
                <div key={bucket.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {bucket.exists ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="text-sm font-mono">{bucket.name}</span>
                    </div>
                    
                    <div className="flex gap-1">
                      <Badge variant={bucket.exists ? 'default' : 'destructive'}>
                        {bucket.exists ? 'Exists' : 'Missing'}
                      </Badge>
                      
                      {bucket.exists && (
                        <Badge variant={bucket.public ? 'default' : 'secondary'}>
                          {bucket.public ? 'Public' : 'Private'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {!bucket.exists && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => createSingleBucket(bucket.name)}
                        className="gap-1"
                      >
                        <Database className="h-3 w-3" />
                        Create
                      </Button>
                    )}
                    
                    {bucket.exists && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteBucket(bucket.name)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 bg-muted/50 rounded-lg">
          <h5 className="text-sm font-medium mb-2">Troubleshooting Upload Issues:</h5>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Make sure all required buckets exist (click "Initialize All Buckets")</li>
            <li>• Buckets are set to public to avoid permission issues</li>
            <li>• Check your Supabase project has storage enabled</li>
            <li>• Verify your RLS policies allow bucket operations</li>
            <li>• File size limits: 50MB for videos, 10MB for images</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default StorageBucketManager