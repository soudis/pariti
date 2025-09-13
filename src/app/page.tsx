import { CreateGroupDialog } from "@/components/create-group-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Shary
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Money sharing made simple. Split expenses with friends and family.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid gap-8 md:grid-cols-2">
            {/* Create New Group */}
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-xl">Create New Group</CardTitle>
                <CardDescription>
                  Start a new expense sharing group with friends or family
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <CreateGroupDialog>
                  <Button size="lg" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Group
                  </Button>
                </CreateGroupDialog>
              </CardContent>
            </Card>

            {/* Join Existing Group */}
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500 transition-colors">
              <CardHeader className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Join Existing Group</CardTitle>
                <CardDescription>
                  Enter a group link to join an existing expense sharing group
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" size="lg" className="w-full">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Join Group
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
              How it works
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                  </div>
                  <CardTitle className="text-lg">Create or Join</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Create a new group or join an existing one using a shared link
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                  </div>
                  <CardTitle className="text-lg">Add Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Add friends and family members to your expense sharing group
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mb-2">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                  </div>
                  <CardTitle className="text-lg">Track Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Add expenses and see who owes what automatically calculated
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}