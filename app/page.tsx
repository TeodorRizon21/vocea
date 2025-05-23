import { prisma } from "@/lib/prisma";
import UserProfile from "@/components/UserProfile";
import NewsCarousel from "@/components/NewsCarousel";
import AboutUs from "@/components/AboutUs";
import HomeContent from "@/components/HomeContent";
import { Metadata } from "next";

// Define the News type to match what NewsCarousel expects
interface News {
  id: string;
  title: string;
  description: string;
  image: string;
  university?: string;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const metadata: Metadata = {
  title: "Acasă | Vocea Campusului - Locul ideilor studențești",
  description: "Bine ai venit la Vocea Campusului! Descoperă și partajează resurse academice, proiecte și materiale de studiu într-o comunitate studențească vibrantă.",
  openGraph: {
    title: "Acasă | Vocea Campusului - Locul ideilor studențești",
    description: "Bine ai venit la Vocea Campusului! Descoperă și partajează resurse academice, proiecte și materiale de studiu într-o comunitate studențească vibrantă.",
  },
  twitter: {
    title: "Acasă | Vocea Campusului - Locul ideilor studențești",
    description: "Bine ai venit la Vocea Campusului! Descoperă și partajează resurse academice, proiecte și materiale de studiu într-o comunitate studențească vibrantă.",
  }
}

async function getNews() {
  try {
    const news = await prisma.news.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the news data to ensure image is never null and university is undefined instead of null
    return news.map((item) => ({
      ...item,
      image: item.image || "/placeholder.svg?key=mgnk0",
      university: item.university || undefined,
    })) as News[];
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

export default async function Home() {
  const news = await getNews();

  return <HomeContent news={news} />;
}
