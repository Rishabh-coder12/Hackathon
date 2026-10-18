import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  FileText,
  ChevronLeft,
  ChevronRight,
  List,
  Layers,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { WorkspaceDocument, DetectedSection } from '../../types';

export interface DocumentViewerProps {
  document: WorkspaceDocument;
  onBack: () => void;
  highlightSpan?: { start: number; end: number; label?: string } | null;
  initialEvidence?: { quote?: string; page?: number | null; section?: string | null } | null;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onBack,
  highlightSpan,
  initialEvidence,
}) => {
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sidebarTab, setSidebarTab] = useState<'sections' | 'pages'>('sections');

  const textReaderRef = useRef<HTMLDivElement>(null);

  const sections: DetectedSection[] = document.sections || [];
  const totalPages = document.page_count || (document.page_texts ? Object.keys(document.page_texts).length : 1);
  const hasPages = totalPages > 1;

  // Derive effective highlightSpan if initialEvidence quote is provided
  const effectiveHighlightSpan = React.useMemo(() => {
    if (highlightSpan) return highlightSpan;
    if (initialEvidence?.quote && document.raw_text) {
      const trimmedQuote = initialEvidence.quote.trim();
      if (trimmedQuote) {
        const idx = document.raw_text.indexOf(trimmedQuote);
        if (idx !== -1) {
          return {
            start: idx,
            end: idx + trimmedQuote.length,
            label: 'Evidence Citation',
          };
        }
      }
    }
    return null;
  }, [highlightSpan, initialEvidence, document.raw_text]);

  useEffect(() => {
    // Scroll to top on document open
    if (textReaderRef.current) {
      textReaderRef.current.scrollTop = 0;
    }
  }, [document.id]);

  useEffect(() => {
    if (initialEvidence?.page && initialEvidence.page >= 1 && initialEvidence.page <= totalPages) {
      scrollToPage(initialEvidence.page);
    } else if (initialEvidence?.section && sections.length > 0) {
      const secIdx = sections.findIndex(
        (s) =>
          s.clause_id === initialEvidence.section ||
          s.title.toLowerCase().includes(initialEvidence.section!.toLowerCase())
      );
      if (secIdx !== -1) {
        scrollToSection(secIdx);
      }
    } else if (effectiveHighlightSpan) {
      setTimeout(() => {
        const mark = window.document.getElementById('active-evidence-highlight');
        if (mark) {
          mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [initialEvidence, effectiveHighlightSpan, totalPages, sections]);

  const scrollToSection = (idx: number) => {
    setActiveSectionIdx(idx);
    const element = window.document.getElementById(`section-anchor-${idx}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
    const element = window.document.getElementById(`page-boundary-${pageNum}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderDocumentBody = () => {
    if (!document.raw_text) {
      if (document.file_type === 'pdf') {
        return (
          <EmptyState
            icon={<Clock size={24} />}
            title="PDF Text Extraction Pending"
            description="PDF text extraction is performed on the local backend using PyMuPDF (fitz) to track exact page spans. The backend endpoint GET /api/overview/{session_id} is currently a skeleton and will stream extracted page spans to this viewer in Phase 3."
          />
        );
      }

      return (
        <EmptyState
          icon={<FileText size={24} />}
          title="No Text Content Available"
          description="The selected document contains no readable text content."
        />
      );
    }

    // If effectiveHighlightSpan is provided, slice text into prefix, highlight, and suffix
    if (effectiveHighlightSpan && effectiveHighlightSpan.start >= 0 && effectiveHighlightSpan.end <= document.raw_text.length) {
      const prefix = document.raw_text.slice(0, effectiveHighlightSpan.start);
      const highlighted = document.raw_text.slice(effectiveHighlightSpan.start, effectiveHighlightSpan.end);
      const suffix = document.raw_text.slice(effectiveHighlightSpan.end);

      return (
        <div className="document-text-content" ref={textReaderRef}>
          {prefix}
          <mark
            id="active-evidence-highlight"
            className="evidence-highlight"
            title={`Evidence citation span: [${effectiveHighlightSpan.start}:${effectiveHighlightSpan.end}]`}
          >
            {highlighted}
          </mark>
          {suffix}
        </div>
      );
    }

    // If sections exist, render text with section anchors for smooth navigation
    if (sections.length > 0) {
      return (
        <div className="document-text-content" ref={textReaderRef}>
          {sections.map((sec, idx) => {
            const nextSec = sections[idx + 1];
            const sectionText = nextSec
              ? document.raw_text!.slice(sec.start_char, nextSec.start_char)
              : document.raw_text!.slice(sec.start_char);

            return (
              <div key={idx} style={{ position: 'relative' }}>
                <span id={`section-anchor-${idx}`} className="section-anchor" aria-hidden="true" />
                {idx === 0 && sec.start_char > 0 && (
                  <div>{document.raw_text!.slice(0, sec.start_char)}</div>
                )}
                <div style={{ marginBottom: 12 }}>{sectionText}</div>
              </div>
            );
          })}
        </div>
      );
    }

    // Default continuous text view preserving raw text without alterations
    return (
      <div className="document-text-content" ref={textReaderRef}>
        {document.raw_text}
      </div>
    );
  };

  return (
    <div className="viewer-container" role="region" aria-label="Document Viewer">
      {/* Viewer Header */}
      <div className="viewer-header">
        <div className="viewer-header-left">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            icon={<ArrowLeft size={13} />}
            aria-label="Return to Documents register"
          >
            Back to Documents
          </Button>

          <div className="viewer-title-group">
            <span className="viewer-filename" title={document.filename}>
              {document.filename}
            </span>
            <Badge variant="info">{document.source_type}</Badge>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              {document.file_type}
            </span>
          </div>
        </div>

        <div className="viewer-header-right">
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {formatFileSize(document.file_size_bytes)}
          </span>
          {document.raw_text && (
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              • {document.raw_text.length.toLocaleString()} chars
            </span>
          )}
        </div>
      </div>

      {/* Viewer Body: Sidebar + Main Reading Area */}
      <div className="viewer-body">
        {/* Navigation Sidebar */}
        <aside className="viewer-sidebar" aria-label="Document Navigation">
          <div style={{ display: 'flex', gap: 4, paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)' }}>
            <Button
              variant={sidebarTab === 'sections' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSidebarTab('sections')}
              icon={<List size={12} />}
              style={{ flex: 1 }}
            >
              Sections ({sections.length})
            </Button>
            {hasPages && (
              <Button
                variant={sidebarTab === 'pages' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSidebarTab('pages')}
                icon={<Layers size={12} />}
                style={{ flex: 1 }}
              >
                Pages ({totalPages})
              </Button>
            )}
          </div>

          {sidebarTab === 'sections' && (
            <div className="section-nav-list">
              <div className="viewer-sidebar-title">
                <span>Detected Clauses</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{sections.length}</span>
              </div>

              {sections.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '12px 4px' }}>
                  No numbered sections detected. Document will display as continuous text.
                </div>
              ) : (
                sections.map((sec, idx) => {
                  const isActive = activeSectionIdx === idx;
                  return (
                    <button
                      key={idx}
                      className={`section-nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => scrollToSection(idx)}
                      title={`${sec.clause_id ? sec.clause_id + ' ' : ''}${sec.title}`}
                    >
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sec.clause_id && <strong style={{ marginRight: 4 }}>{sec.clause_id}</strong>}
                        {sec.title}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {sidebarTab === 'pages' && hasPages && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="viewer-sidebar-title">
                <span>Page Navigation</span>
              </div>

              <div className="page-controls">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  icon={<ChevronLeft size={13} />}
                  aria-label="Previous page"
                >
                  Prev
                </Button>

                <span className="page-indicator">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => scrollToPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage >= totalPages}
                  icon={<ChevronRight size={13} />}
                  aria-label="Next page"
                >
                  Next
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`section-nav-item ${currentPage === p ? 'active' : ''}`}
                    onClick={() => scrollToPage(p)}
                  >
                    <span>Page {p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Document Invariant & Provenance Box */}
          <div className="viewer-metadata-box">
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              Grounding Invariant
            </div>
            <div className="viewer-metadata-row">
              <span>Source Type:</span>
              <span>{document.source_type}</span>
            </div>
            <div className="viewer-metadata-row">
              <span>Offsets:</span>
              <span>0 : {document.raw_text?.length || 0}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
              <ShieldAlert size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--status-warning)' }} />
              Verbatim citation rule: findings must match original text character spans exactly.
            </div>
          </div>
        </aside>

        {/* Main Document Reading Area */}
        <main className="viewer-reader-card" aria-label="Document Reader">
          {initialEvidence && (
            <div
              className="callout callout-info"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                <span>
                  <strong>Cited Evidence:</strong> Navigated to citation from Analysis Dashboard
                  {initialEvidence.page ? ` • Page ${initialEvidence.page}` : ''}
                  {initialEvidence.section ? ` • Section ${initialEvidence.section}` : ''}
                </span>
              </div>
              {effectiveHighlightSpan && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  Offsets [{effectiveHighlightSpan.start}:{effectiveHighlightSpan.end}]
                </span>
              )}
            </div>
          )}
          {renderDocumentBody()}
        </main>
      </div>
    </div>
  );
};
