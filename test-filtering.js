// Script de test pentru verificarea filtrarei proiectelor
const testProjects = [
  {
    id: "1",
    type: "cerere",
    title: "Cerere proiect test",
    description: "Descriere test",
    subject: "Matematică",
    category: "Matematică",
    university: "Universitatea București",
    faculty: "Facultatea de Matematică",
    phoneNumber: "0123456789",
    images: ["test.jpg"],
    userId: "user1",
    authorName: "Test User",
    authorAvatar: null,
    studyLevel: "Bachelors",
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      firstName: "Test",
      lastName: "User",
      university: "Universitatea București",
      faculty: "Facultatea de Matematică",
      avatar: null,
    },
    reviews: [],
    city: "București",
    academicYear: null,
  },
  {
    id: "2",
    type: "proiect",
    title: "Proiect test",
    description: "Descriere test",
    subject: "Fizică",
    category: "Fizică",
    university: "Universitatea București",
    faculty: "Facultatea de Fizică",
    phoneNumber: "0123456789",
    images: ["test.jpg"],
    userId: "user2",
    authorName: "Test User 2",
    authorAvatar: null,
    studyLevel: "Masters",
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      firstName: "Test",
      lastName: "User 2",
      university: "Universitatea București",
      faculty: "Facultatea de Fizică",
      avatar: null,
    },
    reviews: [],
    city: "București",
    academicYear: null,
  }
];

// Simulează logica de filtrare din BrowsePageClient
function filterProjects(projects, activeTab, filters = {}) {
  console.log("Starting filtering with:", {
    activeTab,
    filters,
    projectsCount: projects.length
  });

  // First filter by tab
  let result = projects.filter((project) => {
    if (activeTab === "joburi-servicii") {
      // Pentru joburi-servicii, include proiecte cu tipul "diverse" dar cu categoriile oferte-munca sau servicii
      return project.type === "diverse" && 
             (project.category === "oferte-munca" || project.category === "servicii");
    }
    return project.type === activeTab;
  });
  console.log("After tab filter:", result.length, "projects");
  console.log("Filtered projects:", result.map(p => ({ id: p.id, type: p.type, title: p.title })));

  return result;
}

// Testează filtrarea pentru tab-ul "cerere"
console.log("=== Test filtrare pentru tab 'cerere' ===");
const cerereResults = filterProjects(testProjects, "cerere");
console.log("Rezultate finale pentru cerere:", cerereResults.length);

console.log("\n=== Test filtrare pentru tab 'proiect' ===");
const proiectResults = filterProjects(testProjects, "proiect");
console.log("Rezultate finale pentru proiect:", proiectResults.length);

console.log("\n=== Toate proiectele ===");
console.log(testProjects.map(p => ({ id: p.id, type: p.type, title: p.title })));
