import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex justify-center">
      <main className="pb-12 md:pb-16 relative z-10 space-y-16 mt-16 w-full">
        {/* Hero Section Skeleton */}
        <section className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Skeleton className="h-14 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-2/3 mx-auto mb-8" />
            <Skeleton className="h-12 w-48 mx-auto" />
          </div>
        </section>

        {/* Features Section Skeletons */}
        {[1, 2, 3, 4, 5, 6, 7].map((index) => (
          <section key={index} className="container mx-auto px-4 mb-24">
            <div className="flex flex-col gap-8">
              <div className="space-y-6 max-w-2xl">
                <Skeleton className="h-10 w-64 mb-4" />
                <Skeleton className="h-6 w-full mb-6" />

                {/* Feature items skeleton */}
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-6 flex-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Video/Media skeleton */}
              <div className="w-full">
                <Skeleton className="w-full aspect-video rounded-[20px]" />
              </div>
            </div>
          </section>
        ))}

        {/* Compatibility Section Skeleton */}
        <section className="container mx-auto px-4">
          <div className="mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 md:p-8">
              <Skeleton className="h-10 w-48 mb-6" />
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section Skeleton */}
        <section className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="bg-card/50 backdrop-blur-sm border rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-[600px]">
                <Skeleton className="w-full" style={{ paddingTop: "52.5%" }} />
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-8">
                <div className="text-center md:text-left">
                  <Skeleton className="h-12 w-32 mb-2" />
                  <Skeleton className="h-6 w-48" />
                </div>

                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5" />
                      <Skeleton className="h-6 flex-1" />
                    </div>
                  ))}
                </div>

                <Skeleton className="h-12 w-full mt-auto" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
