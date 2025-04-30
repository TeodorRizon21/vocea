"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUniversities } from "@/hooks/useUniversities";
import { FORUM_CATEGORIES } from "@/lib/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/components/LanguageToggle";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(200, "Content must be at least 200 characters long"),
  university: z.string().min(1, "University is required"),
  faculty: z.string().min(1, "Faculty is required"),
  category: z.string().min(1, "Category is required"),
});

export default function NewForumTopic() {
  const router = useRouter();
  const { userId } = useAuth();
  const { universities, getFacultiesForUniversity, getUniversityName, getFacultyName } = useUniversities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [universitySearch, setUniversitySearch] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      university: "",
      faculty: "",
      category: "",
    },
  });

  const selectedUniversity = form.watch("university");
  const availableFaculties = selectedUniversity ? getFacultiesForUniversity(selectedUniversity) : [];

  const { language, forceRefresh } = useLanguage();

  // Define the type for translations
  type Translations = {
    createNewTopic: string;
    title: string;
    enterTopicTitle: string;
    content: string;
    minimumChars: string;
    enterTopicContent: string;
    charactersMinimum: string;
    university: string;
    selectUniversity: string;
    faculty: string;
    selectFaculty: string;
    selectUniversityFirst: string;
    category: string;
    selectCategory: string;
    allFieldsRequired: string;
    contentTooShort: string;
    creating: string;
    create: string;
    cancel: string;
    searchUniversity: string;
    noUniversityFound: string;
    mustBeLoggedIn: string;
    topicCreated: string;
    topicCreationFailed: string;
  };

  // Helper function to get translated message
  const getTranslatedMessage = (message: string | null): string => {
    if (!message) return "";
    switch (message) {
      case "You must be logged in to create a topic":
        return translations.mustBeLoggedIn;
      case "Topic created successfully":
        return translations.topicCreated;
      case "Failed to create topic":
        return translations.topicCreationFailed;
      default:
        return message;
    }
  };

  // Translations for the page
  const translations = useMemo<Translations>(() => {
    return {
      createNewTopic: language === "ro" ? "Crează subiect nou" : "Create New Topic",
      title: language === "ro" ? "Titlu" : "Title",
      enterTopicTitle: language === "ro" ? "Introdu titlul subiectului" : "Enter topic title",
      content: language === "ro" ? "Conținut" : "Content",
      minimumChars: language === "ro" ? "minim 200 caractere" : "minimum 200 characters",
      enterTopicContent: language === "ro" ? "Introdu conținutul subiectului" : "Enter topic content",
      charactersMinimum: language === "ro" ? "caractere minim" : "characters minimum",
      university: language === "ro" ? "Universitate" : "University",
      selectUniversity: language === "ro" ? "Selectează o universitate" : "Select a university",
      faculty: language === "ro" ? "Facultate" : "Faculty",
      selectFaculty: language === "ro" ? "Selectează o facultate" : "Select a faculty",
      selectUniversityFirst: language === "ro" ? "Selectează mai întâi universitatea" : "Select university first",
      category: language === "ro" ? "Categorie" : "Category",
      selectCategory: language === "ro" ? "Selectează o categorie" : "Select a category",
      allFieldsRequired: language === "ro" ? "Toate câmpurile sunt obligatorii" : "All fields are required",
      contentTooShort: language === "ro" ? "Conținutul subiectului trebuie să aibă cel puțin 200 de caractere" : "Topic content must be at least 200 characters long",
      creating: language === "ro" ? "Se creează..." : "Creating...",
      create: language === "ro" ? "Crează subiect" : "Create Topic",
      cancel: language === "ro" ? "Anulează" : "Cancel",
      searchUniversity: language === "ro" ? "Caută universitate..." : "Search university...",
      noUniversityFound: language === "ro" ? "Nu s-a găsit nicio universitate" : "No university found",
      mustBeLoggedIn: language === "ro" ? "Trebuie să fii autentificat pentru a crea un subiect" : "You must be logged in to create a topic",
      topicCreated: language === "ro" ? "Subiectul a fost creat cu succes" : "Topic created successfully",
      topicCreationFailed: language === "ro" ? "Nu s-a putut crea subiectul" : "Failed to create topic"
    };
  }, [language, forceRefresh]);

  // Filter universities based on search term
  const filteredUniversities = universities.filter(
    (university) =>
      university.name.toLowerCase().includes(universitySearch.toLowerCase()) ||
      university.city.toLowerCase().includes(universitySearch.toLowerCase())
  );

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError("You must be logged in to create a topic");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get the university and faculty names
      const universityName = getUniversityName(values.university);
      const facultyName = getFacultyName(values.university, values.faculty);

      const response = await fetch("/api/forum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          content: values.content,
          university: universityName,
          faculty: facultyName,
          category: values.category,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create topic");
      }

      setSuccess("Topic created successfully");
      router.push("/forum");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create topic");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{getTranslatedMessage(error)}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>{getTranslatedMessage(success)}</AlertDescription>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.title}</FormLabel>
                <FormControl>
                  <Input placeholder={translations.enterTopicTitle} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.content}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={translations.enterTopicContent}
                    className="min-h-[200px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-sm text-muted-foreground">
                  {field.value.length} / 200 {translations.charactersMinimum}
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.category}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.selectCategory} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FORUM_CATEGORIES.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {language === "ro" ? category.labelRo : category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="university"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.university}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={translations.selectUniversity} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="p-0">
                    <div className="flex items-center px-3 pb-2 pt-3 border-b">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <Input
                        placeholder="Search university..."
                        className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={universitySearch}
                        onChange={(e) => setUniversitySearch(e.target.value)}
                      />
                    </div>
                    <ScrollArea className="h-72">
                      {filteredUniversities.length === 0 ? (
                        <div className="py-6 text-center text-sm">
                          {translations.noUniversityFound}
                        </div>
                      ) : (
                        filteredUniversities.map((university) => (
                          <SelectItem
                            key={university.id}
                            value={university.id}
                            className="cursor-pointer py-2"
                          >
                            <div className="flex flex-col">
                              <span className="whitespace-normal break-words leading-snug">{university.name}</span>
                              <span className="text-xs text-muted-foreground">{university.city}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="faculty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.faculty}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={!selectedUniversity}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          selectedUniversity
                            ? translations.selectFaculty
                            : translations.selectUniversityFirst
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableFaculties.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? translations.creating : translations.create}
          </Button>
        </form>
      </Form>
    </div>
  );
}
