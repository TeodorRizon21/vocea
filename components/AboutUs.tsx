"use client";

import { useEffect, useRef, useMemo } from "react";
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
import { useLanguage } from "@/components/LanguageToggle";
import { useRouter } from "next/navigation";

export default function AboutUs() {
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { language, forceRefresh } = useLanguage();
  const router = useRouter();

  // Traduceri pentru caracteristici și statistici
  const translations = {
    ro: {
      features: [
        {
          icon: Users,
          title: "Comunitate Studențească",
          description:
            "Conectează-te cu alți studenți din diferite universități și departamente.",
          color: "bg-blue-500",
        },
        {
          icon: Share2,
          title: "Partajare Proiecte",
          description:
            "Împărtășește proiecte academice, cercetări și creații cu colegii tăi.",
          color: "bg-purple-500",
        },
        {
          icon: MessageSquare,
          title: "Discuții Deschise",
          description:
            "Implică-te în discuții semnificative despre teme academice și viața de campus.",
          color: "bg-green-500",
        },
        {
          icon: Newspaper,
          title: "Știri din Campus",
          description:
            "Rămâi la curent cu cele mai recente știri și evenimente din universitatea ta.",
          color: "bg-red-500",
        },
      ],
      stats: [
        {
          icon: Building2,
          value: "80+",
          label: "Universități",
          color: "bg-indigo-500",
        },
        {
          icon: GraduationCap,
          value: "5000+",
          label: "Studenți",
          color: "bg-pink-500",
        },
        {
          icon: Lightbulb,
          value: "Mii de ",
          label: "Proiecte",
          color: "bg-yellow-500",
        },
        {
          icon: Trophy,
          value: "Nenumărate",
          label: "Povești de Succes",
          color: "bg-emerald-500",
        },
      ],
      community: {
        title: "Alătură-te Comunității Noastre în Creștere",
        description: "Vocea Campusului este mai mult decât o platformă - este o comunitate vibrantă de studenți, cercetători și inovatori. Fie că dorești să îți prezinți munca, să colaborezi la proiecte sau să fii la curent cu viața din campus, suntem aici pentru a-ți amplifica vocea și a te conecta cu colegi care împărtășesc aceleași interese.",
        button: "Începe Astăzi"
      }
    },
    en: {
      features: [
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
      ],
      stats: [
        {
          icon: Building2,
          value: "80+",
          label: "Universities",
          color: "bg-indigo-500",
        },
        {
          icon: GraduationCap,
          value: "5000+",
          label: "Students",
          color: "bg-pink-500",
        },
        {
          icon: Lightbulb,
          value: "Thousands of",
          label: "Projects",
          color: "bg-yellow-500",
        },
        {
          icon: Trophy,
          value: "Countless",
          label: "Success Stories",
          color: "bg-emerald-500",
        },
      ],
      community: {
        title: "Join Our Growing Community",
        description: "Vocea Campusului is more than just a platform - it's a vibrant community of students, researchers, and innovators. Whether you're looking to showcase your work, collaborate on projects, or stay informed about campus life, we're here to amplify your voice and connect you with like-minded peers.",
        button: "Get Started Today"
      }
    },
  };

  // Selectează traducerile în funcție de limba curentă folosind useMemo
  const content = useMemo(() => {
    return translations[language as keyof typeof translations];
  }, [language, forceRefresh]);

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

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [controls, isInView]);

  const handleGetStarted = () => {
    router.push("/subscriptions");
  };

  // Feature click handlers
  const featureRoutes = [
    "/dashboard", // Comunitate Studenteasca
    "/browse",    // Partajare Proiecte
    "/forum",     // Discutii deschise
    "#news"       // Stiri din campus
  ];

  return (
    <div className="space-y-16 px-4" ref={ref}>
      <motion.div
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {content.features.map((feature, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="h-full overflow-hidden max-w-2xl mx-auto w-full cursor-pointer"
            onClick={() => {
              if (index === 3) {
                window.scrollTo({ top: 0, behavior: "smooth" });
              } else {
                router.push(featureRoutes[index]);
              }
            }}
          >
            <Card className="group h-full backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-500">
              <CardContent className="p-4 sm:p-6">
                <motion.div
                  className="flex items-start space-x-4"
                  initial={{ x: -20 }}
                  animate={{ x: 0 }}
                  transition={{ delay: index * 0.2 }}
                >
                  <motion.div className={`${feature.color} p-2 sm:p-3 rounded-xl flex-shrink-0`}>
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <motion.h3
                      className="text-base sm:text-lg xl:text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent break-words"
                      whileHover={{ scale: 1.02 }}
                    >
                      {feature.title}
                    </motion.h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 transition-colors duration-300 break-words">
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
        className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 xs:gap-4 sm:gap-6"
      >
        <AnimatePresence>
          {content.stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden"
            >
              <Card className="group overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-3 xs:p-4 sm:p-6 text-center relative z-10">
                  <motion.div
                    className={`${stat.color} p-2 xs:p-3 rounded-full w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 mx-auto mb-2 xs:mb-3 sm:mb-4 flex items-center justify-center`}
                  >
                    <stat.icon className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="space-y-0.5 xs:space-y-1 sm:space-y-1.5"
                  >
                    <motion.h3
                      className="text-base xs:text-lg sm:text-xl xl:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent break-words"
                      whileHover={{ scale: 1.05 }}
                    >
                      {stat.value}
                    </motion.h3>
                    <p className="text-xs xs:text-sm sm:text-base text-gray-600 dark:text-gray-300 break-words">
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
          className="text-2xl xs:text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent"
          whileHover={{ scale: 1.02 }}
        >
          {content.community.title}
        </motion.h2>
        <motion.p
          className="text-sm xs:text-base sm:text-lg text-gray-600 dark:text-gray-300 leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {content.community.description}
        </motion.p>
        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block relative"
        >
          <div className="relative inline-flex group cursor-pointer" onClick={handleGetStarted}>
            <div className="absolute -inset-px bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
            <button className="relative px-4 xs:px-6 sm:px-8 py-2 xs:py-3 sm:py-4 bg-white dark:bg-gray-800 rounded-lg leading-none flex items-center">
              <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent font-bold text-sm xs:text-base sm:text-lg">
                {content.community.button}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
