import React, { useState } from 'react';
import { Trash2, FileText, CheckCircle2, Clock, Eye } from 'lucide-react';
import { Panel } from '../components/ui/Panel';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { DocumentUpload } from '../components/documents/DocumentUpload';
import { DocumentViewer } from '../components/documents/DocumentViewer';
import { WorkspaceDocument, UploadResponse, DetectedSection } from '../types';

export interface DocumentsPageProps {
  documents?: WorkspaceDocument[];
  onAddDocument?: (doc: WorkspaceDocument) => void;
  onRemoveDocument?: (id: string) => void;
  selectedDocumentId?: string | null;
  onSelectDocument?: (doc: WorkspaceDocument | null) => void;
  initialEvidence?: { quote?: string; page?: number | null; section?: string | null } | null;
  onCloseViewer?: () => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  documents: externalDocs,
  onAddDocument,
  onRemoveDocument,
  selectedDocumentId,
  onSelectDocument,
  initialEvidence,
  onCloseViewer,
}) => {
  const [localDocs, setLocalDocs] = useState<WorkspaceDocument[]>([]);
  const [localSelectedDoc, setLocalSelectedDoc] = useState<WorkspaceDocument | null>(null);

  const documents = externalDocs !== undefined ? externalDocs : localDocs;

  // Derive selected document either from external selectedDocumentId or local state
  const selectedDocument = React.useMemo(() => {
    if (selectedDocumentId) {
      const found = documents.find((d) => d.id === selectedDocumentId);
      if (found) return found;
    }
    return localSelectedDoc;
  }, [selectedDocumentId, documents, localSelectedDoc]);

  const handleDocumentUploaded = (
    response: UploadResponse,
    file: File,
    rawText?: string,
    sections?: DetectedSection[]
  ) => {
    // If backend returns a session_id or valid document registration, track it
    const ext = file.name.split('.').pop()?.toLowerCase() === 'pdf' ? 'pdf' : 'txt';
    const newDoc: WorkspaceDocument = {
      id: response.session_id || `temp-${Date.now()}`,
      filename: response.filename || file.name,
      file_type: ext,
      file_size_bytes: file.size,
      source_type: 'contract',
      status: response.session_id ? 'ready' : (rawText ? 'ready' : 'pending'),
      uploaded_at: new Date().toLocaleTimeString(),
      raw_text: rawText,
      sections: sections,
      char_count: rawText ? rawText.length : undefined,
    };

    if (onAddDocument) {
      onAddDocument(newDoc);
    } else {
      setLocalDocs((prev) => {
        const filtered = prev.filter((d) => d.filename !== newDoc.filename);
        return [newDoc, ...filtered];
      });
    }
  };

  const handleRemove = (id: string) => {
    if (onRemoveDocument) {
      onRemoveDocument(id);
    } else {
      setLocalDocs((prev) => prev.filter((d) => d.id !== id));
    }
    if (selectedDocument?.id === id) {
      if (onSelectDocument) {
        onSelectDocument(null);
      }
      setLocalSelectedDoc(null);
    }
  };

  const handleOpenDoc = (doc: WorkspaceDocument) => {
    if (onSelectDocument) {
      onSelectDocument(doc);
    } else {
      setLocalSelectedDoc(doc);
    }
  };

  const handleBackToDocs = () => {
    if (onCloseViewer) {
      onCloseViewer();
    }
    if (onSelectDocument) {
      onSelectDocument(null);
    }
    setLocalSelectedDoc(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (selectedDocument) {
    return (
      <div className="page-content">
        <DocumentViewer
          document={selectedDocument}
          onBack={handleBackToDocs}
          initialEvidence={initialEvidence}
        />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-heading">Documents</h2>
        <p className="page-description">
          Manage the contracts you want to review.
        </p>
      </div>

      {/* Upload Interface */}
      <Panel title="Upload Rental Agreement">
        <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />
      </Panel>

      {/* Session Documents Register */}
      <Panel
        title={`Session Documents (${documents.length})`}
      >
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Document Name</th>
                <th style={{ width: '15%' }}>Source Type</th>
                <th style={{ width: '12%' }}>Format</th>
                <th style={{ width: '13%' }}>Size</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '0' }}>
                    <EmptyState
                      icon={<FileText size={20} />}
                      title="No documents in workspace"
                      description="Select or drop a rental agreement (PDF or TXT) above to begin triage. Files remain strictly on your local device."
                    />
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                        onClick={() => handleOpenDoc(doc)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenDoc(doc);
                          }
                        }}
                        aria-label={`Open document ${doc.filename}`}
                        title="Click to open document in viewer"
                      >
                        <FileText size={15} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} aria-hidden="true" />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doc.filename}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant="info">{doc.source_type}</Badge>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', textTransform: 'uppercase' }}>
                        {doc.file_type}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {formatFileSize(doc.file_size_bytes)}
                      </span>
                    </td>
                    <td>
                      {doc.status === 'ready' ? (
                        <Badge variant="success" icon={<CheckCircle2 size={10} />}>Ready</Badge>
                      ) : (
                        <Badge variant="neutral" icon={<Clock size={10} />}>Uploaded</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenDoc(doc)}
                          icon={<Eye size={12} />}
                          title="Open document in viewer"
                        >
                          Open
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemove(doc.id)}
                          icon={<Trash2 size={12} />}
                          title="Remove from session list"
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Source Provenance Policy Reference */}
      <Panel title="Source Provenance Policy">
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: 12 }}>
          To prevent hallucinated rights or obligations, the system enforces a strict boundary between contract text and external legal materials:
        </p>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Source Type</th>
                <th style={{ width: '20%' }}>Scope</th>
                <th style={{ width: '60%' }}>System Boundary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Badge variant="info">contract</Badge>
                </td>
                <td>Active in MVP</td>
                <td>The uploaded lease agreement. Factual findings must cite exact verbatim spans within this text.</td>
              </tr>
              <tr>
                <td>
                  <Badge variant="neutral">legislation</Badge>
                </td>
                <td>Compartmentalized</td>
                <td>Statutory tenancy codes. Separated so the system never claims statutory rights as explicit lease terms.</td>
              </tr>
              <tr>
                <td>
                  <Badge variant="neutral">court_judgment</Badge>
                </td>
                <td>Compartmentalized</td>
                <td>Case law precedents. Maintained as distinct entities to prevent cross-contamination.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
