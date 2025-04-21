"use client";

import type React from "react";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useUniversities } from "@/hooks/useUniversities";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/LanguageToggle";

export default function NewTopicPage() {
  const router = useRouter();
  const { universities, getFacultiesForUniversity } = useUniversities();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    universityId: "",
    facultyId: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language, forceRefresh } = useLanguage();

  // Traduceri pentru pagina
  const translations = useMemo(() => {
    return {
      createNewTopic:
        language === "ro" ? "Crează subiect nou" : "Create New Topic",
      title: language === "ro" ? "Titlu" : "Title",
      enterTopicTitle:
        language === "ro" ? "Introdu titlul subiectului" : "Enter topic title",
      content: language === "ro" ? "Conținut" : "Content",
      minimumChars:
        language === "ro" ? "minim 200 caractere" : "minimum 200 characters",
      enterTopicContent:
        language === "ro"
          ? "Introdu conținutul subiectului"
          : "Enter topic content",
      charactersMinimum:
        language === "ro" ? "caractere minim" : "characters minimum",
      university: language === "ro" ? "Universitate" : "University",
      selectUniversity:
        language === "ro" ? "Selectează o universitate" : "Select a university",
      faculty: language === "ro" ? "Facultate" : "Faculty",
      selectFaculty:
        language === "ro" ? "Selectează o facultate" : "Select a faculty",
      allFieldsRequired:
        language === "ro"
          ? "Toate câmpurile sunt obligatorii"
          : "All fields are required",
      contentTooShort:
        language === "ro"
          ? "Conținutul subiectului trebuie să aibă cel puțin 200 de caractere"
          : "Topic content must be at least 200 characters long",
      creating: language === "ro" ? "Se creează..." : "Creating...",
      create: language === "ro" ? "Crează subiect" : "Create Topic",
      cancel: language === "ro" ? "Anulează" : "Cancel",
    };
  }, [language, forceRefresh]);

  const faculties = getFacultiesForUniversity(formData.universityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.title ||
      !formData.content ||
      !formData.universityId ||
      !formData.facultyId
    ) {
      setError(translations.allFieldsRequired);
      return;
    }

    if (formData.content.length < 200) {
      setError(translations.contentTooShort);
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedUniversity = universities.find(
        (u) => u.id === formData.universityId
      );
      const selectedFaculty = faculties.find(
        (f) => f.id === formData.facultyId
      );

      const submitData = {
        ...formData,
        university: formData.universityId,
        faculty: formData.facultyId,
      };

      const response = await fetch("/api/forum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      router.push("/forum");
    } catch (error) {
      console.error("Error creating topic:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create topic"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-4xl font-bold text-purple-600">
        {translations.createNewTopic}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="title">{translations.title}</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder={translations.enterTopicTitle}
            required
          />
        </div>

        <div>
          <Label htmlFor="content">
            {translations.content}{" "}
            <span className="text-sm text-muted-foreground">
              ({translations.minimumChars})
            </span>
          </Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, content: e.target.value }))
            }
            placeholder={translations.enterTopicContent}
            required
            className="min-h-[200px]"
          />
          <p className="text-sm text-muted-foreground mt-1">
            {formData.content.length} / 200 {translations.charactersMinimum}
          </p>
        </div>

        <div>
          <Label htmlFor="university">{translations.university}</Label>
          <Select
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, universityId: value }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={translations.selectUniversity} />
            </SelectTrigger>
            <SelectContent>
              {universities.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="faculty">{translations.faculty}</Label>
          <Select
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, facultyId: value }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={translations.selectFaculty} />
            </SelectTrigger>
            <SelectContent>
              {faculties.map((faculty) => (
                <SelectItem key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex space-x-4">
          <Button
            type="submit"
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {translations.creating}
              </>
            ) : (
              translations.create
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            {translations.cancel}
          </Button>
        </div>
      </form>
    </div>
  );
}
