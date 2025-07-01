import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function loading() {
  return (
    <div className="min-h-screen space-y-6">
      {/* Header Skeleton */}
      <header className="bg-background border-b px-3 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center h-full">
          <Skeleton className="h-6 w-6" />
          <div className="border-r ml-2 border-l flex items-center h-full gap-3">
            <Skeleton className="h-6 w-48 ml-4 mr-4" />
          </div>
        </div>
        {/* Create Project Dialog Button */}
        <Skeleton className="h-9 w-32" />
      </header>

      {/* Main Content */}
      <div className="space-y-6 px-4">
        {/* Filters and Controls Skeleton */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-[140px]" />
                <Skeleton className="h-10 w-[130px]" />
                <Skeleton className="h-10 w-10" />
                <div className="flex">
                  <Skeleton className="h-10 w-10 rounded-r-none" />
                  <Skeleton className="h-10 w-10 rounded-l-none" />
                </div>
              </div>
            </div>

            {/* Results summary */}
            <div className="mt-4 pt-4 border-t">
              <Skeleton className="h-4 w-48" />
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid Skeleton */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            width: "100%",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden relative">
              {/* Media Gallery Skeleton */}
              <div className="relative bg-gradient-to-br from-blue-300 to-blue-800">
                <div className="aspect-video px-2 py-3">
                  <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full place-items-center">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="w-full h-full">
                        <Skeleton className="w-full h-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 bg-primary-foreground">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-4 w-4 ml-2 flex-shrink-0" />
                  </div>

                  {/* Media Stats */}
                  <div className="flex items-center justify-between text-xs">
                    <Skeleton className="h-3 w-16" />
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-3 w-3" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-3 w-3" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
