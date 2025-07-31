import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Gamepad2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/80 border-2 border-cyan-400 shadow-2xl shadow-cyan-400/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-purple-400/10 animate-pulse"></div>
        
        <CardHeader className="text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Gamepad2 className="w-16 h-16 text-cyan-400 animate-bounce" />
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin absolute -top-2 -right-2" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Loading...
          </CardTitle>
          <p className="text-cyan-300 text-sm mt-2">
            Preparing your arcade experience!
          </p>
        </CardHeader>

        <CardContent className="text-center relative z-10">
          <div className="text-white">
            <p className="mb-4">
              Initializing game components...
            </p>
            <div className="flex justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 