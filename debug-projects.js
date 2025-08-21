// Script de debug pentru verificarea proiectelor din baza de date
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugProjects() {
  try {
    console.log("=== Verificare proiecte din baza de date ===");
    
    // Verifică toate proiectele
    const allProjects = await prisma.project.findMany({
      select: {
        id: true,
        type: true,
        title: true,
        category: true,
        isActive: true,
        createdAt: true,
        userId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Total proiecte găsite: ${allProjects.length}`);
    
    // Grupează proiectele pe tip
    const projectsByType = {};
    allProjects.forEach(project => {
      if (!projectsByType[project.type]) {
        projectsByType[project.type] = [];
      }
      projectsByType[project.type].push(project);
    });
    
    console.log("\n=== Proiecte grupate pe tip ===");
    Object.keys(projectsByType).forEach(type => {
      console.log(`\nTip: ${type} (${projectsByType[type].length} proiecte)`);
      projectsByType[type].forEach(project => {
        console.log(`  - ID: ${project.id}, Title: ${project.title}, Category: ${project.category}, Active: ${project.isActive}, Created: ${project.createdAt}`);
      });
    });
    
    // Verifică proiectele active
    const activeProjects = await prisma.project.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        type: true,
        title: true,
        category: true,
        createdAt: true
      }
    });
    
    console.log(`\n=== Proiecte active: ${activeProjects.length} ===");
    activeProjects.forEach(project => {
      console.log(`  - ID: ${project.id}, Type: ${project.type}, Title: ${project.title}, Category: ${project.category}`);
    });
    
    // Verifică proiectele de tip "cerere"
    const cerereProjects = await prisma.project.findMany({
      where: {
        type: "cerere",
        isActive: true
      },
      select: {
        id: true,
        title: true,
        category: true,
        createdAt: true
      }
    });
    
    console.log(`\n=== Proiecte de tip 'cerere' active: ${cerereProjects.length} ===");
    cerereProjects.forEach(project => {
      console.log(`  - ID: ${project.id}, Title: ${project.title}, Category: ${project.category}, Created: ${project.createdAt}`);
    });
    
  } catch (error) {
    console.error("Eroare la debug:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProjects();
