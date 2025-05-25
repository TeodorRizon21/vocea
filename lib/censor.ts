import { BAD_WORDS } from './badWords';

/**
 * Censors bad words in a text by replacing all letters except the first one with asterisks
 * @param text The text to censor
 * @returns The censored text
 */
export function censorText(text: string): string {
  if (!text) return text;

  let censoredText = text;
  
  // Create a regex pattern that matches whole words only
  BAD_WORDS.forEach(word => {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    const firstLetter = word.charAt(0);
    const asterisks = '*'.repeat(word.length - 1);
    const replacement = firstLetter + asterisks;
    censoredText = censoredText.replace(pattern, replacement);
  });

  return censoredText;
}

/**
 * Checks if a text contains any bad words
 * @param text The text to check
 * @returns true if the text contains bad words, false otherwise
 */
export function containsBadWords(text: string): boolean {
  if (!text) return false;

  return BAD_WORDS.some(word => {
    const pattern = new RegExp(`\\b${word}\\b`, 'gi');
    return pattern.test(text);
  });
}

/**
 * Adds a new word to the bad words list
 * @param word The word to add
 */
export function addBadWord(word: string): void {
  if (!BAD_WORDS.includes(word.toLowerCase())) {
    BAD_WORDS.push(word.toLowerCase());
  }
}

/**
 * Removes a word from the bad words list
 * @param word The word to remove
 */
export function removeBadWord(word: string): void {
  const index = BAD_WORDS.indexOf(word.toLowerCase());
  if (index > -1) {
    BAD_WORDS.splice(index, 1);
  }
}

/**
 * Gets the current list of bad words
 * @returns Array of bad words
 */
export function getBadWords(): string[] {
  return [...BAD_WORDS];
} 