"use client";

import { Button } from "@/components/ui/button";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import UserProfile from "@/components/UserProfile";
import ForumTabs from "@/components/ForumTabs";
import CreateTopicButton from "@/components/CreateTopicButton";
import TopicList from "@/components/TopicList";
import SearchBar from "@/components/SearchBar";
import SortButton from "@/components/SortButton";
import FilterButton from "@/components/FilterButton";
import ForumFilterDialog from "@/components/ForumFilterDialog";
import { useUniversities } from "@/hooks/useUniversities";
import type { ForumTopic } from "@prisma/client";
import { useLanguage } from "@/components/LanguageToggle";

const tabsData = [
  { id: "toate", label: "Toate subiectele" },
  { id: "favorite", label: "Subiecte favorite" },
  { id: "mele", label: "Subiectele mele" },
];

type OmitDate = Omit<ForumTopic, "createdAt" | "updatedAt">;
interface ExtendedForumTopic extends OmitDate {
  user: {
    firstName: string | null;
    lastName: string | null;
    university: string | null;
    faculty: string | null;
    avatar?: string | null;
  };
  comments: any[];
  isFavorited: boolean;
  isOwner: boolean;
  favorites: string[];
  createdAt: string;
  updatedAt: Date;
  universityName?: string;
  facultyName?: string;
}

export default function ForumPage() {
  const router = useRouter();
  const { user } = useUser();
  const { getUniversityName, getFacultyName, universities, faculties } = useUniversities();
  const { language, forceRefresh } = useLanguage();

  // Translations for the page with useMemo
  const translations = useMemo(() => {
    return {
      forumTitle: language === "ro" ? "Forum" : "Forum",
      allTopics: language === "ro" ? "Toate subiectele" : "All topics",
      favoriteTopics:
        language === "ro" ? "Subiecte favorite" : "Favorite topics",
      myTopics: language === "ro" ? "Subiectele mele" : "My topics",
      noTopicsFound:
        language === "ro"
          ? "Nu au fost găsite subiecte care să corespundă criteriilor de căutare"
          : "No topics found matching your search criteria",
      clearFilters:
        language === "ro" ? "Șterge toate filtrele" : "Clear all filters",
      createNewTopic: language === "ro" ? "Creează un subiect nou" : "Create a new topic",
    };
  }, [language, forceRefresh]);

  const tabsDataWithTranslations = useMemo(
    () => [
      { id: "toate", label: translations.allTopics },
      { id: "favorite", label: translations.favoriteTopics },
      { id: "mele", label: translations.myTopics },
    ],
    [translations]
  );

  const [activeTab, setActiveTab] = useState("toate");
  const [searchQuery, setSearchQuery] = useState("");
  const [topics, setTopics] = useState<ExtendedForumTopic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<ExtendedForumTopic[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    university: "",
    faculty: "",
    category: "",
    city: "",
  });
  const [userPlan, setUserPlan] = useState("Basic");

  useEffect(() => {
    fetchTopics();
    fetchUserPlan();
  }, []);

  const fetchUserPlan = async () => {
    if (user?.id) {
      try {
        const response = await fetch(`/api/user`);
        if (response.ok) {
          const userData = await response.json();
          setUserPlan(userData.planType || "Basic");
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
      }
    }
  };

  const filterTopics = useCallback(() => {
    let filtered = [...topics];

    // Filter by tab
    if (activeTab === "mele" && user?.id) {
      filtered = filtered.filter((topic) => topic.userId === user.id);
    } else if (activeTab === "favorite" && user?.id) {
      filtered = filtered.filter((topic) => topic.favorites.includes(user.id));
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (topic) =>
          topic.title.toLowerCase().includes(query) ||
          topic.content.toLowerCase().includes(query) ||
          (topic.universityName &&
            topic.universityName.toLowerCase().includes(query)) ||
          (topic.facultyName && topic.facultyName.toLowerCase().includes(query))
      );
    }

    // Filter by university
    if (filters.university && filters.university !== "") {
      filtered = filtered.filter((topic) => {
        const university = universities.find(u => u.id === filters.university);
        return university && topic.university === university.name;
      });
    }

    // Filter by faculty
    if (filters.faculty && filters.faculty !== "") {
      filtered = filtered.filter((topic) => {
        const faculty = faculties.find(f => f.id === filters.faculty);
        return faculty && topic.faculty === faculty.name;
      });
    }

    // Filter by city - using the university's city
    if (filters.city && filters.city !== "") {
      filtered = filtered.filter((topic) => {
        const university = universities.find(u => u.name === topic.university);
        return university?.city === filters.city;
      });
    }

    // Filter by category
    if (filters.category && filters.category !== "") {
      filtered = filtered.filter((topic) => topic.category === filters.category);
    }

    setFilteredTopics(filtered);
  }, [activeTab, searchQuery, topics, user?.id, filters, universities, faculties]);

  useEffect(() => {
    filterTopics();
  }, [filterTopics]);

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/forum");
      if (response.ok) {
        const data = await response.json();
        setTopics(data);
        setFilteredTopics(data);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (topicId: string) => {
    try {
      const response = await fetch(`/api/forum/${topicId}/favorite`, {
        method: "POST",
      });

      if (response.ok) {
        const { isFavorited } = await response.json();
        setTopics((prevTopics) =>
          prevTopics.map((topic) =>
            topic.id === topicId ? { ...topic, isFavorited } : topic
          )
        );
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleDelete = async (topicId: string) => {
    try {
      const response = await fetch(`/api/forum/${topicId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setTopics((prevTopics) =>
          prevTopics.filter((topic) => topic.id !== topicId)
        );
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSort = () => {
    const sorted = [...filteredTopics].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    setFilteredTopics(sorted);
  };

  const handleFilter = () => {
    setIsFilterDialogOpen(true);
  };

  const handleApplyFilters = useCallback(
    (newFilters: { university: string; faculty: string; category: string; city: string }) => {
      setFilters(newFilters);
      setIsFilterDialogOpen(false);
    },
    []
  );

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(
    (value) => value && value !== ""
  ).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:px-4 md:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-4">
        <div className="flex flex-col items-center sm:items-start w-full sm:w-auto order-2 sm:order-1">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600 text-center sm:text-left">
            {translations.forumTitle}
          </h1>
        </div>
        <div className="w-full sm:w-auto order-1 sm:order-2">
          <UserProfile />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <SearchBar onSearch={handleSearch} />
          <SortButton onSort={handleSort} />
          <FilterButton
            onFilter={handleFilter}
            activeFiltersCount={activeFiltersCount}
          />
        </div>
        <CreateTopicButton 
          onClick={() => router.push("/forum/new")} 
          userPlan={userPlan}
        />
      </div>

      <ForumTabs
        tabs={tabsDataWithTranslations}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <TopicList
          topics={filteredTopics}
          onFavoriteToggle={handleFavoriteToggle}
          onDelete={handleDelete}
          userPlan={userPlan}
        />
      )}

      <ForumFilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
    </div>
  );
}
