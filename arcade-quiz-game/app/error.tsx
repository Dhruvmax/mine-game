'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/80 border-2 border-orange-400 shadow-2xl shadow-orange-400/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-purple-400/10 animate-pulse"></div>
        
        <CardHeader className="text-center relative z-10">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-purple-400 bg-clip-text text-transparent">
            Something went wrong!
          </CardTitle>
          <p className="text-orange-300 text-sm mt-2">
            An unexpected error occurred.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <div className="text-center text-white">
            <p className="mb-4">
              Don't worry, this is just a temporary glitch in the matrix!
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
              onClick={reset}
              className="w-full bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
              onClick={() => window.location.href = '/'}
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 