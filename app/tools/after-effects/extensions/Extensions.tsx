"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { TextureButton } from "@/components/ui/texture-button";
import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { tools } from "../../ToolsPage";

export default function ExtensionsQ() {
  return (
    <div className="min-h-screen flex justify-center">
      <main className="pb-12 md:pb-16 relative z-10 space-y-16 mt-16">
        {/* Hero section stays the same */}

        <section className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((extension, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col w-full  rounded-xl border bg-card shadow-md hover:shadow-lg"
              >
                <div
                  className="relative w-full"
                  style={{ paddingTop: "52.5%" }}
                >
                  {" "}
                  {/* 630/1200 = 0.525 */}
                  <Image
                    src={extension.thumbnail}
                    alt={extension.title}
                    fill
                    className="object-cover rounded-t-xl"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>

                <div className="flex flex-col flex-1 p-6">
                  <h3 className="text-2xl font-bold mb-2 line-clamp-1">
                    {extension.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">
                    {extension.description}
                  </p>
                  <div className="flex justify-between items-center gap-4 mt-auto">
                    <Link
                      href={`/tools/after-effects/extensions/${extension.id}`}
                      className="flex-1"
                    >
                      <TextureButton
                        variant="primary"
                        className="w-full hover:scale-[1.02] transition-transform duration-200"
                      >
                        {extension.price === "Free"
                          ? "Download Free"
                          : "Learn More"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </TextureButton>
                    </Link>
                    <TextureButton
                      variant={extension.price === "Free" ? "green" : "blue"}
                      className={`text-sm font-medium  rounded-full 
                       `}
                    >
                      {extension.price}
                    </TextureButton>
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
