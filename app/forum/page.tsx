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

export default function ForumPage() {
  const router = useRouter();
  const { user } = useUser();
  const { getUniversityName, getFacultyName } = useUniversities();
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru pagina cu useMemo
  const translations = useMemo(() => {
    return {
      forumTitle: language === "ro" ? "Forum" : "Forum",
      allTopics: language === "ro" ? "Toate subiectele" : "All topics",
      favoriteTopics:
        language === "ro" ? "Subiecte favorite" : "Favorite topics",
      myTopics: language === "ro" ? "Subiectele mele" : "My topics",
    };
  }, [language, forceRefresh]);

  // Actualizarea taburilor cu traducerile corespunzătoare
  const tabsData = useMemo(
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
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filters, setFilters] = useState({
    university: "",
    faculty: "",
    category: "",
  });
  const [userPlan, setUserPlan] = useState("Basic");

  type OmitDate = Omit<ForumTopic, "createdAt" | "updatedAt">;
  interface ExtendedForumTopic extends OmitDate {
    user: {
      firstName: string | null;
      lastName: string | null;
      university: string | null;
      faculty: string | null;
      avatar?: string | null;
      universityName?: string | null;
      facultyName?: string | null;
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

  // Adăugăm funcții pentru debug
  const logTopicDetails = (topic: ExtendedForumTopic) => {
    console.log("Topic filtering details:", {
      id: topic.id,
      title: topic.title,
      university: topic.university,
      faculty: topic.faculty,
      universityName: topic.universityName,
      facultyName: topic.facultyName,
      filter_university: filters.university,
      filter_faculty: filters.faculty,
    });
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

    // Logăm primele 3 topicuri pentru debug
    if (filtered.length > 0 && filters.university) {
      console.log("Primele topicuri înainte de filtrare:");
      for (let i = 0; i < Math.min(3, filtered.length); i++) {
        logTopicDetails(filtered[i]);
      }
    }

    // Filter by university
    if (filters.university && filters.university !== "") {
      console.log("Filtering by university ID:", filters.university);
      filtered = filtered.filter((topic) => {
        // Încercăm mai multe posibilități de potrivire
        const matchesId = topic.university === filters.university;
        const matchesName =
          topic.universityName === getUniversityName(filters.university);

        // Log pentru depanare
        if (matchesId || matchesName) {
          console.log("Found match for university:", {
            topicUniversity: topic.university,
            filterUniversity: filters.university,
            topicUniversityName: topic.universityName,
            filterUniversityName: getUniversityName(filters.university),
          });
        }

        return matchesId || matchesName;
      });
    }

    // Filter by faculty
    if (filters.faculty && filters.faculty !== "") {
      console.log("Filtering by faculty ID:", filters.faculty);
      filtered = filtered.filter((topic) => {
        // Încercăm mai multe posibilități de potrivire
        const matchesId = topic.faculty === filters.faculty;
        const matchesName =
          topic.facultyName ===
          getFacultyName(
            filters.university || topic.university,
            filters.faculty
          );

        // Log pentru depanare
        if (matchesId || matchesName) {
          console.log("Found match for faculty:", {
            topicFaculty: topic.faculty,
            filterFaculty: filters.faculty,
            topicFacultyName: topic.facultyName,
            filterFacultyName: getFacultyName(
              filters.university || topic.university,
              filters.faculty
            ),
          });
        }

        return matchesId || matchesName;
      });
    }

    // Logăm rezultatele filtrării pentru debug
    if (filtered.length > 0 && (filters.university || filters.faculty)) {
      console.log("Rezultate după filtrare:", filtered.length);
      if (filtered.length > 0) {
        logTopicDetails(filtered[0]);
      }
    }

    // Filter by category
    if (filters.category && filters.category !== "") {
      filtered = filtered.filter(
        (topic) => topic.category === filters.category
      );
    }

    console.log("Filtered topics:", filtered.length);
    setFilteredTopics(filtered);
  }, [activeTab, searchQuery, topics, user?.id, filters]);

  useEffect(() => {
    filterTopics();
  }, [filterTopics]);

  // Funcție pentru verificarea tuturor topicurilor și valorilor lor
  const checkAllTopics = (topics: ExtendedForumTopic[]) => {
    console.log("Verificare completă a topicurilor:");
    console.log("Număr total de topicuri:", topics.length);

    // Extragem toate valorile unice de universități și facultăți
    const universities = new Set<string>();
    const faculties = new Set<string>();

    topics.forEach((topic) => {
      universities.add(topic.university);
      faculties.add(topic.faculty);
    });

    console.log("Universități unice:", Array.from(universities));
    console.log("Facultăți unice:", Array.from(faculties));

    // Verificăm topicurile cu universități ID-uri
    const topicsWithUniversityIds = topics.filter((t) =>
      t.university.startsWith("uni_")
    );
    console.log(
      "Topicuri cu universități ID-uri:",
      topicsWithUniversityIds.length
    );

    // Verificăm topicurile cu facultăți ID-uri
    const topicsWithFacultyIds = topics.filter((t) =>
      t.faculty.startsWith("fac_")
    );
    console.log("Topicuri cu facultăți ID-uri:", topicsWithFacultyIds.length);
  };

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/forum");
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched topics:", data.length);

        // Detalii despre primul topic pentru a verifica structura
        if (data.length > 0) {
          console.log("Sample topic details:", {
            id: data[0].id,
            title: data[0].title,
            university: data[0].university,
            faculty: data[0].faculty,
            universityName: data[0].universityName,
            facultyName: data[0].facultyName,
          });
        }

        // Verificare completă a datelor
        checkAllTopics(data);

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
    console.log("handleSort called, sorting topics");
    console.log("Current filtered topics:", filteredTopics.length);
    console.log("Current sort direction:", sortDirection);

    try {
      // Creează o copie a array-ului pentru a evita mutații directe
      const topicsToSort = [...filteredTopics];

      // Verifică dacă avem date valide
      if (
        !topicsToSort ||
        !Array.isArray(topicsToSort) ||
        topicsToSort.length === 0
      ) {
        console.warn("No topics to sort or invalid data", topicsToSort);
        return;
      }

      // Inversăm direcția sortării la fiecare apel
      const newDirection = sortDirection === "desc" ? "asc" : "desc";
      console.log("New sort direction:", newDirection);

      // Creează o funcție care verifică datele înainte de sortare pentru a evita erorile
      const sorted = topicsToSort.sort((a, b) => {
        try {
          if (!a.createdAt || !b.createdAt) {
            console.warn("Missing createdAt on topics", { a, b });
            return 0;
          }

          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);

          // Verifică dacă datele sunt valide
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
            console.warn("Invalid dates for sorting", { dateA, dateB });
            return 0;
          }

          // Sortare în funcție de direcție
          return newDirection === "desc"
            ? dateB.getTime() - dateA.getTime() // Descendent (cele mai noi primele)
            : dateA.getTime() - dateB.getTime(); // Ascendent (cele mai vechi primele)
        } catch (err) {
          console.error("Error during sort comparison:", err);
          return 0;
        }
      });

      console.log("Sorted topics:", sorted.length);

      // Actualizează starea cu topicurile sortate și noua direcție
      setFilteredTopics(sorted);
      setSortDirection(newDirection);
    } catch (error) {
      console.error("Error in handleSort:", error);
    }
  };

  const handleFilter = () => {
    setIsFilterDialogOpen(true);
  };

  const handleApplyFilters = useCallback(
    (newFilters: { university: string; faculty: string; category: string }) => {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-600">
          {translations.forumTitle}
        </h1>
        <UserProfile />
      </div>
      <div className="flex justify-between items-center">
        <ForumTabs
          tabs={tabsData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <CreateTopicButton
          onClick={() => router.push("/forum/new")}
          userPlan={userPlan}
        />
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex-grow">
          <SearchBar onSearch={handleSearch} />
        </div>
        <SortButton onSort={handleSort} direction={sortDirection} />
        <FilterButton
          onFilter={handleFilter}
          activeFiltersCount={activeFiltersCount}
        />
      </div>
      <div className="h-[calc(100vh-24rem)] overflow-y-auto pr-4">
        {filteredTopics.length > 0 ? (
          <TopicList
            topics={filteredTopics}
            onFavoriteToggle={handleFavoriteToggle}
            onDelete={handleDelete}
            userPlan={userPlan}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p className="text-lg">
              {language === "ro"
                ? "Nu au fost găsite subiecte care să corespundă criteriilor de căutare"
                : "No topics found matching your search criteria"}
            </p>
            <Button
              variant="link"
              onClick={() => {
                setFilters({ university: "", faculty: "", category: "" });
                setSearchQuery("");
              }}
            >
              {language === "ro"
                ? "Șterge toate filtrele"
                : "Clear all filters"}
            </Button>
          </div>
        )}
      </div>

      <ForumFilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
    </div>
  );
}
