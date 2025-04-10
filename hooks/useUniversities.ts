"use client"

import { useState, useEffect } from "react"
import universitiesData from "@/data/universities.json"

export type University = {
  id: string
  name: string
  city: string
  faculties: Faculty[]
}

export type Faculty = {
  id: string
  name: string
  universityId: string
  specializations: string[]
}

export function useUniversities() {
  const [universities, setUniversities] = useState<University[]>([])
  const [allFaculties, setAllFaculties] = useState<Faculty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Transform the data to match our expected format
    const transformedData = universitiesData.map((uni, index) => {
      const universityId = `uni_${index}`;
      const faculties = uni.facultati.map((fac, facIndex) => ({
        id: `fac_${index}_${facIndex}`,
        name: fac.nume,
        universityId,
        specializations: fac.specializari,
      }));
      
      return {
        id: universityId,
        name: uni.institutie,
        city: uni.oras,
        faculties,
      };
    });

    // Extract all faculties into a flat array
    const allFacs = transformedData.flatMap((uni) => uni.faculties);

    setUniversities(transformedData);
    setAllFaculties(allFacs);
    setLoading(false);
  }, [])

  const getFacultiesForUniversity = (universityId: string): Faculty[] => {
    const university = universities.find((u) => u.id === universityId)
    return university?.faculties || []
  }

  const getUniversityName = (universityId: string): string => {
    const university = universities.find((u) => u.id === universityId)
    return university?.name || ""
  }

  const getFacultyName = (universityId: string, facultyId: string): string => {
    const faculties = getFacultiesForUniversity(universityId)
    const faculty = faculties.find((f) => f.id === facultyId)
    return faculty?.name || ""
  }

  const getUniversityCity = (universityId: string): string => {
    const university = universities.find((u) => u.id === universityId)
    return university?.city || ""
  }

  return {
    universities,
    faculties: allFaculties,
    loading,
    getFacultiesForUniversity,
    getUniversityName,
    getFacultyName,
    getUniversityCity,
  }
}

