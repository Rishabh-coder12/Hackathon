import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { uploadDocument } from '../../api/client';
import { UploadResponse, DetectedSection } from '../../types';
import { detectSections } from '../../utils/sectionDetector';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB - verified with backend/app/config.py
const ALLOWED_EXTENSIONS = ['.pdf', '.txt'];

export interface DocumentUploadProps {
  onDocumentUploaded?: (
    response: UploadResponse,
    file: File,
    rawText?: string,
    sections?: DetectedSection[]
  ) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onDocumentUploaded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'info' | 'warning' | 'danger' | 'success';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (!file.name || file.name.trim() === '') {
      return 'Selected file has an invalid or empty filename.';
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file format '${ext}'. Only .pdf and .txt rental agreements are supported.`;
    }

    if (file.size === 0) {
      return 'The selected file is empty (0 bytes). Please select a valid rental contract.';
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${formatFileSize(file.size)}) exceeds the maximum allowed limit of 25 MB.`;
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    setValidationError(null);
    setStatusMessage(null);

    if (!files || files.length === 0) {
      return;
    }

    if (files.length > 1) {
      setValidationError('Please select a single document. Multi-document batch upload is not supported in the MVP.');
      return;
    }

    const file = files[0];
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationError(null);
    setStatusMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setStatusMessage(null);

    let rawText: string | undefined = undefined;
    let detectedSections: DetectedSection[] | undefined = undefined;

    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext === 'txt') {
      try {
        rawText = await selectedFile.text();
        detectedSections = detectSections(rawText);
      } catch {
        // Fall back gracefully if reading text fails
      }
    }

    try {
      const response = await uploadDocument(selectedFile);
      // The current backend endpoint is a skeleton returning {"message": "Upload endpoint skeleton", "filename": ...}
      setStatusMessage({
        type: 'info',
        text: `Backend received '${response.filename}'. Status: "${response.message}". Full pipeline ingestion and session indexing are pending in Phase 3.`,
      });
      if (onDocumentUploaded) {
        onDocumentUploaded(response, selectedFile, rawText, detectedSections);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('connect') || errorMsg.includes('Load failed')) {
        setStatusMessage({
          type: 'warning',
          text: 'Local backend is unavailable at 127.0.0.1:8000. Start the server with `python -m uvicorn backend.app.main:app --port 8000`. Document loaded in local offline mode.',
        });
        if (onDocumentUploaded) {
          const offlineResp: UploadResponse = {
            message: 'Local offline upload (backend unavailable)',
            filename: selectedFile.name,
          };
          onDocumentUploaded(offlineResp, selectedFile, rawText, detectedSections);
        }
      } else {
        setStatusMessage({
          type: 'danger',
          text: `Upload request rejected: ${errorMsg}`,
        });
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getFormatBadge = (filename: string) => {
    const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
    return <Badge variant="neutral">{ext}</Badge>;
  };

  return (
    <div className="upload-container" role="region" aria-label="Document Upload Area">
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept=".pdf,.txt,application/pdf,text/plain"
        style={{ display: 'none' }}
        id="document-file-input"
        aria-label="Upload document file input"
      />

      {!selectedFile ? (
        <div
          className={`upload-dropzone ${isDragging ? 'drag-active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Select or drop a rental agreement (PDF or TXT)"
        >
          <div className="upload-dropzone-icon" aria-hidden="true">
            <Upload size={20} />
          </div>
          <div className="upload-dropzone-title">
            Select or drag and drop a rental agreement
          </div>
          <div className="upload-dropzone-desc">
            Supports local PDF agreements (with character span tracking) and plain text (.txt) leases. Max 25 MB.
          </div>
          <div className="upload-dropzone-badges">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </Button>
          </div>
        </div>
      ) : (
        <div className="selected-file-card" aria-label="Selected file details">
          <div className="selected-file-info">
            <div className="selected-file-icon" aria-hidden="true">
              <FileText size={20} />
            </div>
            <div className="selected-file-details">
              <div className="selected-file-name" title={selectedFile.name}>
                {selectedFile.name}
              </div>
              <div className="selected-file-meta">
                <span>{formatFileSize(selectedFile.size)}</span>
                <span>•</span>
                {getFormatBadge(selectedFile.name)}
                <span>•</span>
                <Badge variant="info">contract</Badge>
              </div>
            </div>
          </div>

          <div className="selected-file-actions">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRemoveFile}
              disabled={isUploading}
              icon={<X size={13} />}
            >
              Remove
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpload}
              disabled={isUploading}
              icon={isUploading ? <Clock size={13} /> : <Upload size={13} />}
            >
              {isUploading ? 'Uploading...' : 'Upload Contract'}
            </Button>
          </div>
        </div>
      )}

      {/* Client-side Validation Alert */}
      {validationError && (
        <div className="validation-alert" role="alert" aria-live="polite">
          <AlertCircle size={15} className="validation-alert-icon" aria-hidden="true" />
          <div>{validationError}</div>
        </div>
      )}

      {/* Backend Response or Upload Status Banner */}
      {statusMessage && (
        <div
          className={`upload-status-banner status-${statusMessage.type}`}
          role="status"
          aria-live="polite"
        >
          {statusMessage.type === 'info' && <Clock size={15} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />}
          {statusMessage.type === 'warning' && <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />}
          {statusMessage.type === 'danger' && <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />}
          {statusMessage.type === 'success' && <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />}
          <div>{statusMessage.text}</div>
        </div>
      )}
    </div>
  );
};
