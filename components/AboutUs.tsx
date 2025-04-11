"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useAnimation,
  AnimatePresence,
} from "framer-motion";
import {
  Users,
  Newspaper,
  Share2,
  MessageSquare,
  Lightbulb,
  GraduationCap,
  Building2,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Users,
    title: "Student Community",
    description:
      "Connect with fellow students across different universities and departments.",
    color: "bg-blue-500",
  },
  {
    icon: Share2,
    title: "Project Sharing",
    description:
      "Share your academic projects, research work, and creative endeavors with peers.",
    color: "bg-purple-500",
  },
  {
    icon: MessageSquare,
    title: "Open Discussions",
    description:
      "Engage in meaningful discussions about academic and campus life topics.",
    color: "bg-green-500",
  },
  {
    icon: Newspaper,
    title: "Campus News",
    description:
      "Stay updated with the latest news and events from your university.",
    color: "bg-red-500",
  },
];

const stats = [
  {
    icon: Building2,
    value: "15+",
    label: "Universities",
    color: "bg-indigo-500",
  },
  {
    icon: GraduationCap,
    value: "10k+",
    label: "Students",
    color: "bg-pink-500",
  },
  {
    icon: Lightbulb,
    value: "5k+",
    label: "Projects",
    color: "bg-yellow-500",
  },
  {
    icon: Trophy,
    value: "500+",
    label: "Success Stories",
    color: "bg-emerald-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.9 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

export default function AboutUs() {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  return (
    <div className="space-y-16 px-4" ref={ref}>
      <motion.div
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
      >
        {features.map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-full overflow-hidden"
          >
            <Card className="group h-full backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-500">
              <CardContent className="p-6">
                <motion.div
                  className="flex items-center space-x-4"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <motion.div className={`${feature.color} p-3 rounded-xl`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <div className="space-y-2">
                    <motion.h3
                      className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent"
                      whileHover={{ scale: 1.02 }}
                    >
                      {feature.title}
                    </motion.h3>
                    <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        className="grid grid-cols-2 md:grid-cols-4 gap-6"
      >
        <AnimatePresence>
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden"
            >
              <Card className="group overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 sm:p-6 text-center relative z-10">
                  <motion.div
                    className={`${stat.color} p-3 rounded-full w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center`}
                  >
                    <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="space-y-1 sm:space-y-2"
                  >
                    <motion.h3
                      className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent"
                      whileHover={{ scale: 1.05 }}
                    >
                      {stat.value}
                    </motion.h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                      {stat.label}
                    </p>
                  </motion.div>
                </CardContent>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={false}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={controls}
        variants={{
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.8,
              ease: "easeOut",
            },
          },
        }}
        className="text-center space-y-6 max-w-3xl mx-auto pb-4"
      >
        <motion.h2
          className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent"
          whileHover={{ scale: 1.02 }}
        >
          Join Our Growing Community
        </motion.h2>
        <motion.p
          className="text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Vocea Campusului is more than just a platform - it&apos;s a vibrant
          community of students, researchers, and innovators. Whether
          you&apos;re looking to showcase your work, collaborate on projects, or
          stay informed about campus life, we&apos;re here to amplify your voice
          and connect you with like-minded peers.
        </motion.p>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block relative"
        >
          <div className="relative inline-flex group">
            <div className="absolute -inset-px bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
            <button className="relative px-6 sm:px-8 py-3 sm:py-4 bg-white dark:bg-gray-800 rounded-lg leading-none flex items-center">
              <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent font-bold text-base sm:text-lg">
                Get Started Today
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
