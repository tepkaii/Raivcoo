import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex justify-center">
      <main className="pb-12 md:pb-16 relative z-10 space-y-16 mt-16 w-full">
        {/* Hero Section Skeleton with better proportions */}
        <section className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Skeleton className="h-12 w-[400px] mx-auto mb-4" />{" "}
            {/* Wider header */}
            <Skeleton className="h-6 w-[500px] mx-auto" />{" "}
            {/* Wider subheader */}
          </div>
        </section>

        {/* Tools Grid Skeleton with corrected card proportions */}
        <section className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((index) => (
              <div
                key={index}
                className="flex flex-col w-full rounded-xl border bg-card shadow-md"
              >
                {/* Thumbnail Skeleton with wider aspect ratio */}
                <div className="w-full">
                  <Skeleton
                    className="w-full rounded-t-xl"
                    style={{ paddingTop: "56.25%" }} // 16:9 aspect ratio
                  />
                </div>

                {/* Content Skeleton */}
                <div className="flex flex-col flex-1 p-6">
                  <Skeleton className="h-7 w-[70%] mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-[90%] mb-6" />

                  {/* Button Group Skeleton */}
                  <div className="flex justify-between items-center gap-4 mt-auto">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-24 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
