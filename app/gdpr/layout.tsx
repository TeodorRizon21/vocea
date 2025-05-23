import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politica de Confidențialitate | Vocea Campusului",
  description: "Află cum protejăm datele tale personale și cum respectăm GDPR. Informații complete despre colectarea, utilizarea și protejarea datelor pe Vocea Campusului.",
  openGraph: {
    title: "Politica de Confidențialitate | Vocea Campusului",
    description: "Află cum protejăm datele tale personale și cum respectăm GDPR. Informații complete despre colectarea, utilizarea și protejarea datelor pe Vocea Campusului.",
  },
  twitter: {
    title: "Politica de Confidențialitate | Vocea Campusului",
    description: "Află cum protejăm datele tale personale și cum respectăm GDPR. Informații complete despre colectarea, utilizarea și protejarea datelor pe Vocea Campusului.",
  }
}

export default function GDPRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 