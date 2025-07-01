import { Skeleton } from "@/components/ui/skeleton";

export default function loading() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header Skeleton */}
      <header className="bg-background border-b h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center h-full">
          <div className="flex items-center justify-center border-l border-r h-full mr-3">
            <div className="flex items-center mr-2 ml-2 h-full">
              <Skeleton className="h-6 w-6" />
            </div>
          </div>
          <div className="border-r flex items-center h-full">
            <div className="mr-3">
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>

        {/* Panel Toggle Buttons Skeleton */}
        <div className="flex items-center gap-1">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Media Library Panel Skeleton */}
        <div className="border-r flex flex-col flex-shrink-0 min-w-0 w-full">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="h-full flex flex-col text-white">
              {/* Project Size Indicator & Upload Area Skeleton */}
              <div className="p-4 border-b flex-shrink-0">
                {/* Project Size Indicator */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="w-full h-1.5 rounded-full" />
                </div>

                {/* Upload Area */}
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-5 mx-auto" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32 mx-auto" />
                      <Skeleton className="h-3 w-48 mx-auto" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-56 mx-auto" />
                        <Skeleton className="h-3 w-40 mx-auto" />
                        <Skeleton className="h-3 w-36 mx-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Grid Skeleton */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="space-y-2">
                      {/* Media Card Skeleton */}
                      <div className="bg-primary-foreground rounded-lg overflow-hidden">
                        {/* Video/Image Area */}
                        <div className="relative aspect-video bg-black">
                          <Skeleton className="w-full h-full" />
                          {/* Type badge */}
                          <div className="absolute top-2 left-2">
                            <Skeleton className="h-6 w-16 rounded-full" />
                          </div>
                          {/* Version badge */}
                          <div className="absolute top-2 right-2">
                            <Skeleton className="h-6 w-8 rounded-full" />
                          </div>
                          {/* Actions button */}
                          <div className="absolute bottom-2 right-2">
                            <Skeleton className="h-8 w-8 rounded" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-3 border-t-2 space-y-2">
                          <div>
                            <Skeleton className="h-4 w-3/4 mb-1" />
                            <div className="flex items-center justify-between">
                              <Skeleton className="h-3 w-16" />
                              <Skeleton className="h-3 w-12" />
                            </div>
                          </div>
                          {/* Status Selector */}
                          <div className="mt-2">
                            <Skeleton className="h-8 w-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}