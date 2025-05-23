import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Explorează Resurse | Vocea Campusului",
  description: "Descoperă o colecție vastă de resurse academice, proiecte și materiale de studiu create de studenți pentru studenți. Filtrează după universitate, domeniu sau tip de conținut.",
  openGraph: {
    title: "Explorează Resurse | Vocea Campusului",
    description: "Descoperă o colecție vastă de resurse academice, proiecte și materiale de studiu create de studenți pentru studenți. Filtrează după universitate, domeniu sau tip de conținut.",
  },
  twitter: {
    title: "Explorează Resurse | Vocea Campusului",
    description: "Descoperă o colecție vastă de resurse academice, proiecte și materiale de studiu create de studenți pentru studenți. Filtrează după universitate, domeniu sau tip de conținut.",
  }
}

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 