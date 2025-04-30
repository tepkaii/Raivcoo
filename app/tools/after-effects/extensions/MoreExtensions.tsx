"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { tools } from "../../ToolsPage";

interface MoreExtensionsProps {
  currentId: string;
}

export function MoreExtensions({ currentId }: MoreExtensionsProps) {
  const otherTools = tools.filter((tool) => tool.id !== currentId);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto mt-16 px-4"
    >
      <div className="border-t pt-16">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-light text-muted-foreground md:mb-4 mb-2"
        >
          More Extensions You Might Like:
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/tools/after-effects/extensions/${tool.id}`}
                className="group relative flex flex-col overflow-hidden rounded-lg border bg-card/50 hover:bg-card/80 transition-colors h-full"
              >
                <div
                  className="relative w-full"
                  style={{ paddingTop: "52.5%" }}
                >
                  <Image
                    src={tool.thumbnail}
                    alt={tool.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 33vw"
                  />

                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md rounded-full p-1.5">
                    <Image
                      src={tool.software.icon}
                      alt={tool.software.name}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  </div>
                </div>

                <div className="flex flex-col flex-1 p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="font-medium text-sm line-clamp-1">
                      {tool.title}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                        tool.price === "Free"
                          ? "bg-green-500/10 text-green-500"
                          : "bg-blue-500/10 text-blue-500"
                      }`}
                    >
                      {tool.price}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground min-h-[32px] line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
