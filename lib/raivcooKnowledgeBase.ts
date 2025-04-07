// lib/raivcooKnowledgeBase.ts
export const RAIVCOO_KNOWLEDGE = {
  profileFields: {
    fullName: {
      description: "Your complete name as a video editor",
      requirements: "5-30 characters",
      tips: [
        "Use your real professional name",
        "Avoid special characters",
        "Keep it professional and memorable",
      ],
    },
    displayName: {
      description: "Your public display name on Raivcoo",
      requirements: "3-20 characters",
      tips: [
        "Can be your brand name",
        "Should be unique",
        "Easy to remember and type",
      ],
    },
    biography: {
      description: "Your professional video editing story",
      requirements: "10-500 characters",
      tips: [
        "Highlight your specialties",
        "Mention years of experience",
        "Include types of projects you work on",
        "List notable achievements",
      ],
    },
    videoCategories: {
      best: "Your highest quality work samples",
      preferred: "Videos matching your preferred genres",
      other: "Additional portfolio pieces",
    },
    pricingTiers: {
      structure: [
        "Base price per project/hour/minute",
        "Project length constraints",
        "Number of revisions",
        "Included features",
      ],
      tips: [
        "Offer clear value progression",
        "Be specific about deliverables",
        "Include revision policies",
        "Consider market rates",
      ],
    },
  },

  portfolioSetup: {
    introVideo: {
      requirements: "YouTube or Google Drive link",
      tips: [
        "Keep it under 2 minutes",
        "Show personality and skills",
        "Include work samples",
        "Clearly state services",
      ],
    },
    videoSamples: {
      maxCount: 15,
      requirements: {
        formats: ["YouTube", "Google Drive", "Vimeo"],
        quality: "High resolution, well-edited",
        variety: "Show range of skills",
      },
    },
    beforeAfter: {
      purpose: "Demonstrate editing impact",
      maxComparisons: 5,
      tips: [
        "Show dramatic transformations",
        "Include different styles",
        "Explain the changes",
      ],
    },
  },

  communicationPreferences: {
    availability: {
      options: ["Available for hire", "Not available"],
      tips: ["Keep status updated", "Set clear response times"],
    },
    paymentMethods: {
      supported: [
        "PayPal",
        "Bank Transfer",
        "Stripe",
        "Other payment platforms",
      ],
    },
  },
};
