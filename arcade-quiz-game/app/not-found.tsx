import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/80 border-2 border-red-400 shadow-2xl shadow-red-400/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-purple-400/10 animate-pulse"></div>
        
        <CardHeader className="text-center relative z-10">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
            404 - Page Not Found
          </CardTitle>
          <p className="text-red-300 text-sm mt-2">
            The page you're looking for doesn't exist.
          </p>
        </CardHeader>

        <CardContent className="space-y-4 relative z-10">
          <div className="text-center text-white">
            <p className="mb-4">
              Looks like you've ventured into uncharted territory!
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-red-400 text-red-400 hover:bg-red-400/10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 