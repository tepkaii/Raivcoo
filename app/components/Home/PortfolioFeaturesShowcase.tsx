import React from "react";
import { motion } from "framer-motion";
import { TextEffect } from "@/components/ui/text-effect";
import {
  Camera,
  Layers,
  MessageSquare,
  CreditCard,
  Film,
  HeartHandshake,
  Settings,
  Palette,
  Globe,
  GitCompare,
  Lock,
  BookOpen,
  LayoutDashboard,
  Video,
  Users,
  DollarSign,
  Star,
  UserCheck,
  FileText,
} from "lucide-react";

const PortfolioFeaturesShowcase = () => {
  const features = [
    {
      icon: <Film className="h-8 w-8 text-blue-500" />,
      title: "Video Showcase",
      description:
        "Upload and organize your best work with custom descriptions and categories",
    },
    {
      icon: <GitCompare className="h-8 w-8 text-purple-500" />,
      title: "Before & After",
      description:
        "Demonstrate your editing skills with interactive before/after comparisons",
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-green-500" />,
      title: "Client Testimonials",
      description:
        "Display testimonials from satisfied clients to build credibility",
    },
    {
      icon: <CreditCard className="h-8 w-8 text-orange-500" />,
      title: "Pricing Tiers",
      description:
        "Create custom pricing packages with detailed service descriptions",
    },
    {
      icon: <HeartHandshake className="h-8 w-8 text-red-500" />,
      title: "Worked With",
      description: "Showcase brands and clients you've collaborated with",
    },
    {
      icon: <Layers className="h-8 w-8 text-yellow-500" />,
      title: "FAQs Section",
      description: "Answer common questions about your services and workflow",
    },
    {
      icon: <Globe className="h-8 w-8 text-cyan-500" />,
      title: "Social Media",
      description:
        "Connect all your platforms in one place for easy client access",
    },
    {
      icon: <Palette className="h-8 w-8 text-pink-500" />,
      title: "Custom Design",
      description:
        "Personalize colors, fonts, and backgrounds to match your brand",
    },
    {
      icon: <Camera className="h-8 w-8 text-indigo-500" />,
      title: "OG Image",
      description:
        "Create professional link previews when sharing your portfolio",
    },
    {
      icon: <Settings className="h-8 w-8 text-slate-500" />,
      title: "Portfolio Layout",
      description:
        "Customize your portfolio layout by hiding sections, creating tabs, and rearranging content",
    },
    {
      icon: <Lock className="h-8 w-8 text-blue-500" />,
      title: "Password Protection",
      description:
        "Secure your portfolio with password protection to control access",
    },
    {
      icon: <BookOpen className="h-8 w-8 text-purple-500" />,
      title: "Favicon",
      description:
        "Add a custom favicon to your portfolio for a professional touch",
    },
    {
      icon: <Video className="h-8 w-8 text-green-500" />,
      title: "Communication Preferences",
      description:
        "Set your preferred communication methods like call, video call, or chat",
    },

    {
      icon: <DollarSign className="h-8 w-8 text-red-500" />,
      title: "Payment Methods",
      description:
        "Offer multiple payment options for your clients' convenience",
    },
  ];

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
        <h2 className="text-3xl md:text-4xl font-bold tracking-tighter mb-4 text-transparent bg-clip-text dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.00)_202.08%)]">
          Everything You Need, All in One Place
        </h2>
        <p className="text-lg text-muted-foreground">
          <TextEffect per="word" as="span" preset="slide">
            Customizable components designed specifically for video editors to
            showcase their work professionally
          </TextEffect>
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            className="bg-background p-6 rounded-lg border hover:border-blue-500 transition-all duration-300 hover:shadow-md group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-primary-foreground group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
            </div>
            <p className="text-muted-foreground">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default PortfolioFeaturesShowcase;
