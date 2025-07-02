// app/dashboard/components/dashboard-loading.tsx
"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Film,
  Users,
  BarChart,
  Search,
  Filter,
  Calendar,
  HardDrive,
  ChevronRight,
  FolderOpen,
  Plus,
} from "lucide-react";


export function DashboardSkeleton() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid gap-6">
        {/* Recent Projects skeleton - matching MainProjectsList style */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Film className="h-5 w-5" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main project skeleton */}
            <ProjectCardSkeleton isMain={true} />

            {/* Other projects list */}
            <div className="space-y-4">
              <Skeleton className="h-4 w-48 mb-4" />
              {[1, 2].map((i) => (
                <ProjectCardSkeleton key={i} isMain={false} />
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>

        {/* Projects List Page Skeleton - matching MainProjectsList */}
        <ProjectsListSkeleton />

        {/* Recent Clients skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <ClientCardSkeleton key={i} />
              ))}
            </div>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>

        {/* Analytics skeleton */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Monthly Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Component skeletons
export function StatCardSkeleton() {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded-[5px]" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectCardSkeleton({ isMain }: { isMain: boolean }) {
  if (isMain) {
    return (
      <div className="space-y-4 p-4 border-2 border-dashed rounded-lg">
        <div className="flex items-start justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-9 w-9" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-36" />
        </div>
        <div className="flex gap-2 pt-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 py-3 border-2 border-dashed rounded-lg">
      <div className="flex items-center gap-3">
        <div>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
      </div>
      <Skeleton className="h-9 w-9" />
    </div>
  );
}

export function ClientCardSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1">
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-9 w-9" />
    </div>
  );
}

// New skeleton that matches MainProjectsList design
export function ProjectsListSkeleton() {
  return (
    <div className="space-y-6 px-4">
      {/* Filters and Controls Skeleton - matching MainProjectsList */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search skeleton */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <div className="h-10 pl-10 border-2 bg-[#121212] border-[#262626] rounded-md">
                <Skeleton className="h-full w-full" />
              </div>
            </div>

            {/* Filters skeleton */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center w-[140px] h-10 border rounded-md px-3">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <Skeleton className="h-4 w-16" />
              </div>

              <div className="flex items-center w-[130px] h-10 border rounded-md px-3">
                <Skeleton className="h-4 w-20" />
              </div>

              <div className="w-10 h-10 border rounded-md">
                <Skeleton className="h-full w-full" />
              </div>

              <div className="flex">
                <div className="w-10 h-10 border rounded-l-md">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="w-10 h-10 border rounded-r-md border-l-0">
                  <Skeleton className="h-full w-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Results summary skeleton */}
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
          <ProjectGridCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Project Grid Card Skeleton - matching the actual ProjectCard design
export function ProjectGridCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Media Thumbnail Gallery Skeleton */}
      <div className="relative bg-gradient-to-br from-blue-300 to-blue-800">
        <div className="aspect-video bg-black rounded-t-lg">
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-primary-foreground">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-32" />
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
          </div>

          {/* Media Stats */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <HardDrive className="h-3 w-3" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// Empty Projects State Skeleton
export function EmptyProjectsSkeleton() {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <Skeleton className="h-6 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-64 mx-auto mb-6" />
        <div className="flex justify-center">
          <div className="flex items-center gap-2 h-10 px-4 bg-primary text-primary-foreground rounded-md">
            <Plus className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// List View Skeleton (for when list view is selected)
export function ProjectListItemSkeleton() {
  return (
    <Card className="cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-1" />
                <Skeleton className="h-4 w-64" />
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>

                <div className="hidden sm:block">
                  <Skeleton className="h-4 w-12" />
                </div>

                <div className="hidden md:block">
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
        </div>
      </CardContent>
    </Card>
  );
}

// Responsive Projects List Skeleton that adapts to screen size
export function ResponsiveProjectsListSkeleton() {
  return (
    <div className="space-y-6 px-4">
      {/* Always show filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search - full width on mobile */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <div className="h-10 pl-10 border-2 bg-[#121212] border-[#262626] rounded-md">
                <Skeleton className="h-full w-full" />
              </div>
            </div>

            {/* Filters - stack on mobile, row on tablet+ */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <div className="flex items-center w-full sm:w-[140px] h-10 border rounded-md px-3">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Skeleton className="h-4 flex-1 sm:w-16" />
                </div>

                <div className="flex items-center w-full sm:w-[130px] h-10 border rounded-md px-3">
                  <Skeleton className="h-4 flex-1 sm:w-20" />
                </div>
              </div>

              <div className="flex gap-0">
                <div className="w-10 h-10 border rounded-l-md">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="flex">
                  <div className="w-10 h-10 border">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <div className="w-10 h-10 border rounded-r-md border-l-0">
                    <Skeleton className="h-full w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Skeleton className="h-4 w-32 sm:w-48" />
          </div>
        </CardContent>
      </Card>

      {/* Responsive grid - 1 column on mobile, 2+ on larger screens */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <ProjectGridCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}