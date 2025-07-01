import { Skeleton } from "@/components/ui/skeleton";

export default function loading() {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header Skeleton */}
      <header className="bg-background border-b px-3 md:px-4 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <Skeleton className="h-4 w-32 md:w-48" />

          {/* Version Selector & Download Button */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16" />
            <div className="hidden md:block">
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Status Selector - Desktop Only */}
        <div className="hidden md:block">
          <div className="flex justify-end items-center gap-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0">
        {/* Mobile Layout (< 768px) */}
        <div className="md:hidden flex flex-col h-full">
          {/* Mobile Media Area */}
          <div className="h-[40vh] flex-shrink-0 bg-black flex items-center justify-center relative">
            <Skeleton className="w-full h-full" />
            {/* Quality badge */}
            <div className="absolute top-4 right-4">
              <Skeleton className="h-6 w-16 rounded" />
            </div>
            {/* Player controls overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <Skeleton className="h-8 w-full rounded" />
            </div>
          </div>

          {/* Mobile Controls Row */}
          <div className="border-t border-b px-4 py-2 gap-2 flex-shrink-0 flex items-center justify-between">
            {/* Status Selector */}
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-8 flex-1" />
            </div>
            {/* Download Button */}
            <div className="border-l pl-2">
              <Skeleton className="h-8 w-8" />
            </div>
          </div>

          {/* Mobile Comments Area */}
          <div className="flex-1 min-h-0 flex flex-col border-t">
            {/* Mobile Comments Header */}
            <div className="border-b px-4 py-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>

            {/* Mobile Comments Content */}
            <div className="flex-1 min-h-0 p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-8 w-full" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Comment Input */}
            <div className="border-t p-4">
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Layout (>= 768px) */}
        <div className="hidden md:flex h-full">
          {/* Media Panel */}
          <div className="flex-1 bg-black flex items-center justify-center relative">
            <Skeleton className="w-full h-full" />
            {/* Quality badge */}
            <div className="absolute top-4 right-4">
              <Skeleton className="h-6 w-20 rounded" />
            </div>
            {/* Player controls overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <Skeleton className="h-12 w-full rounded" />
            </div>
          </div>

          {/* Resize Handle */}
          <div className="w-1 bg-border flex-shrink-0" />

          {/* Comments Panel */}
          <div className="w-96 flex flex-col border-l">
            {/* Comments Header */}
            <div className="border-b px-4 py-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-6" />
              </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-12 w-full" />
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-12" />
                        <Skeleton className="h-6 w-8" />
                      </div>
                    </div>
                  </div>
                  {/* Reply skeleton */}
                  {i === 2 && (
                    <div className="ml-11 space-y-2">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-10" />
                          </div>
                          <Skeleton className="h-8 w-full" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Comments Input */}
            <div className="border-t p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
