/**
 * Local-only API client communicating strictly with 127.0.0.1 backend.
 * No external endpoints or telemetries are permitted.
 */
import { UploadResponse, QueryResponse } from "../types";

const API_BASE = "http://127.0.0.1:8000/api";

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed (${response.status}): ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function getDocumentOverview(sessionId: string): Promise<{ session_id: string; status: string }> {
  const response = await fetch(`${API_BASE}/overview/${encodeURIComponent(sessionId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch document overview (${response.status})`);
  }
  return response.json();
}

export async function getDocumentClauses(sessionId: string): Promise<{ session_id: string; clauses: unknown[] }> {
  const response = await fetch(`${API_BASE}/clauses/${encodeURIComponent(sessionId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch document clauses (${response.status})`);
  }
  return response.json();
}

export async function askQuestion(sessionId: string, question: string): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      question: question,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Question answering failed (${response.status}): ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function analyzeContract(sessionId: string): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      question: "Perform comprehensive contract triage: identify key obligations, tenant rights, deadlines, and potential legal concerns.",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Analysis request failed (${response.status}): ${errorText || response.statusText}`);
  }

  return response.json();
}

export async function checkBackendHealth(): Promise<{ status: string; mode: string } | null> {
  try {
    const response = await fetch("http://127.0.0.1:8000/health", {
      method: "GET",
    });
    if (response.ok) {
      return response.json();
    }
    return null;
  } catch {
    return null;
  }
}

export { API_BASE };
