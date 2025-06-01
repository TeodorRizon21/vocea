"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2, Search } from "lucide-react";
import type { ProjectType } from "@/types/project";
import { useUploadThing } from "@/lib/uploadthing";
import ProjectImageUpload from "@/components/ProjectImageUpload";
import { useUniversities } from "@/hooks/useUniversities";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ACADEMIC_CATEGORIES, DIVERSE_CATEGORIES } from "@/lib/constants";
import { useLanguage } from "@/components/LanguageToggle";

interface ExtendedProject {
  id: string;
  type: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  university: string;
  faculty: string;
  phoneNumber: string;
  images: string[];
  userId: string;
  authorName: string | null;
  authorAvatar: string | null;
  studyLevel: string | null;
  createdAt: Date;
  updatedAt: Date;
  price?: number | null;
  academicYear?: string | null;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("proiect");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [universitySearch, setUniversitySearch] = useState("");
  const [facultySearch, setFacultySearch] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    category: "",
    universityId: "",
    facultyId: "",
    phoneNumber: "",
    city: "",
    studyLevel: "bachelors",
    price: "",
    academicYear: "",
  });

  const { universities, loading, getFacultiesForUniversity } =
    useUniversities();
  const faculties = getFacultiesForUniversity(formData.universityId);
  const { language, forceRefresh } = useLanguage();

  // Translations for the page
  const translations = useMemo(() => {
    return {
      pageTitle: {
        proiect: language === "ro" ? "Creează Proiect Nou" : "Create New Project",
        cerere: language === "ro" ? "Creează Cerere de Proiect" : "Create Project Request",
        diverse: language === "ro" ? "Creează Anunț Nou" : "Create New Announcement"
      },
      pageSubtitle: {
        proiect: language === "ro" 
          ? "Distribuie proiectul tău comunității și ajută alți studenți să învețe din experiența ta"
          : "Share your project with the community and help other students learn from your experience",
        cerere: language === "ro"
          ? "Solicită ajutor pentru proiectul tău și găsește experți care te pot ghida"
          : "Request help for your project and find experts who can guide you",
        diverse: language === "ro"
          ? "Publică un anunț pentru comunitatea studenților - oferte de muncă, servicii, produse și multe altele"
          : "Post an announcement for the student community - job offers, services, products, and more"
      },
      projectType: language === "ro" ? "Tipul Anunțului" : "Announcement Type",
      projectLabel: language === "ro" ? "Proiect" : "Academic Project",
      requestLabel: language === "ro" ? "Cerere de Proiect" : "Project Request",
      diverseLabel: language === "ro" ? "Anunț Diverse" : "Various Announcement",
      diverseCategory:
        language === "ro" ? "Categorie Diverse" : "Diverse Category",
      selectCategory:
        language === "ro"
          ? "Te rugăm să selectezi o categorie pentru elementul tău divers"
          : "Please select a category for your diverse item",
      title: language === "ro" ? "Titlu" : "Title",
      titlePlaceholder:
        language === "ro"
          ? "Introdu titlul proiectului"
          : "Enter project title",
      images: language === "ro" ? "Imagini" : "Images",
      imagesRequired: language === "ro" 
        ? "Imaginile sunt obligatorii pentru toate tipurile de proiecte" 
        : "Images are required for all project types",
      description: language === "ro" ? "Descriere" : "Description",
      descriptionPlaceholder:
        language === "ro"
          ? "Introdu descrierea proiectului"
          : "Enter project description",
      subject: language === "ro" ? "Subiect" : "Subject",
      subjectPlaceholder:
        language === "ro"
          ? "Introdu subiectul proiectului"
          : "Enter project subject",
      category: language === "ro" ? "Categorie" : "Category",
      selectCategoryPlaceholder:
        language === "ro" ? "Selectează o categorie" : "Select a category",
      university: language === "ro" ? "Universitate" : "University",
      selectUniversity:
        language === "ro" ? "Selectează o universitate" : "Select a university",
      searchUniversity:
        language === "ro" ? "Caută universitate..." : "Search university...",
      noUniversity:
        language === "ro"
          ? "Nu a fost găsită nicio universitate."
          : "No university found.",
      faculty: language === "ro" ? "Facultate" : "Faculty",
      selectFaculty:
        language === "ro" ? "Selectează o facultate" : "Select a faculty",
      selectUniversityFirst:
        language === "ro"
          ? "Selectează mai întâi o universitate"
          : "Select a university first",
      searchFaculty:
        language === "ro" ? "Caută facultate..." : "Search faculty...",
      noFaculty:
        language === "ro"
          ? "Nu a fost găsită nicio facultate."
          : "No faculty found.",
      city: language === "ro" ? "Oraș" : "City",
      cityAuto:
        language === "ro"
          ? "Orașul este setat automat în funcție de universitatea selectată"
          : "City is automatically set based on the selected university",
      phoneNumber: language === "ro" ? "Număr de Telefon" : "Phone Number",
      phonePlaceholder:
        language === "ro"
          ? "Introdu numărul tău de telefon"
          : "Enter your phone number",
      phoneFormat:
        language === "ro"
          ? "Format: număr de 10 cifre"
          : "Format: 10 digits number",
      creating: language === "ro" ? "Se creează..." : "Creating...",
      createProject: language === "ro" ? "Creează Proiect" : "Create Project",
      createRequest:
        language === "ro"
          ? "Creează Cerere de Proiect"
          : "Create Project Request",
      createDiverse:
        language === "ro" ? "Creează Element Divers" : "Create Diverse Item",
      loading: language === "ro" ? "Se încarcă..." : "Loading...",
      // Erori
      phoneError:
        language === "ro"
          ? "Numărul de telefon trebuie să aibă exact 10 cifre"
          : "Phone number must be exactly 10 digits",
      selectUnivFac:
        language === "ro"
          ? "Te rugăm să selectezi o universitate și facultate"
          : "Please select a university and faculty",
      selectCatRequired:
        language === "ro"
          ? "Te rugăm să selectezi o categorie"
          : "Please select a category",
      diverseCatError:
        language === "ro"
          ? "Te rugăm să selectezi o categorie validă pentru elementele diverse"
          : "Please select a valid category for diverse items",
      academicCatError:
        language === "ro"
          ? "Te rugăm să selectezi o categorie academică validă"
          : "Please select a valid academic category",
      studyLevel: language === "ro" ? "Nivel de studii" : "Study Level",
      bachelors: language === "ro" ? "Licență" : "Bachelor's",
      masters: language === "ro" ? "Master" : "Master's",
      phd: language === "ro" ? "Doctorat" : "PhD",
      selectStudyLevel: language === "ro" ? "Selectează nivelul de studii" : "Select study level",
      // Add translations for academic categories
      academicCategories: {
        "Computer Science": language === "ro" ? "Informatică" : "Computer Science",
        "Mathematics": language === "ro" ? "Matematică" : "Mathematics",
        "Physics": language === "ro" ? "Fizică" : "Physics",
        "Chemistry": language === "ro" ? "Chimie" : "Chemistry",
        "Biology": language === "ro" ? "Biologie" : "Biology",
        "Engineering": language === "ro" ? "Inginerie" : "Engineering",
        "Business": language === "ro" ? "Business" : "Business",
        "Economics": language === "ro" ? "Economie" : "Economics",
        "Law": language === "ro" ? "Drept" : "Law",
        "Medicine": language === "ro" ? "Medicină" : "Medicine",
        "Psychology": language === "ro" ? "Psihologie" : "Psychology",
        "Sociology": language === "ro" ? "Sociologie" : "Sociology",
        "History": language === "ro" ? "Istorie" : "History",
        "Philosophy": language === "ro" ? "Filosofie" : "Philosophy",
        "Literature": language === "ro" ? "Literatură" : "Literature",
        "Languages": language === "ro" ? "Limbă și Literatură" : "Languages",
        "Art": language === "ro" ? "Arte" : "Art",
        "Music": language === "ro" ? "Muzică" : "Music",
        "Architecture": language === "ro" ? "Arhitectură" : "Architecture",
        "Other": language === "ro" ? "Altele" : "Other",
      },
      // Add translations for diverse categories
      diverseCategories: {
        "job-offers": language === "ro" ? "Oferte muncă" : "Job offers",
        "services": language === "ro" ? "Servicii" : "Services",
        "cars": language === "ro" ? "Autoturisme" : "Cars",
        "sports": language === "ro" ? "Sport" : "Sports",
        "electronics": language === "ro" ? "Electronice" : "Electronics",
        "cosmetics": language === "ro" ? "Cosmetice" : "Cosmetics",
        "appliances": language === "ro" ? "Electrocasnice" : "Appliances",
        "manuale-carti": language === "ro" ? "Manuale / Carti" : "Manuals / Books",
        "other": language === "ro" ? "Altele" : "Other",
      },
      price: language === "ro" ? "Preț (RON)" : "Price (RON)",
      pricePlaceholder: language === "ro" ? "Introdu prețul în RON" : "Enter price in RON",
      priceOptional: language === "ro" ? "(opțional)" : "(optional)",
      academicYear: language === "ro" ? "An Academic" : "Academic Year",
      selectAcademicYear: language === "ro" ? "Selectează anul academic" : "Select academic year",
      bachelorsYear1: language === "ro" ? "Licență: Anul 1" : "Bachelor's: Year 1",
      bachelorsYear2: language === "ro" ? "Licență: Anul 2" : "Bachelor's: Year 2",
      bachelorsYear3: language === "ro" ? "Licență: Anul 3" : "Bachelor's: Year 3",
      bachelorsYear4: language === "ro" ? "Licență: Anul 4" : "Bachelor's: Year 4",
      bachelorsYear5: language === "ro" ? "Licență: Anul 5" : "Bachelor's: Year 5",
      bachelorsYear6: language === "ro" ? "Licență: Anul 6" : "Bachelor's: Year 6",
      mastersYear1: language === "ro" ? "Master: Anul 1" : "Master's: Year 1",
      mastersYear2: language === "ro" ? "Master: Anul 2" : "Master's: Year 2",
    };
  }, [language, forceRefresh]);

  // Filter universities based on search term
  const filteredUniversities = universities.filter(
    (university) =>
      university.name.toLowerCase().includes(universitySearch.toLowerCase()) ||
      university.city.toLowerCase().includes(universitySearch.toLowerCase())
  );

  // Filter faculties based on search term
  const filteredFaculties = faculties.filter((faculty) =>
    faculty.name.toLowerCase().includes(facultySearch.toLowerCase())
  );

  const { startUpload } = useUploadThing("projectImage");

  // Reset category when project type changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, category: "" }));
  }, [projectType]);

  // Update city when university changes
  useEffect(() => {
    if (formData.universityId) {
      const university = universities.find(
        (u) => u.id === formData.universityId
      );
      if (university) {
        setFormData((prev) => ({ ...prev, city: university.city }));
      }
    }
  }, [formData.universityId, universities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate phone number
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      setError(translations.phoneError);
      return;
    }

    // Validate images for all project types
    if (uploadedImages.length === 0) {
      setError(translations.imagesRequired);
      return;
    }

    // Validate university and faculty
    if (!formData.universityId || !formData.facultyId) {
      setError(translations.selectUnivFac);
      return;
    }

    // Validate category
    if (!formData.category) {
      setError(translations.selectCatRequired);
      return;
    }

    // Validate that diverse projects have a diverse category
    if (
      projectType === "diverse" &&
      !DIVERSE_CATEGORIES.some((cat) => cat.id === formData.category)
    ) {
      setError(translations.diverseCatError);
      return;
    }

    // Validate that proiect and cerere have academic categories
    if (
      (projectType === "proiect" || projectType === "cerere") &&
      !ACADEMIC_CATEGORIES.includes(formData.category)
    ) {
      setError(translations.academicCatError);
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

      if (!selectedUniversity || !selectedFaculty) {
        throw new Error("Selected university or faculty not found");
      }

      // Format price to have exactly 2 decimal places if it exists
      const formattedPrice = formData.price 
        ? parseFloat(parseFloat(formData.price).toFixed(2))
        : null;

      // Only include fields that exist in the Prisma schema
      const projectData = {
        title: formData.title,
        description: formData.description,
        subject: formData.subject,
        category: formData.category,
        university: selectedUniversity.name,
        faculty: selectedFaculty.name,
        phoneNumber: formData.phoneNumber,
        type: projectType,
        images: uploadedImages,
        studyLevel: formData.studyLevel,
        price: formattedPrice,
        academicYear: formData.category === "manuale-carti" ? formData.academicYear : null,
        city: selectedUniversity.city,
      };

      console.log("Submitting project data:", projectData); // Debug log

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create project");
      }

      const result = await response.json();
      console.log("Project created successfully:", result); // Debug log

      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating project:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create project. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2">{translations.loading}</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-purple-600">
          {translations.pageTitle[projectType]}
        </h1>
        <p className="text-gray-600 mt-2">{translations.pageSubtitle[projectType]}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Label>{translations.projectType}</Label>
          <RadioGroup
            defaultValue="proiect"
            value={projectType}
            onValueChange={(value) => setProjectType(value as ProjectType)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="proiect" id="proiect" />
              <Label htmlFor="proiect" className="cursor-pointer">
                {translations.projectLabel}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cerere" id="cerere" />
              <Label htmlFor="cerere" className="cursor-pointer">
                {translations.requestLabel}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="diverse" id="diverse" />
              <Label htmlFor="diverse" className="cursor-pointer">
                {translations.diverseLabel}
              </Label>
            </div>
          </RadioGroup>
        </div>

        {projectType === "diverse" && (
          <div className="space-y-4">
            <Label>{translations.diverseCategory}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.selectCategoryPlaceholder} />
              </SelectTrigger>
              <SelectContent>
              {DIVERSE_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {translations.diverseCategories[category.id as keyof typeof translations.diverseCategories] || category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <Label htmlFor="price">
                {translations.price} <span className="text-sm text-gray-500">{translations.priceOptional}</span>
              </Label>
              <div className="relative">
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder={translations.pricePlaceholder}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  RON
                </span>
              </div>
            </div>

            {formData.category === "manuale-carti" && (
              <div>
                <Label htmlFor="academicYear">{translations.academicYear}</Label>
                <Select
                  value={formData.academicYear}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, academicYear: value }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={translations.selectAcademicYear} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bachelors-1">{translations.bachelorsYear1}</SelectItem>
                    <SelectItem value="bachelors-2">{translations.bachelorsYear2}</SelectItem>
                    <SelectItem value="bachelors-3">{translations.bachelorsYear3}</SelectItem>
                    <SelectItem value="bachelors-4">{translations.bachelorsYear4}</SelectItem>
                    <SelectItem value="bachelors-5">{translations.bachelorsYear5}</SelectItem>
                    <SelectItem value="bachelors-6">{translations.bachelorsYear6}</SelectItem>
                    <SelectItem value="masters-1">{translations.mastersYear1}</SelectItem>
                    <SelectItem value="masters-2">{translations.mastersYear2}</SelectItem>
                    <SelectItem value="phd">{translations.phd}</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="title">{translations.title}</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder={translations.titlePlaceholder}
            required
          />
        </div>

          <div className="space-y-2">
            <Label>
              {translations.images}
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <ProjectImageUpload
              onImagesUploaded={(urls) => setUploadedImages(urls)}
              existingImages={uploadedImages}
              maxImages={4}
            />
          </div>

        <div>
          <Label htmlFor="description">{translations.description}</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder={translations.descriptionPlaceholder}
            required
          />
        </div>

        <div>
          <Label htmlFor="subject">{translations.subject}</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, subject: e.target.value }))
            }
            placeholder={translations.subjectPlaceholder}
            required
          />
        </div>

        {projectType !== "diverse" && (
          <div>
            <Label htmlFor="category">{translations.category}</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={translations.selectCategoryPlaceholder}
                />
              </SelectTrigger>
              <SelectContent>
                {ACADEMIC_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {translations.academicCategories[category as keyof typeof translations.academicCategories] || category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {projectType !== "diverse" && (
          <div>
            <Label htmlFor="studyLevel">{translations.studyLevel}</Label>
            <Select
              value={formData.studyLevel}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, studyLevel: value }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={translations.selectStudyLevel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bachelors">
                  {translations.bachelors}
                </SelectItem>
                <SelectItem value="masters">
                  {translations.masters}
                </SelectItem>
                <SelectItem value="phd">
                  {translations.phd}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="university">{translations.university}</Label>
          <Select
            value={formData.universityId}
            onValueChange={(value) => {
              setFormData((prev) => ({
                ...prev,
                universityId: value,
                facultyId: "",
              }));
            }}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder={translations.selectUniversity} />
            </SelectTrigger>
            <SelectContent className="p-0">
              <div className="flex items-center px-3 pb-2 pt-3 border-b">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder={translations.searchUniversity}
                  className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={universitySearch}
                  onChange={(e) => setUniversitySearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-72">
                {filteredUniversities.length === 0 ? (
                  <div className="py-6 text-center text-sm">
                    {translations.noUniversity}
                  </div>
                ) : (
                  filteredUniversities.map((university) => (
                    <SelectItem
                      key={university.id}
                      value={university.id}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span>{university.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {university.city}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="faculty">{translations.faculty}</Label>
          <Select
            value={formData.facultyId}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, facultyId: value }))
            }
            disabled={!formData.universityId}
            required
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  formData.universityId
                    ? translations.selectFaculty
                    : translations.selectUniversityFirst
                }
              />
            </SelectTrigger>
            <SelectContent className="p-0">
              <div className="flex items-center px-3 pb-2 pt-3 border-b">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder={translations.searchFaculty}
                  className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={facultySearch}
                  onChange={(e) => setFacultySearch(e.target.value)}
                />
              </div>
              <ScrollArea className="h-72">
                {filteredFaculties.length === 0 ? (
                  <div className="py-6 text-center text-sm">
                    {translations.noFaculty}
                  </div>
                ) : (
                  filteredFaculties.map((faculty) => (
                    <SelectItem
                      key={faculty.id}
                      value={faculty.id}
                      className="cursor-pointer"
                    >
                      {faculty.name}
                    </SelectItem>
                  ))
                )}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="city">{translations.city}</Label>
          <Input
            id="city"
            value={formData.city}
            readOnly
            className="bg-transparent dark:bg-transparent"
          />
          <p className="text-sm text-gray-500 mt-1">{translations.cityAuto}</p>
        </div>

        <div>
          <Label htmlFor="phone">{translations.phoneNumber}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
            placeholder={translations.phonePlaceholder}
            pattern="[0-9]{10}"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            {translations.phoneFormat}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {translations.creating}
            </>
          ) : (
            `${
              projectType === "cerere"
                ? translations.createRequest
                : projectType === "diverse"
                ? translations.createDiverse
                : translations.createProject
            }`
          )}
        </Button>
      </form>
    </div>
  );
}
