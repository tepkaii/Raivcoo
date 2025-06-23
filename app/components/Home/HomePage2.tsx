// app/home/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  ArrowRight,
  Upload,
  MessageCircle,
  Shield,
  Users,
  Mail,
  Clock,
  Star,
} from "lucide-react";
import { RevButtons } from "@/components/ui/RevButtons";
import { BorderTrail } from "@/components/ui/border-trail";
import { GridBackground, Spotlight } from "@/components/ui/spotlight-new";
import { Badge } from "@/components/ui/badge";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Input } from "@/components/ui/input";

export default function HomePage2() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Add your email signup logic here
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden text-foreground">
      <GridBackground />
      <Spotlight />
      <div className="relative z-40">
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4 text-center container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="bg-black/70 mb-6">
              <TextShimmer>🚀 Coming Soon</TextShimmer>
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]"
          >
            Upload. Share. Get Feedback.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mt-6 mb-8"
          >
            The complete video review platform. Upload your videos, images, and
            files directly to our secure servers. Share links with clients and
            get timestamped feedback without any logins required.
          </motion.p>

          {/* Countdown or Launch Date */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-card border border-[#3F3F3F] rounded-xl p-6 max-w-md mx-auto mb-8"
          >
            <div className="flex items-center justify-center gap-2 text-purple-500 mb-2">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">Launching Soon</span>
            </div>
            <p className="text-2xl font-bold">Q1 2025</p>
          </motion.div>

          {/* Email Signup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-md mx-auto"
          >
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email for early access"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                  required
                />
                <RevButtons type="submit" variant="default">
                  <Mail className="h-4 w-4" />
                </RevButtons>
              </form>
            ) : (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-green-400">
                ✅ Thanks! We'll notify you when we launch.
              </div>
            )}
          </motion.div>
        </section>

        {/* Preview Image */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="container mx-auto px-4 pb-16"
        >
          <div className="relative rounded-xl overflow-hidden border border-[#3F3F3F] shadow-2xl max-w-4xl mx-auto">
            <Image
              quality={100}
              priority
              src="/1.png"
              alt="Video Review Dashboard Preview"
              width={1200}
              height={700}
              className="w-full h-auto opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        </motion.section>

        {/* Features Preview */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="py-16 container mx-auto px-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
            What's Coming
          </h2>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Upload className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-2">Direct Upload</h3>
              <p className="text-sm text-muted-foreground">
                Upload videos, images & files directly to secure servers
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-2">Timestamped Comments</h3>
              <p className="text-sm text-muted-foreground">
                Get precise feedback linked to specific moments
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-2">Secure Hosting</h3>
              <p className="text-sm text-muted-foreground">
                Password protection & expiration controls
              </p>
            </div>

            <div className="p-6 rounded-xl border border-[#3F3F3F] bg-card text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-2">No Login Required</h3>
              <p className="text-sm text-muted-foreground">
                Clients can view & comment without accounts
              </p>
            </div>
          </div>
        </motion.section>

        {/* Early Access CTA */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="py-20 container mx-auto px-4"
        >
          <div className="bg-card border-2 border-[#3F3F3F] rounded-xl p-12 max-w-2xl mx-auto text-center relative overflow-hidden">
            <BorderTrail />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
              Be First to Experience the Future
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our early access list and be among the first to try the
              complete file hosting & review platform.
            </p>

            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground mb-8">
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2 text-purple-500" />
                <span>Early access perks</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-purple-500" />
                <span>Lifetime discount</span>
              </div>
              <div className="flex items-center">
                <Upload className="h-4 w-4 mr-2 text-purple-500" />
                <span>Free premium trial</span>
              </div>
            </div>

            {!isSubmitted ? (
              <form
                onSubmit={handleSubmit}
                className="flex gap-2 max-w-sm mx-auto"
              >
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                  required
                />
                <RevButtons type="submit" variant="default">
                  Join Waitlist
                  <ArrowRight className="ml-2 h-4 w-4" />
                </RevButtons>
              </form>
            ) : (
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-green-400">
                🎉 You're on the list! We'll be in touch soon.
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
