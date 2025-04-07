// @ts-nocheck
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check, X } from "lucide-react";
import { featuresData, platforms } from "./featuresData";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const ComparisonSection = () => {
  // Helper function to render feature status
  const renderStatus = (status, highlight) => {
    if (status === "Free") {
      return (
        <div
          className={`flex items-center justify-center ${
            highlight ? "text-green-500 font-medium" : "text-green-500"
          }`}
        >
          <span className="text-sm">Free</span>
        </div>
      );
    }
    if (status === "No") return <X className="h-5 w-5 mx-auto text-red-500" />;
    if (status === "Paid")
      return <span className="text-orange-500 text-sm font-medium">Paid</span>;
    if (status === "Limited")
      return (
        <span className="text-yellow-500 text-sm font-medium">Limited</span>
      );
    if (status === "Custom")
      return <span className="text-blue-500 text-sm font-medium">Custom</span>;
    return <span className="text-muted-foreground">-</span>;
  };

  // Count free features per platform
  const freeFeatureCounts = platforms.reduce((acc, platform) => {
    acc[platform.id] = featuresData.filter(
      (feature) => feature[platform.id]?.status === "Free"
    ).length;
    return acc;
  }, {});

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-4xl mx-auto text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 bg-gradient-to-b from-foreground to-muted-foreground/70 bg-clip-text text-transparent">
          Premium Features for Video Creators
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          See how Raivcoo outperforms other portfolio platforms for professional
          video creators
        </p>
      </motion.div>

      {/* Comparison Table */}
      <div className="w-full max-w-4xl mx-auto select-none ">
        <div className=" relative h-full p-3  rounded-xl border border-border bg-card">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <table className="w-full min-w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 text-left font-medium text-muted-foreground w-1/4 border-r border-border">
                  Feature
                </th>
                {platforms.map((platform, index) => (
                  <th
                    key={platform.id}
                    className={`p-4 text-center font-medium ${
                      platform.isPrimary
                        ? "text-primary"
                        : "text-muted-foreground"
                    } ${
                      index < platforms.length - 1
                        ? "border-r border-border/50"
                        : ""
                    }`}
                  >
                    {platform.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featuresData.map((feature, index) => (
                <motion.tr
                  key={feature.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.05 * index }}
                  className="border-b border-border/50 hover:bg-accent/10 transition-colors"
                >
                  <td className="p-4 text-card-foreground border-r border-border/50">
                    {feature.name}
                  </td>
                  {platforms.map((platform, pIndex) => (
                    <td
                      key={`${feature.id}-${platform.id}`}
                      className={`p-4 text-center ${
                        platform.isPrimary &&
                        feature[platform.id].status === "Free"
                          ? "bg-accent/20"
                          : ""
                      } ${
                        pIndex < platforms.length - 1
                          ? "border-r border-border/50 "
                          : ""
                      }`}
                    >
                      {renderStatus(
                        feature[platform.id].status,
                        feature[platform.id].highlight
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground p-5 rounded-xl bg-card/50 border border-border">
          <div className="flex items-center gap-1">
            <Check className="h-4 w-4 text-green-500" />
            <span className="text-green-500 font-medium">Free</span>
            <span>- Included at no cost</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-orange-500 font-medium">Paid</span>
            <span>- Requires premium plan</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-yellow-500 font-medium">Limited</span>
            <span>- Basic functionality only</span>
          </div>
          <div className="flex items-center gap-1">
            <X className="h-4 w-4 text-red-500" />
            <span>- Not available</span>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Link href="/signup">
            <Button variant="blue_plus" size="lg">
              Create Your Professional Portfolio
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="mt-4 text-muted-foreground">
            No credit card required • Free plan available
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default ComparisonSection;
