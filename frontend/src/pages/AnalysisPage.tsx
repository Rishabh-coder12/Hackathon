import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldAlert,
  Clock,
  ArrowRight,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { NavigationTab } from '../components/layout/Sidebar';
import {
  WorkspaceDocument,
  Finding,
  FindingCategory,
  QueryResponse,
  Evidence,
} from '../types';
import { analyzeContract, checkBackendHealth, API_BASE } from '../api/client';

export interface AnalysisPageProps {
  documents?: WorkspaceDocument[];
  selectedDocumentId?: string | null;
  onSelectDocument?: (id: string) => void;
  onNavigate?: (tab: NavigationTab) => void;
  onOpenInViewer?: (
    documentId: string,
    evidence?: { quote?: string; page?: number | null; section?: string | null }
  ) => void;
  onUpdateDocumentAnalysis?: (documentId: string, response: QueryResponse) => void;
}

interface FindingCategoryMeta {
  category: FindingCategory;
  label: string;
  badgeVariant: 'info' | 'success' | 'warning' | 'neutral' | 'danger';
  description: string;
}

const CATEGORIES: FindingCategoryMeta[] = [
  { category: 'obligation', label: 'Obligation', badgeVariant: 'info', description: 'Mandatory tenant or landlord duties' },
  { category: 'right', label: 'Right', badgeVariant: 'success', description: 'Privileges explicitly granted to a party' },
  { category: 'deadline', label: 'Deadline', badgeVariant: 'warning', description: 'Time-sensitive notice or payment dates' },
  { category: 'penalty', label: 'Penalty', badgeVariant: 'warning', description: 'Fees or sanctions for late payment or default' },
  { category: 'termination', label: 'Termination', badgeVariant: 'neutral', description: 'Conditions and notice periods for lease end' },
  { category: 'ambiguity', label: 'Ambiguity', badgeVariant: 'warning', description: 'Contradictory or undefined lease language' },
  { category: 'missing_information', label: 'Missing Info', badgeVariant: 'neutral', description: 'Topics absent from agreement; triggers honest abstention' },
  { category: 'potential_legal_concern', label: 'Potential Concern', badgeVariant: 'danger', description: 'Unusual or restrictive terms requiring legal review' },
];

export const AnalysisPage: React.FC<AnalysisPageProps> = ({
  documents = [],
  selectedDocumentId,
  onSelectDocument,
  onNavigate,
  onOpenInViewer,
  onUpdateDocumentAnalysis,
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    selectedDocumentId || (documents[0] ? documents[0].id : null)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBackendUnavailable, setIsBackendUnavailable] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [localAnalysisResults, setLocalAnalysisResults] = useState<Record<string, QueryResponse>>({});

  // Sync internal selected ID when prop changes
  useEffect(() => {
    if (selectedDocumentId) {
      setInternalSelectedId(selectedDocumentId);
    } else if (!internalSelectedId && documents.length > 0) {
      setInternalSelectedId(documents[0].id);
    }
  }, [selectedDocumentId, documents, internalSelectedId]);

  // Current active document
  const currentDocument = documents.find((d) => d.id === internalSelectedId) || null;

  // Analysis result for current document (from document cache or local state)
  const currentAnalysis: QueryResponse | null =
    currentDocument?.analysis ||
    (currentDocument ? localAnalysisResults[currentDocument.id] : null) ||
    null;

  const handleSelectContract = (docId: string) => {
    setInternalSelectedId(docId);
    setErrorMessage(null);
    setIsBackendUnavailable(false);
    if (onSelectDocument) {
      onSelectDocument(docId);
    }
  };

  const handleRunAnalysis = async () => {
    if (!currentDocument) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsBackendUnavailable(false);

    try {
      // First verify backend connectivity to distinguish backend unavailable vs failure
      const health = await checkBackendHealth();
      if (!health) {
        setIsBackendUnavailable(true);
        setIsLoading(false);
        return;
      }

      const response = await analyzeContract(currentDocument.id);

      // Save analysis in document cache and local state
      setLocalAnalysisResults((prev) => ({
        ...prev,
        [currentDocument.id]: response,
      }));

      if (onUpdateDocumentAnalysis) {
        onUpdateDocumentAnalysis(currentDocument.id, response);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('connection refused')) {
        setIsBackendUnavailable(true);
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspectEvidence = (evidence: Evidence) => {
    if (!currentDocument) return;
    if (onOpenInViewer) {
      onOpenInViewer(currentDocument.id, {
        quote: evidence.quote,
        page: evidence.page,
        section: evidence.section,
      });
    } else if (onNavigate) {
      onNavigate('documents');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCategoryMeta = (category: FindingCategory): FindingCategoryMeta => {
    const found = CATEGORIES.find((c) => c.category === category);
    return (
      found || {
        category,
        label: category,
        badgeVariant: 'neutral',
        description: 'Contract finding',
      }
    );
  };

  // Filtered findings list
  const allFindings = currentAnalysis?.findings || [];
  const filteredFindings =
    activeCategoryFilter === 'all'
      ? allFindings
      : allFindings.filter((f) => f.category === activeCategoryFilter);

  // Summary counts
  const totalFindings = allFindings.length;
  const potentialConcernsCount = allFindings.filter((f) => f.category === 'potential_legal_concern').length;
  const missingInfoCount = allFindings.filter((f) => f.category === 'missing_information').length;
  const evidenceCount = currentAnalysis?.evidence_used?.length || allFindings.reduce((acc, f) => acc + (f.evidence?.length || 0), 0);

  return (
    <div className="page-content">
      {/* 2.A Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 className="page-heading">Contract Analysis</h2>
            <p className="page-description">
              Evidence-grounded review of obligations, rights, and potential contractual concerns in the selected contract.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {currentDocument && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (onOpenInViewer) {
                    onOpenInViewer(currentDocument.id);
                  } else if (onNavigate) {
                    onNavigate('documents');
                  }
                }}
                icon={<Eye size={13} />}
                title="Open selected contract in document viewer"
              >
                Open Document
              </Button>
            )}

            {onNavigate && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('documents')}
                icon={<FileText size={13} />}
                title="Return to Documents workspace"
              >
                Documents
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2.B Document Selection Toolbar */}
      {documents.length > 0 && (
        <div className="analysis-toolbar" role="region" aria-label="Contract Selector Toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Active Contract:
            </span>

            <select
              className="analysis-doc-select"
              value={internalSelectedId || ''}
              onChange={(e) => handleSelectContract(e.target.value)}
              aria-label="Select rental contract for analysis"
            >
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.filename} ({doc.file_type.toUpperCase()})
                </option>
              ))}
            </select>

            {currentDocument && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Badge variant="info">{currentDocument.source_type}</Badge>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {formatFileSize(currentDocument.file_size_bytes)}
                </span>
                {currentDocument.char_count && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    • {currentDocument.char_count.toLocaleString()} chars
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAnalysis}
              disabled={isLoading || !currentDocument}
              icon={isLoading ? <Clock size={13} className="spin" /> : <RefreshCw size={13} />}
            >
              {isLoading
                ? 'Analyzing...'
                : currentAnalysis
                ? 'Re-analyze Contract'
                : 'Run Contract Analysis'}
            </Button>
          </div>
        </div>
      )}

      {/* 7.H Backend Unavailable State */}
      {isBackendUnavailable && (
        <div className="callout callout-warning" role="alert">
          <AlertTriangle size={18} className="callout-icon" aria-hidden="true" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ fontWeight: 600 }}>Local Backend Unavailable</div>
            <div style={{ fontSize: '12.5px' }}>
              Could not establish connection to the local API server at <code>{API_BASE}</code>. Ensure the FastAPI backend is running locally on 127.0.0.1:8000.
            </div>
            <div style={{ marginTop: 6 }}>
              <Button variant="secondary" size="sm" onClick={handleRunAnalysis}>
                Check Connection & Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7.G Analysis Failed State */}
      {errorMessage && !isBackendUnavailable && (
        <div className="callout callout-warning" role="alert">
          <AlertTriangle size={18} className="callout-icon" aria-hidden="true" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <div style={{ fontWeight: 600 }}>Analysis Request Failed</div>
            <div style={{ fontSize: '12.5px' }}>
              The local analysis endpoint returned an error: {errorMessage}. Internal details and stack traces are suppressed.
            </div>
            <div style={{ marginTop: 6 }}>
              <Button variant="secondary" size="sm" onClick={handleRunAnalysis}>
                Retry Analysis
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 7.A State A: No Document Selected */}
      {documents.length === 0 && (
        <Panel title="Contract Analysis">
          <EmptyState
            icon={<FileText size={22} />}
            title="No Contract Selected"
            description="Select or upload a rental contract in the Documents workspace to begin evidence-grounded clause triage. All files remain strictly on your local device."
            action={
              onNavigate && (
                <Button variant="primary" size="sm" onClick={() => onNavigate('documents')} icon={<ArrowRight size={13} />}>
                  Go to Documents Workspace
                </Button>
              )
            }
          />
        </Panel>
      )}

      {/* 7.C State C: Analysis in Progress */}
      {isLoading && (
        <Panel title="Analyzing Contract">
          <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
            <Clock size={24} style={{ color: 'var(--accent-primary)' }} className="spin" />
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Running Evidence Retrieval and Triage Analysis
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: 460 }}>
              Querying local BM25 passage index and validating safety constraints against verbatim text at 127.0.0.1:8000. Zero external cloud telemetries.
            </p>
          </div>
        </Panel>
      )}

      {/* 7.B State B: Document Selected but Not Analysed */}
      {currentDocument && !currentAnalysis && !isLoading && !errorMessage && !isBackendUnavailable && (
        <Panel title="Contract Ready for Triage">
          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10 }}>
            <Search size={22} style={{ color: 'var(--text-muted)' }} />
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Analysis Pending for {currentDocument.filename}
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: 520, lineHeight: 1.5 }}>
              The contract is loaded in the session. Click below to run local triage and extract explicit obligations, rights, deadlines, and potential legal concerns backed by verbatim citations.
            </p>
            <div style={{ marginTop: 6 }}>
              <Button variant="primary" size="sm" onClick={handleRunAnalysis} icon={<Search size={13} />}>
                Run Contract Analysis
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* 7.F State F: Insufficient Evidence (Current Backend Response) */}
      {currentAnalysis && currentAnalysis.status === 'insufficient_evidence' && !isLoading && (
        <Panel
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Analysis Summary</span>
              <Badge variant="neutral">Status: insufficient_evidence</Badge>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                fontSize: '12.5px',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                Honest Abstention: Insufficient Supporting Evidence
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                {currentAnalysis.answer || 'Workflow execution pending or insufficient contract evidence found.'}
              </div>
              <div style={{ marginTop: 6, fontSize: '11.5px', color: 'var(--text-muted)' }}>
                The system strictly abstains from inventing contract clauses or guessing obligations when explicit evidence is not found in the uploaded text.
              </div>
            </div>

            {allFindings.length === 0 && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                No explicit findings returned by the model. Note: This does not certify that the lease agreement is free of risk or enforceable.
              </div>
            )}
          </div>
        </Panel>
      )}

      {/* 2.C & 2.D State D: Analysis Completed with Findings */}
      {currentAnalysis && allFindings.length > 0 && !isLoading && (
        <>
          {/* Compact Analysis Summary */}
          <div className="analysis-summary-grid" role="region" aria-label="Analysis Summary Metrics">
            <div className="analysis-stat-card">
              <span className="analysis-stat-value">{totalFindings}</span>
              <span className="analysis-stat-label">Total Findings</span>
            </div>
            <div className="analysis-stat-card">
              <span className="analysis-stat-value" style={{ color: potentialConcernsCount > 0 ? 'var(--warning-text)' : 'inherit' }}>
                {potentialConcernsCount}
              </span>
              <span className="analysis-stat-label">Potential Concerns</span>
            </div>
            <div className="analysis-stat-card">
              <span className="analysis-stat-value">{missingInfoCount}</span>
              <span className="analysis-stat-label">Missing Information</span>
            </div>
            <div className="analysis-stat-card">
              <span className="analysis-stat-value" style={{ color: 'var(--accent-primary)' }}>
                {evidenceCount}
              </span>
              <span className="analysis-stat-label">Citations Grounded</span>
            </div>
          </div>

          {/* Findings Filter Bar */}
          <div className="category-filter-bar" role="tablist" aria-label="Filter findings by category">
            <Button
              variant={activeCategoryFilter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveCategoryFilter('all')}
            >
              All ({totalFindings})
            </Button>
            {CATEGORIES.map((cat) => {
              const count = allFindings.filter((f) => f.category === cat.category).length;
              if (count === 0) return null;
              return (
                <Button
                  key={cat.category}
                  variant={activeCategoryFilter === cat.category ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setActiveCategoryFilter(cat.category)}
                >
                  {cat.label} ({count})
                </Button>
              );
            })}
          </div>

          {/* 2.D Findings List */}
          <div className="findings-list" role="feed" aria-label="Contract Findings List">
            {filteredFindings.map((finding: Finding, idx) => {
              const meta = getCategoryMeta(finding.category);
              const isMissingInfo = finding.category === 'missing_information';

              return (
                <article key={idx} className="finding-card" tabIndex={0}>
                  <header className="finding-card-header">
                    <div className="finding-title-group">
                      <Badge variant={meta.badgeVariant}>{meta.label}</Badge>

                      {/* Display severity ONLY if returned by backend schema (Section 3) */}
                      {finding.severity && (
                        <Badge
                          variant={
                            finding.severity === 'high'
                              ? 'danger'
                              : finding.severity === 'medium'
                              ? 'warning'
                              : finding.severity === 'low'
                              ? 'info'
                              : 'neutral'
                          }
                        >
                          {finding.severity.toUpperCase()} PRIORITY
                        </Badge>
                      )}

                      <h3 className="finding-title">{finding.title}</h3>
                    </div>
                  </header>

                  {/* Plain Language Explanation (Section 4) */}
                  <div className="finding-explanation">
                    {finding.plain_language_explanation}
                  </div>

                  {/* Contract Wording / Explicit Text */}
                  {finding.explicit_text ? (
                    <div className="finding-excerpt-box">
                      <div className="finding-excerpt-label">Contract Wording (Verbatim Passage)</div>
                      <div style={{ fontStyle: 'italic' }}>"{finding.explicit_text}"</div>
                    </div>
                  ) : isMissingInfo ? (
                    <div
                      style={{
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 12px',
                        fontSize: '11.5px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <HelpCircle size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
                      <strong>Honest Abstention:</strong> Explicit clause absent from the lease agreement. The system does not fabricate missing language.
                    </div>
                  ) : null}

                  {/* Interpretation or Potential Concern (Section 4 & 6) */}
                  {finding.interpretation_or_concern && (
                    <div className="finding-concern-box">
                      <div style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', marginBottom: 2 }}>
                        Interpretation / Attention Point
                      </div>
                      <div>{finding.interpretation_or_concern}</div>
                    </div>
                  )}

                  {/* Supporting Evidence Citations (Section 5) */}
                  {finding.evidence && finding.evidence.length > 0 && (
                    <div className="evidence-items-container">
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                        Supporting Evidence Citations ({finding.evidence.length})
                      </div>

                      {finding.evidence.map((ev, evIdx) => (
                        <div key={evIdx} className="evidence-item-card">
                          <div className="evidence-quote-text">
                            "{ev.quote}"
                          </div>

                          <div className="evidence-meta-row">
                            <div className="evidence-meta-tags">
                              <Badge variant="info">{ev.source_type}</Badge>
                              {ev.page !== null && ev.page !== undefined && (
                                <span>Page {ev.page}</span>
                              )}
                              {ev.section && (
                                <span>Section: {ev.section}</span>
                              )}
                              <span style={{ color: 'var(--text-muted)' }}>ID: {ev.source_id}</span>
                            </div>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleInspectEvidence(ev)}
                              icon={<ExternalLink size={11} />}
                              title="Inspect this cited quotation in the document viewer"
                            >
                              Inspect in Viewer
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {/* 7.E State E: No Findings Returned */}
      {currentAnalysis && allFindings.length === 0 && currentAnalysis.status !== 'insufficient_evidence' && !isLoading && (
        <Panel title="Analysis Result">
          <div style={{ padding: '24px 16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={22} style={{ color: 'var(--text-muted)' }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
              No Specific Triage Findings Identified
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', maxWidth: 500, lineHeight: 1.5 }}>
              The analysis evaluated the contract text and returned 0 structured findings under the standard triage categories.
            </p>
            <div className="callout callout-info" style={{ marginTop: 8, textAlign: 'left', maxWidth: 540 }}>
              <ShieldAlert size={15} className="callout-icon" aria-hidden="true" />
              <span>
                <strong>Important Limitation:</strong> An empty findings result does not mean the contract is free of legal risk, balanced, or compliant with local residential tenancy legislation.
              </span>
            </div>
          </div>
        </Panel>
      )}

      {/* Legal Disclaimer Box */}
      <div className="callout callout-info" role="note" aria-label="Legal Disclaimer">
        <ShieldAlert size={16} className="callout-icon" aria-hidden="true" />
        <div>
          <strong>Informational Legal Triage Notice:</strong> This analysis is intended to help tenants and legal reviewers inspect lease provisions and locate relevant text. It does not constitute formal legal advice, representation, or an authoritative determination of legal enforceability. Consult a licensed legal professional for advice regarding specific legal rights.
        </div>
      </div>

      {/* Verification Invariants Reference */}
      <Panel title="Verification & Safety Invariants">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Invariant Rule</th>
                <th style={{ width: '40%' }}>Purpose</th>
                <th style={{ width: '35%' }}>Enforcement Mechanism</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Verbatim Citation</strong></td>
                <td>Guarantees every explicit statement quotes the real contract.</td>
                <td>Sub-string check against raw text; reject on mismatch.</td>
              </tr>
              <tr>
                <td><strong>Honest Abstention</strong></td>
                <td>Ensures missing topics are not filled with generic model guesses.</td>
                <td>Forces <code>explicit_text = null</code> on missing information.</td>
              </tr>
              <tr>
                <td><strong>No Definitive Illegality</strong></td>
                <td>Prevents the system from issuing unauthorized legal rulings.</td>
                <td>Keyword ban on terms like "is illegal" or "is void"; triggers escalation notice.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
