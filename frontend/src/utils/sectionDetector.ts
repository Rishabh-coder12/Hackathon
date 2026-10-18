import { DetectedSection } from '../types';

/**
 * Detects contract section headings and numbered clauses within extracted text.
 * Aligns with backend regex in backend/app/document/section_detector.py.
 */
export function detectSections(text: string): DetectedSection[] {
  if (!text) return [];

  // Match: (Section|Clause|Article)? <number> <HEADING_TITLE>
  // Aligns with backend regex in backend/app/document/section_detector.py
  const pattern = /(?:^|[\r\n]+)((?:Section|Clause|Article)?[ \t]*\d+(?:\.\d+)*\.?)[ \t]+([A-Z0-9\s,-]{3,50})(?=\r?\n|$)/gi;
  const sections: DetectedSection[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const clause = match[1] ? match[1].trim() : null;
    const title = match[2] ? match[2].trim() : '';

    if (title && match[1]) {
      const clauseOffset = match[0].indexOf(match[1]);
      const startChar = match.index + clauseOffset;
      const endChar = match.index + match[0].length;

      sections.push({
        clause_id: clause,
        title,
        start_char: startChar,
        end_char: endChar,
        page_num: 1,
      });
    }
  }

  return sections;
}

