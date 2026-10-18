import { describe, it, expect } from 'vitest';
import { detectSections } from './sectionDetector';

describe('Section Detector', () => {
  it('detects numbered clauses accurately from contract text', () => {
    const contractText = `RESIDENTIAL LEASE AGREEMENT

1. PARTIES
Oakridge Properties LLC and Jane Doe.

2. PREMISES
Apartment 3B, Springfield.

3. TERM
Expiring on January 31, 2027.

4. RENT
$1,200.00 payable monthly.`;

    const sections = detectSections(contractText);
    expect(sections).toHaveLength(4);

    expect(sections[0].clause_id).toBe('1.');
    expect(sections[0].title).toBe('PARTIES');
    expect(contractText.slice(sections[0].start_char, sections[0].end_char)).toBe('1. PARTIES');

    expect(sections[1].clause_id).toBe('2.');
    expect(sections[1].title).toBe('PREMISES');
    expect(contractText.slice(sections[1].start_char, sections[1].end_char)).toBe('2. PREMISES');

    expect(sections[2].clause_id).toBe('3.');
    expect(sections[2].title).toBe('TERM');
    expect(contractText.slice(sections[2].start_char, sections[2].end_char)).toBe('3. TERM');

    expect(sections[3].clause_id).toBe('4.');
    expect(sections[3].title).toBe('RENT');
    expect(contractText.slice(sections[3].start_char, sections[3].end_char)).toBe('4. RENT');
  });

  it('detects Clause, Section, and Article prefixed clauses', () => {
    const text = `Clause 1.1 DEFINITIONS AND INTERPRETATIONS
Section 2 SECURITY DEPOSIT TERMS
Article 3 MAINTENANCE OBLIGATIONS`;

    const sections = detectSections(text);
    expect(sections).toHaveLength(3);
    expect(sections[0].clause_id).toBe('Clause 1.1');
    expect(sections[0].title).toBe('DEFINITIONS AND INTERPRETATIONS');

    expect(sections[1].clause_id).toBe('Section 2');
    expect(sections[1].title).toBe('SECURITY DEPOSIT TERMS');

    expect(sections[2].clause_id).toBe('Article 3');
    expect(sections[2].title).toBe('MAINTENANCE OBLIGATIONS');
  });

  it('returns empty array when no numbered sections exist', () => {
    const text = 'This is a general paragraph without any numbered clauses or section titles.';
    const sections = detectSections(text);
    expect(sections).toEqual([]);
  });

  it('detects all 10 standard clauses from sample residential lease with exact offsets', () => {
    const lease = `RESIDENTIAL LEASE AGREEMENT

1. PARTIES
This Residential Lease Agreement ("Agreement") is made this 1st day of January, 2026.

2. PREMISES
Landlord leases to Tenant the real property located at 742 Evergreen Terrace.

3. TERM
The term of this lease shall commence on February 1, 2026.

4. RENT
Tenant agrees to pay monthly rent in the amount of $1,200.00.

5. SECURITY DEPOSIT
Upon execution of this Agreement, Tenant shall deposit with Landlord the sum of $1,500.00.

6. UTILITIES
Tenant shall be responsible for payment of all electricity and gas.

7. PETS
No animals, livestock, or pets of any kind shall be brought upon the premises.

8. MAINTENANCE AND REPAIRS
Tenant agrees to maintain the Premises in a clean and sanitary condition.

9. SUBLETTING AND ASSIGNMENT
Tenant shall not assign this lease or sublet any portion of the Premises.

10. TERMINATION AND NOTICE
Either party may terminate this tenancy upon its stated expiration date.`;

    const sections = detectSections(lease);
    expect(sections).toHaveLength(10);

    const expectedClauses = [
      { id: '1.', title: 'PARTIES' },
      { id: '2.', title: 'PREMISES' },
      { id: '3.', title: 'TERM' },
      { id: '4.', title: 'RENT' },
      { id: '5.', title: 'SECURITY DEPOSIT' },
      { id: '6.', title: 'UTILITIES' },
      { id: '7.', title: 'PETS' },
      { id: '8.', title: 'MAINTENANCE AND REPAIRS' },
      { id: '9.', title: 'SUBLETTING AND ASSIGNMENT' },
      { id: '10.', title: 'TERMINATION AND NOTICE' },
    ];

    sections.forEach((sec, i) => {
      expect(sec.clause_id).toBe(expectedClauses[i].id);
      expect(sec.title).toBe(expectedClauses[i].title);
      // Offset slice must match verbatim
      const rawSlice = lease.slice(sec.start_char, sec.end_char);
      expect(rawSlice).toBe(`${expectedClauses[i].id} ${expectedClauses[i].title}`);
    });
  });

  it('handles empty or blank text gracefully without crashing', () => {
    expect(detectSections('')).toEqual([]);
    expect(detectSections('   \n  \n  ')).toEqual([]);
  });
});
