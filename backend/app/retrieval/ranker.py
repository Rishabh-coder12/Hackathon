"""
Relevance ranking, deduplication, and context budget management for retrieved legal chunks.
"""

from backend.app.config import settings
from backend.app.document.schemas import Chunk


def rank_and_deduplicate(
    scored_chunks: list[tuple[Chunk, float]],
    top_k: int = 5,
    min_score: float = 0.5,
) -> list[tuple[Chunk, float]]:
    """Filter by minimum score, sort by BM25 score descending, and deduplicate."""
    valid = [sc for sc in scored_chunks if sc[1] >= min_score]
    valid.sort(key=lambda x: x[1], reverse=True)

    seen_spans = set()
    deduped = []
    for chunk, score in valid:
        key = (chunk.document_id, chunk.span_start, chunk.span_end)
        if key not in seen_spans:
            seen_spans.add(key)
            deduped.append((chunk, score))
        if len(deduped) >= top_k:
            break

    return deduped
