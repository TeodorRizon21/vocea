/**
 * Academic categories for projects and filtering
 */
export const ACADEMIC_CATEGORIES = [
  "Mathematics",
  "Physics",
  "Computer Science",
  "Engineering",
  "Chemistry",
  "Economics",
  "Medicine",
  "Law",
  "Social Sciences",
  "Arts and Humanities",
  "Business and Management"
];

/**
 * Categories specifically for diverse items
 */
export const DIVERSE_CATEGORIES = [
  { id: "oferte-munca", label: "Oferte muncă" },
  { id: "servicii", label: "Servicii" },
  { id: "autoturisme", label: "Autoturisme" },
  { id: "sport", label: "Sport" },
  { id: "electronice", label: "Electronice" },
  { id: "cosmetice", label: "Cosmetice" },
  { id: "electrocasnice", label: "Electrocasnice" },
  { id: "manuale-carti", label: "Manuale / Carti" },
  { id: "altele", label: "Altele" }
];

/**
 * Forum categories
 */
export const FORUM_CATEGORIES = [
  { id: "general", label: "General", labelRo: "General" },
  { id: "academic", label: "Academic", labelRo: "Academic" },
  { id: "events", label: "Events", labelRo: "Evenimente" },
  { id: "housing", label: "Housing", labelRo: "Cazare" },
  { id: "jobs", label: "Jobs & Internships", labelRo: "Joburi & Stagii" },
  { id: "social", label: "Social", labelRo: "Social" },
  { id: "gaming", label: "Gaming", labelRo: "Gaming" },
];

/**
 * Study levels for projects
 */
export const STUDY_LEVELS = [
  "Bachelors",
  "Masters",
  "PhD"
];

export const PROJECT_LIMITS = {
  Basic: 0,
  Bronze: 2,
  Premium: 4,
  Gold: Infinity
} as const;

export type SubscriptionType = keyof typeof PROJECT_LIMITS; 