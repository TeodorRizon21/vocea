import { prisma } from "@/lib/prisma";
import UserProfile from "@/components/UserProfile";
import NewsCarousel from "@/components/NewsCarousel";
import AboutUs from "@/components/AboutUs";

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

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">Vocea campusului</h1>
        <UserProfile />
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Latest News</h2>
        <NewsCarousel news={news} />
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">About Us</h2>
        <AboutUs />
      </section>
    </div>
  );
}
