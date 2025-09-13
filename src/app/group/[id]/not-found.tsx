import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Group Not Found</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                The group you're looking for doesn't exist or has been removed.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/">
                    Create New Group
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

