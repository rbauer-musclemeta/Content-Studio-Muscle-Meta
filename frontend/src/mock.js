// Mock data for the newsletter application
// This file contains sample data that will later be replaced with backend integration

export const newsletterIssue = {
  id: "issue-42",
  title: "MetaboFit Weekly",
  subtitle: "Your guide to muscle metabolic health",
  issueNumber: 42,
  date: "February 2024",
  hero: {
    title: "Unlock Your Muscle's Metabolic Potential",
    description: "This week, we're diving deep into the science of muscle metabolic health. Discover evidence-based strategies to optimize your body's energy systems and build lasting strength."
  },
  topics: [
    {
      id: "nutrition",
      title: "Metabolic Nutrition Strategies",
      subtitle: "Fuel your muscles for optimal energy production",
      icon: "Apple",
      sections: [
        {
          title: "Protein Timing & Quality",
          content: "Recent studies show that consuming 25-30g of high-quality protein every 3-4 hours maximizes muscle protein synthesis rates. The key is leucine content - aim for 2.5-3g per meal to trigger the mTOR pathway effectively.",
          highlights: [
            "Whey protein (3.2g per 30g serving)",
            "Chicken breast (2.8g per 100g)", 
            "Greek yogurt (2.1g per cup)",
            "Eggs (1.0g per large egg)"
          ]
        },
        {
          title: "Carbohydrate Periodization",
          content: "Strategic carb intake around workouts enhances muscle glycogen replenishment and metabolic flexibility. The 'fuel for the work required' approach optimizes both performance and body composition."
        },
        {
          title: "Micronutrient Optimization", 
          content: "Magnesium, zinc, and vitamin D play crucial roles in muscle metabolism. Consider supplementation if blood levels are suboptimal, as deficiencies can impair protein synthesis and energy production."
        }
      ]
    },
    {
      id: "exercise",
      title: "Exercise Protocols for Metabolic Health",
      subtitle: "Training strategies that enhance muscle metabolism",
      icon: "Dumbbell",
      sections: [
        {
          title: "High-Intensity Interval Training (HIIT)",
          content: "HIIT protocols boost mitochondrial biogenesis and improve insulin sensitivity more effectively than steady-state cardio. The key is the intensity - aim for 85-95% max heart rate during work intervals.",
          highlights: [
            "Warm-up: 5 minutes easy pace",
            "Work: 30 seconds all-out effort",
            "Rest: 90 seconds easy recovery", 
            "Repeat: 8-12 cycles",
            "Cool-down: 5 minutes easy pace"
          ]
        },
        {
          title: "Resistance Training Variables",
          content: "Progressive overload remains king, but manipulating tempo, rest periods, and training frequency can enhance metabolic adaptations. Focus on compound movements that recruit multiple muscle groups simultaneously."
        },
        {
          title: "Zone 2 Training",
          content: "Long-duration, moderate-intensity exercise (60-70% max HR) improves mitochondrial efficiency and fat oxidation. Aim for 2-3 sessions per week, 45-90 minutes each."
        }
      ]
    },
    {
      id: "recovery", 
      title: "Recovery & Sleep Optimization",
      subtitle: "When muscle building and repair actually happen",
      icon: "Moon",
      sections: [
        {
          title: "Sleep Architecture & Muscle Recovery",
          content: "Deep sleep (Stage 3 NREM) is when growth hormone peaks, driving muscle protein synthesis and tissue repair. Even one night of poor sleep can reduce protein synthesis by up to 18% and increase muscle protein breakdown.",
          highlights: [
            "7-9 hours total sleep time",
            "Room temperature 65-68°F (18-20°C)",
            "Complete darkness (blackout curtains)",
            "No screens 1 hour before bed",
            "Consistent sleep/wake times"
          ]
        },
        {
          title: "Active Recovery Strategies", 
          content: "Light movement on rest days enhances blood flow and nutrient delivery to muscles without adding significant stress. Walking, yoga, or gentle swimming are excellent options."
        },
        {
          title: "Stress Management",
          content: "Chronic stress elevates cortisol, which can impair muscle protein synthesis and promote muscle breakdown. Incorporate stress-reduction techniques like meditation, deep breathing, or nature walks into your routine."
        }
      ]
    }
  ],
  actionItems: {
    quickWins: [
      "Track your protein intake for 3 days using a food app",
      "Set a consistent bedtime and wake time for this week", 
      "Add 10 minutes of walking after lunch daily"
    ],
    weeklyChallenge: [
      "Try one HIIT session using the protocol above",
      "Implement a 30-minute 'digital sunset' before bed",
      "Practice 5 minutes of deep breathing daily"
    ]
  },
  stats: {
    readTime: "8 min read",
    subscribers: "15,247",
    shareCount: 342
  }
};

export const userEngagement = {
  isSubscribed: true,
  hasShared: false,
  completedActions: [],
  readingProgress: 0
};

export const socialLinks = {
  archive: "/archive",
  unsubscribe: "/unsubscribe", 
  forward: "/forward"
};