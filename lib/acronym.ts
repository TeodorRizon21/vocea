export function generateAcronym(name: string): string {
  if (!name) return ""

  // Skip common words like "de", "și", etc.
  const skipWords = ["de", "si", "și", "la", "in", "în", "din", "cu", "pentru", "a", "al", "ale"]

  // Replace escaped quotes with regular quotes
  const normalizedName = name.replace(/\\"/g, '"')

  // Extract words from the string, including those in quotes
  const words = normalizedName
    .split(/[ ,-]+/) // Split by spaces, commas, or hyphens
    .map((word) => {
      // Remove quotes if they exist
      return word
        .replace(/^"(.+)"$/, "$1")
        .replace(/^"(.+)$/, "$1")
        .replace(/^(.+)"$/, "$1")
    })
    .filter((word) => word.length > 0 && !skipWords.includes(word.toLowerCase()))

  // Get first letter of each word and join them
  return words
    .map((word) => word[0].toUpperCase()) // Get first letter of each word
    .join("")
}

