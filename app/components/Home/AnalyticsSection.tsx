import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Clock,
  Globe,
  TrendingUp,
  Activity,
  Calendar,
  Smartphone,
  Laptop,
  Hourglass,
  Timer,
  Link,
} from "lucide-react";

const AnalyticsSection = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="w-full px-4 py-16"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="max-w-6xl mx-auto text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
          Understand Your Visitors with Free Analytics
        </h2>
        <p className="text-lg text-muted-foreground">
          Track who's viewing your portfolio, where they're from, and how they
          interact with your content—all for free.
        </p>
      </motion.div>

      {/* Full-Width Responsive Bento Grid Layout */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {/* Total Views */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-background p-6 rounded-lg border col-span-1 sm:col-span-2 min-h-32"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-blue-500 flex-shrink-0" />
            <h3 className="text-lg font-semibold truncate">Total Views</h3>
          </div>
          <p className="text-muted-foreground break-words">
            See how many people have viewed your portfolio over time.
          </p>
        </motion.div>

        {/* Visitor Locations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-background p-6 rounded-lg border min-h-32"
        >
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-purple-500 flex-shrink-0" />
            <h3 className="text-lg font-semibold truncate">
              Visitor Locations
            </h3>
          </div>
          <p className="text-muted-foreground break-words">
            Discover where your visitors are coming from.
          </p>
        </motion.div>

        {/* Recent Visitors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-background p-6 rounded-lg border min-h-32"
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-5 w-5 text-red-500 flex-shrink-0" />
            <h3 className="text-lg font-semibold truncate">Recent Visitors</h3>
          </div>
          <p className="text-muted-foreground break-words">
            View detailed information about your recent visitors.
          </p>
        </motion.div>

        {/* Referral Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="bg-background p-6 rounded-lg border col-span-1 sm:col-span-2 lg:col-span-1 min-h-32"
        >
          <div className="flex items-center gap-3 mb-4">
            <Link className="h-5 w-5 text-teal-500 flex-shrink-0" />
            <h3 className="text-lg font-semibold truncate">Referral Sources</h3>
          </div>
          <p className="text-muted-foreground break-words">
            Track where your visitors are coming from.
          </p>
        </motion.div>

        {/* Device Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-background p-6 rounded-lg border col-span-1 sm:col-span-2 min-h-32"
        >
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="h-5 w-5 text-orange-500 flex-shrink-0" />
            <h3 className="text-lg font-semibold truncate">Device Breakdown</h3>
          </div>
          <p className="text-muted-foreground break-words">
            See what devices your visitors are using to view your portfolio.
          </p>
        </motion.div>

        {/* Traffic Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-background p-6 rounded-lg border col-span-1 sm:col-span-2 min-h-32"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <h3 className="text-lg font-semibold truncate">Traffic Insights</h3>
          </div>
          <p className="text-muted-foreground break-words">
            Monitor traffic patterns and identify peak viewing times.
          </p>
        </motion.div>

        {/* Time & Engagement Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-background p-6 rounded-lg border col-span-1 sm:col-span-2 lg:col-span-4 min-h-32"
        >
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-green-500 flex-shrink-0" />
            <h3 className="text-lg font-semibold truncate">
              Time & Engagement Metrics
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground truncate">
                Time Spent
              </h4>
              <p className="text-sm break-words">
                Track how long visitors spend on your portfolio.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground truncate">
                Engagement Trends
              </h4>
              <p className="text-sm break-words">
                See how your portfolio's engagement changes over time.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground truncate">
                Longest Session
              </h4>
              <p className="text-sm break-words">
                Identify the longest session duration on your portfolio.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground truncate">
                Average Time Per Visit
              </h4>
              <p className="text-sm break-words">
                Calculate the average time spent per visit on your portfolio.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default AnalyticsSection;
