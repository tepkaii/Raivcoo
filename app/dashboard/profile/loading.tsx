import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function loading() {
  return (
    <div className="min-h-screen">
      {/* Header Skeleton */}
      <header className="bg-background border-b px-3 h-[50px] flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center h-full">
          <Skeleton className="h-6 w-6" />
          <div className="border-r ml-2 border-l flex items-center h-full gap-3">
            <Skeleton className="h-6 w-48 ml-4 mr-4" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Profile Information Card */}
        <div className="space-y-6">
          {/* Profile Header with Avatar */}
          <Card className="flex flex-col sm:flex-row w-full items-center gap-6 p-5">
            <div className="flex items-center gap-4">
              {/* Avatar Skeleton */}
              <Skeleton className="h-20 w-20 rounded-xl" />

              {/* Name info */}
              <div className="flex flex-col gap-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </Card>

          {/* Form Fields Card */}
          <Card>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Full Name Field */}
              <div>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-12 mt-1" />
              </div>

              {/* Display Name Field */}
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-12 mt-1" />
              </div>

              {/* Email Field */}
              <div>
                <Skeleton className="h-4 w-12 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-48 mt-1" />
              </div>

              {/* Country Field */}
              <div>
                <Skeleton className="h-4 w-14 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-40 mt-1" />
              </div>

              {/* Time Zone Field - Full width */}
              <div className="md:col-span-2">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-56 mt-1" />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </div>

        {/* Password & Security Card */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>

            {/* Password Section Skeleton */}
            <div className="space-y-4">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </Card>

        {/* Support info */}
        <div className="text-center">
          <Skeleton className="h-3 w-80 mx-auto" />
        </div>
      </div>
    </div>
  );
}
