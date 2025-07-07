import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function loading() {
  return (
    <div className="min-h-screen">
      {/* Header Skeleton */}
      <header className="bg-background border-b px-3 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center h-full">
          <Skeleton className="h-6 w-6" />
          <div className="border-r ml-2 border-l flex items-center h-full gap-3">
            <Skeleton className="h-6 w-20 ml-4 mr-4" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <Card className="p-6 bg-transparent border-transparent">
        {/* Tabs List Skeleton */}
        <div className="w-full mb-8">
          <div className="grid w-full grid-cols-4 bg-muted rounded-lg p-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 rounded-md" />
            ))}
          </div>
        </div>

        {/* Tab Content Skeleton */}
        <div className="space-y-6">
          {/* Tab Header */}
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>

          {/* First Section */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Setting Items */}
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-11 rounded-full" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Second Section */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Setting Items */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-6 w-11 rounded-full" />
                    <Skeleton className="h-10 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Third Section */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-4 w-68" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Setting */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-11 rounded-full" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Skeleton className="h-6 w-11 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </Card>
    </div>
  );
}
