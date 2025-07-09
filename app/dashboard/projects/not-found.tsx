// @/app/dashboard/projects/not-found.tsx
"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <Image
        src="/assets/Project-icon.png"
        alt="Project not found"
        width={200}
        height={200}
        priority
        className="mb-6 transition-all duration-300 w-40 md:w-60  h-auto object-contain select-none pointer-events-none"
        draggable={false}
      />

      <h2 className="text-2xl md:text-4xl font-bold ">Project Not Found</h2>

      <p className="text-muted-foreground text-base md:text-lg mt-2 mb-4 max-w-md">
        The project you are looking for does not exist or may have been removed.
      </p>

      <div className="flex gap-2">
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>

        <Button variant="outline" onClick={() => router.refresh()}>
          Refresh Page
        </Button>
      </div>
    </div>
  );
}
