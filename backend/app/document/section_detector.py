"""
Section, clause number, and heading detector for rental agreements.
Identifies standard contract numbered sections (e.g., "1. TERM", "2. RENT", "Clause 4.1").
"""

import re
from pydantic import BaseModel


class DetectedSection(BaseModel):
    clause_id: str | None
    title: str
    start_char: int
    end_char: int
    page_num: int


def detect_sections(text: str) -> list[DetectedSection]:
    """Detect numbered clauses and major contract headings within text.

    Detailed implementation in Phase 3.
    """
    pattern = re.compile(
        r"(?:^|\n)(?P<clause>(?:Section|Clause|Article)?\s*\d+(?:\.\d+)*\.?)\s+(?P<title>[A-Z0-9\s,-]{3,50})(?=\n|$)",
        re.IGNORECASE,
    )
    sections: list[DetectedSection] = []
    for match in pattern.finditer(text):
        clause = match.group("clause").strip() if match.group("clause") else None
        title = match.group("title").strip()
        sections.append(
            DetectedSection(
                clause_id=clause,
                title=title,
                start_char=match.start(),
                end_char=match.end(),
                page_num=1,
            )
        )
    return sections
