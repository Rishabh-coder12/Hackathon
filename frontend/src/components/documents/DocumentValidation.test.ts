import { describe, it, expect } from 'vitest';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.txt'];

function validateDocumentFile(name: string, size: number): string | null {
  if (!name || name.trim() === '') {
    return 'Selected file has an invalid or empty filename.';
  }

  const ext = '.' + name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Unsupported file format '${ext}'. Only .pdf and .txt rental agreements are supported.`;
  }

  if (size === 0) {
    return 'The selected file is empty (0 bytes). Please select a valid rental contract.';
  }

  if (size > MAX_FILE_SIZE_BYTES) {
    return 'File size exceeds the maximum allowed limit of 25 MB.';
  }

  return null;
}

describe('Document Client-Side Validation', () => {
  it('accepts valid PDF agreements within size limits', () => {
    expect(validateDocumentFile('standard_residential_lease.pdf', 1024 * 500)).toBeNull();
  });

  it('accepts valid TXT agreements within size limits', () => {
    expect(validateDocumentFile('commercial_office_lease.txt', 1024 * 10)).toBeNull();
  });

  it('rejects unsupported file formats', () => {
    expect(validateDocumentFile('contract.docx', 1024)).toContain('Unsupported file format');
    expect(validateDocumentFile('scanned_image.png', 1024)).toContain('Unsupported file format');
    expect(validateDocumentFile('document.zip', 1024)).toContain('Unsupported file format');
  });

  it('rejects empty 0-byte files', () => {
    expect(validateDocumentFile('empty_agreement.pdf', 0)).toContain('empty (0 bytes)');
  });

  it('rejects files exceeding 25 MB', () => {
    const oversized = 26 * 1024 * 1024;
    expect(validateDocumentFile('large_lease.pdf', oversized)).toContain('exceeds the maximum allowed limit of 25 MB');
  });

  it('rejects files with empty or whitespace names', () => {
    expect(validateDocumentFile('', 1024)).toContain('invalid or empty filename');
    expect(validateDocumentFile('   ', 1024)).toContain('invalid or empty filename');
  });
});
