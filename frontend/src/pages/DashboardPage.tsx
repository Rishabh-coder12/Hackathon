import React from 'react';
import { ArrowRight, FileText, ShieldAlert } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import { EmptyState } from '../components/ui/EmptyState';
import { NavigationTab } from '../components/layout/Sidebar';
import { WorkspaceDocument } from '../types';
import { Badge } from '../components/ui/Badge';

export interface DashboardPageProps {
  onNavigate: (tab: NavigationTab) => void;
  activeDocument?: WorkspaceDocument | null;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, activeDocument }) => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-heading">Document Overview</h2>
        <p className="page-description">
          Review residential and commercial rental agreements against explicit contract terms.
        </p>
      </div>

      {/* Active Agreement Section */}
      <Panel
        title="Current Agreement"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('documents')}
            icon={<ArrowRight size={13} />}
          >
            Go to Documents
          </Button>
        }
      >
        {activeDocument ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '12px 14px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <FileText size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13.5px' }}>
                  {activeDocument.filename}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Badge variant="info">{activeDocument.source_type}</Badge>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    {activeDocument.file_type}
                  </span>
                  {activeDocument.char_count && (
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                      • {activeDocument.char_count.toLocaleString()} chars
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('analysis')}
              >
                Contract Analysis
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigate('documents')}
              >
                View in Documents
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<FileText size={20} />}
            title="No agreement loaded in this session"
            description="Load a lease agreement in the Documents section to begin extracting clauses, tenant obligations, and deadlines."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate('documents')}
              >
                Open Documents
              </Button>
            }
          />
        )}
      </Panel>

      {/* Triage Workflow Summary */}
      <Panel title="Triage Procedure">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Stage</th>
                <th style={{ width: '38%' }}>Mechanism</th>
                <th style={{ width: '40%' }}>Verification & Safety Standard</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>1. Ingestion</strong></td>
                <td>Parses PDF or TXT contract files locally in memory.</td>
                <td>Records exact character offsets (<code>span_start</code>, <code>span_end</code>) for citation verification.</td>
              </tr>
              <tr>
                <td><strong>2. Retrieval</strong></td>
                <td>Sparse BM25 indexing over segmented clauses.</td>
                <td>Strictly local ranking; abstains with "insufficient evidence" when terms are absent.</td>
              </tr>
              <tr>
                <td><strong>3. Clause Review</strong></td>
                <td>Structures obligations, deadlines, and potential ambiguities.</td>
                <td>Every explicit statement requires verbatim evidence. Never issues definitive rulings on legal enforceability.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Scope & Notice */}
      <div className="callout callout-info">
        <ShieldAlert size={16} className="callout-icon" aria-hidden="true" />
        <div>
          <strong>Informational triage only:</strong> This tool is designed to help tenants and legal reviewers identify relevant contract language and spot potential ambiguities. It does not establish an attorney-client relationship or provide formal legal advice.
        </div>
      </div>
    </div>
  );
};
