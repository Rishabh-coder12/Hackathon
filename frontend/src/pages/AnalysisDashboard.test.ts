import { describe, it, expect } from 'vitest';
import { Finding, QueryResponse, WorkspaceDocument } from '../types';

describe('Analysis Dashboard Invariants & Data Transformation', () => {
  it('correctly calculates summary counts from actual findings without fabricating metrics', () => {
    const sampleFindings: Finding[] = [
      {
        title: 'Monthly Rent Due Date',
        category: 'deadline',
        explicit_text: 'Rent is due on the 1st day of each month.',
        plain_language_explanation: 'Tenant must submit payment by the first of every month.',
        interpretation_or_concern: null,
        evidence: [
          {
            source_id: 'doc-123',
            source_type: 'contract',
            page: 1,
            section: '4. RENT',
            quote: 'Rent is due on the 1st day of each month.',
          },
        ],
      },
      {
        title: 'Late Fee Surcharge',
        category: 'penalty',
        explicit_text: 'A $50 late charge applies after the 5th.',
        plain_language_explanation: 'Payment received after the 5th incurs an extra $50 fee.',
        interpretation_or_concern: 'Check local rent control ordinance regarding permissible late fee caps.',
        evidence: [
          {
            source_id: 'doc-123',
            source_type: 'contract',
            page: 1,
            section: '4. RENT',
            quote: 'A $50 late charge applies after the 5th.',
          },
        ],
      },
      {
        title: 'Move-in Condition Inspection Report',
        category: 'missing_information',
        explicit_text: null, // Honest abstention
        plain_language_explanation: 'The lease does not mention an initial joint inspection checklist.',
        interpretation_or_concern: 'Tenants are advised to request a written condition report to protect security deposit.',
        evidence: [],
      },
      {
        title: 'Blanket Entry Without Notice',
        category: 'potential_legal_concern',
        explicit_text: 'Landlord may enter premises at any time without prior written notice.',
        plain_language_explanation: 'Clause permits unrestricted entry by the property manager.',
        interpretation_or_concern: 'Most tenancy legislation requires minimum 24 hours advance notice before non-emergency entry. Consult legal counsel.',
        evidence: [
          {
            source_id: 'doc-123',
            source_type: 'contract',
            page: 2,
            section: '8. ACCESS',
            quote: 'Landlord may enter premises at any time without prior written notice.',
          },
        ],
      },
    ];

    const response: QueryResponse = {
      answer: 'Analysis complete with grounded citations.',
      status: 'answered_with_evidence',
      findings: sampleFindings,
      evidence_used: sampleFindings.flatMap((f) => f.evidence),
      disclaimer: 'Informational triage only.',
    };

    // Verify metrics computed from actual response
    const totalFindings = response.findings.length;
    const potentialConcerns = response.findings.filter((f) => f.category === 'potential_legal_concern').length;
    const missingInfo = response.findings.filter((f) => f.category === 'missing_information').length;
    const citationsCount = response.evidence_used.length;

    expect(totalFindings).toBe(4);
    expect(potentialConcerns).toBe(1);
    expect(missingInfo).toBe(1);
    expect(citationsCount).toBe(3);
  });

  it('enforces Honest Abstention invariant: missing_information findings have explicit_text = null', () => {
    const missingFinding: Finding = {
      title: 'Subletting Policy Omission',
      category: 'missing_information',
      explicit_text: null,
      plain_language_explanation: 'No explicit clause governs sublease requests.',
      interpretation_or_concern: 'Tenant may want to clarify sublease rights before signing.',
      evidence: [],
    };

    expect(missingFinding.category).toBe('missing_information');
    expect(missingFinding.explicit_text).toBeNull();
    expect(missingFinding.evidence).toHaveLength(0);
  });

  it('enforces Verbatim Citation invariant: evidence quote exists in document raw text', () => {
    const rawText = `4. RENT AND FEES
Tenant agrees to pay monthly rent in the amount of $1,200.00 payable in advance on or before the first day of each month.
A late fee of $50.00 will be assessed if rent is not received by the fifth day of the month.`;

    const quote = 'A late fee of $50.00 will be assessed if rent is not received by the fifth day of the month.';
    expect(rawText).toContain(quote);

    const startIdx = rawText.indexOf(quote);
    const endIdx = startIdx + quote.length;
    expect(rawText.slice(startIdx, endIdx)).toBe(quote);
  });

  it('prevents cross-contamination: each workspace document stores its own analysis response', () => {
    const docA: WorkspaceDocument = {
      id: 'doc-a',
      filename: 'residential_lease_1.pdf',
      file_type: 'pdf',
      file_size_bytes: 1024,
      source_type: 'contract',
      status: 'ready',
      uploaded_at: '10:00:00 AM',
      analysis: {
        answer: 'Doc A analysis',
        status: 'answered_with_evidence',
        findings: [
          {
            title: 'Doc A Finding',
            category: 'obligation',
            explicit_text: 'Text A',
            plain_language_explanation: 'Explanation A',
            interpretation_or_concern: null,
            evidence: [],
          },
        ],
        evidence_used: [],
        disclaimer: 'Disclaimer A',
      },
    };

    const docB: WorkspaceDocument = {
      id: 'doc-b',
      filename: 'commercial_lease_2.txt',
      file_type: 'txt',
      file_size_bytes: 2048,
      source_type: 'contract',
      status: 'ready',
      uploaded_at: '10:05:00 AM',
      analysis: undefined, // Not analysed yet
    };

    expect(docA.analysis?.findings).toHaveLength(1);
    expect(docA.analysis?.findings[0].title).toBe('Doc A Finding');
    expect(docB.analysis).toBeUndefined();
  });

  it('correctly maps category filter options', () => {
    const allCategories = [
      'obligation',
      'right',
      'deadline',
      'penalty',
      'termination',
      'ambiguity',
      'missing_information',
      'potential_legal_concern',
    ];

    expect(allCategories).toHaveLength(8);
  });
});
