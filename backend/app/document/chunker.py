"""
Contract-aware chunker.
Splits documents by legal clauses first, preserving exact span offsets.
Invariant: raw_text[chunk.span_start : chunk.span_end] == chunk.text
"""

from backend.app.document.schemas import Chunk, ExtractedDocument, SourceType


def chunk_document(
    extracted_doc: ExtractedDocument,
    max_chunk_chars: int = 1200,
    min_chunk_chars: int = 50,
) -> list[Chunk]:
    """Chunk extracted document by legal structure and page boundaries.

    Detailed implementation and comprehensive span invariant tests in Phase 3.
    """
    chunks: list[Chunk] = []
    raw_text = extracted_doc.raw_text

    # Default fallback chunking for Phase 1 skeleton
    for page_num, (start_span, end_span) in extracted_doc.page_spans.items():
        page_text = raw_text[start_span:end_span]
        if not page_text.strip():
            continue

        chunks.append(
            Chunk(
                document_id=extracted_doc.metadata.document_id,
                source_type=SourceType.CONTRACT,
                page_start=page_num,
                page_end=page_num,
                clause_id=f"page-{page_num}",
                text=page_text,
                span_start=start_span,
                span_end=end_span,
            )
        )

    return chunks
