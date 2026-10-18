import React, { useState } from 'react';
import { Sidebar, NavigationTab } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { WorkspaceDocument, QueryResponse } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Lifted workspace document state (persists across tab navigation)
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

  // Evidence viewer target when navigating from Analysis Dashboard
  const [viewerTarget, setViewerTarget] = useState<{
    documentId: string;
    evidence?: { quote?: string; page?: number | null; section?: string | null };
  } | null>(null);

  const handleNavigate = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddDocument = (newDoc: WorkspaceDocument) => {
    setDocuments((prev) => {
      const filtered = prev.filter((d) => d.filename !== newDoc.filename);
      return [newDoc, ...filtered];
    });
    setSelectedDocumentId(newDoc.id);
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (selectedDocumentId === id) {
      setSelectedDocumentId(null);
    }
    if (viewerTarget?.documentId === id) {
      setViewerTarget(null);
    }
  };

  const handleOpenInViewer = (
    documentId: string,
    evidence?: { quote?: string; page?: number | null; section?: string | null }
  ) => {
    setSelectedDocumentId(documentId);
    setViewerTarget({ documentId, evidence });
    setActiveTab('documents');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateDocumentAnalysis = (documentId: string, response: QueryResponse) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === documentId
          ? { ...doc, analysis: response, analysisStatus: 'success' }
          : doc
      )
    );
  };

  const currentActiveDoc =
    documents.find((d) => d.id === selectedDocumentId) ||
    documents[0] ||
    null;

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            activeDocument={currentActiveDoc}
          />
        );
      case 'documents':
        return (
          <DocumentsPage
            documents={documents}
            onAddDocument={handleAddDocument}
            onRemoveDocument={handleRemoveDocument}
            selectedDocumentId={viewerTarget ? viewerTarget.documentId : null}
            initialEvidence={viewerTarget?.evidence || null}
            onSelectDocument={(doc) => {
              if (doc) {
                setViewerTarget({ documentId: doc.id });
                setSelectedDocumentId(doc.id);
              } else {
                setViewerTarget(null);
              }
            }}
            onCloseViewer={() => setViewerTarget(null)}
          />
        );
      case 'analysis':
        return (
          <AnalysisPage
            documents={documents}
            selectedDocumentId={currentActiveDoc ? currentActiveDoc.id : null}
            onSelectDocument={(id) => setSelectedDocumentId(id)}
            onNavigate={handleNavigate}
            onOpenInViewer={handleOpenInViewer}
            onUpdateDocumentAnalysis={handleUpdateDocumentAnalysis}
          />
        );
      case 'privacy':
        return <PrivacyPage />;
      default:
        return (
          <DashboardPage
            onNavigate={handleNavigate}
            activeDocument={currentActiveDoc}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="app-main">
        <TopBar
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <main id="main-content" role="main" tabIndex={-1}>
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default App;
