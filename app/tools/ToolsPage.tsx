"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const tools = [
  {
    id: "layer-flow",
    title: "Layer Flow",
    description: "Powerful layer management and automation tools",
    category: "layer management",
    price: "25$",
    downloads: 0,
    thumbnail: "/extension/layerFlow-1-v2.png",
    software: {
      icon: "/app/Adobe After Effects.png",
      name: "After Effects",
    },
  },
  {
    id: "shape-manager",
    title: "Shape Manager",
    description:
      "Save and organize After Effects shapes into collections for quick access",
    category: "shape management",
    price: "Free",
    downloads: 21,
    thumbnail: "/extension/ShapeManager/Shape Manager.png",
    software: {
      icon: "/app/Adobe After Effects.png",
      name: "After Effects",
    },
  },
  {
    id: "re-duplicate",
    title: "Re-Duplicate",
    description: "Layer Duplication Tool for After Effects",
    price: "Free",
    downloads: 12,
    thumbnail: "/extension/re-duplicate/re-duplicate.png",
    software: {
      icon: "/app/Adobe After Effects.png",
      name: "After Effects",
    },
  },
  {
    id: "label-color-picker",
    title: "Label Color Picker",
    description:
      "Simple and efficient color labeling system with 16 preset colors and random assignment functionality",
    category: "layer management",
    price: "Free",
    downloads: 7,
    thumbnail: "/extension/labelColorPicker.png",
    software: {
      icon: "/app/Adobe After Effects.png",
      name: "After Effects",
    },
  },
  {
    id: "re-align",
    title: "Re-Align",
    description: "Algin layers and anchor points position easily",
    category: "alignment",
    price: "Free",
    downloads: 115,
    thumbnail: "/extension/realign/ReAlign.png",
    software: {
      icon: "/app/Adobe After Effects.png",
      name: "After Effects",
    },
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen flex justify-center">
      <main className="pb-12 md:pb-16 relative z-10 space-y-16 mt-28">
        <section className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-normal tracking-tighter lg:text-5xl text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
                Tools and Resources
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mt-4">
                Explore our latest tools and resources for video editors
              </p>
            </div>
          </motion.div>
        </section>

        <section className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col w-full rounded-xl border bg-card shadow-md hover:shadow-lg relative"
              >
                {/* Software Icon Badge and Downloads */}
                <div className="absolute flex items-center gap-1 top-4 right-4 z-10">
                  <div className="bg-black/50 backdrop-blur-md rounded-[10px] py-1 px-1 inline-flex items-center">
                    <Image
                      src={tool.software.icon}
                      alt={tool.software.name}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                    {/* <span className="text-xs text-white ml-1">
                      {tool.software.name}
                    </span> */}
                  </div>
                  {tool.downloads > 0 && (
                    <div className="bg-black/50 backdrop-blur-md rounded-[10px] py-1 px-2 inline-flex items-center">
                      <span className="text-xs text-white">
                        {tool.downloads.toLocaleString()} downloads
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="relative w-full"
                  style={{ paddingTop: "52.5%" }}
                >
                  <Image
                    src={tool.thumbnail}
                    alt={tool.title}
                    fill
                    className="object-cover rounded-t-xl"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                <div className="flex flex-col flex-1 p-6">
                  <h3 className="text-2xl font-bold mb-2 line-clamp-1">
                    {tool.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {tool.description}
                  </p>
                  <div className="flex justify-between items-center gap-4 mt-auto">
                    <Link
                      href={`/tools/after-effects/extensions/${tool.id}`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        className="w-full hover:scale-[1.02] transition-transform duration-200"
                      >
                        {tool.price === "Free" ? "Download Free" : "Learn More"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant={tool.price === "Free" ? "green" : "default"}
                      className="text-sm font-medium "
                    >
                      {tool.price}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <AnimatedGridPattern
        numSquares={60}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(1200px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-14%] h-[120%] skew-y-12"
        )}
      />
    </div>
  );
}