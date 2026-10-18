export type SourceType = "contract" | "legislation" | "court_judgment";

export interface Chunk {
  document_id: string;
  source_type: SourceType;
  page_start: number;
  page_end: number;
  clause_id: string | null;
  text: string;
  span_start: number;
  span_end: number;
}

export interface Evidence {
  source_id: string;
  source_type: "contract" | "legislation" | "court_judgment";
  page: number | null;
  section: string | null;
  quote: string;
}

export type FindingCategory =
  | "obligation"
  | "right"
  | "deadline"
  | "penalty"
  | "termination"
  | "ambiguity"
  | "missing_information"
  | "potential_legal_concern";

export interface Finding {
  title: string;
  category: FindingCategory;
  explicit_text: string | null;
  plain_language_explanation: string;
  interpretation_or_concern: string | null;
  evidence: Evidence[];
  severity?: "high" | "medium" | "low" | "informational";
}

export interface DocumentOverview {
  document_id: string;
  filename: string;
  page_count: number;
  char_count: number;
  chunk_count: number;
  extracted_at: string;
}

export interface QueryRequest {
  session_id: string;
  question: string;
}

export interface QueryResponse {
  answer: string;
  status: "answered_with_evidence" | "insufficient_evidence" | "escalation_required";
  findings: Finding[];
  evidence_used: Evidence[];
  disclaimer: string;
}

export interface QAMessage {
  id: string;
  document_id: string;
  question: string;
  timestamp: string;
  response?: QueryResponse;
  is_loading?: boolean;
  error?: string;
}

export interface UploadResponse {
  message: string;
  filename: string;
  session_id?: string;
}

export interface DetectedSection {
  clause_id: string | null;
  title: string;
  start_char: number;
  end_char: number;
  page_num: number;
}

export interface WorkspaceDocument {
  id: string;
  filename: string;
  file_type: "pdf" | "txt";
  file_size_bytes: number;
  source_type: SourceType;
  status: "ready" | "processing" | "pending";
  uploaded_at: string;
  page_count?: number;
  char_count?: number;
  raw_text?: string;
  page_texts?: Record<number, string>;
  sections?: DetectedSection[];
  analysis?: QueryResponse;
  analysisStatus?: "idle" | "loading" | "success" | "error";
  analysisError?: string;
}
