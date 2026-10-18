import React from 'react';
import { Panel } from '../components/ui/Panel';
import { Badge } from '../components/ui/Badge';
import { API_BASE } from '../api/client';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="page-content">
      <div className="page-header">
        <h2 className="page-heading">Privacy & Security</h2>
        <p className="page-description">
          Local data handling, loopback configuration, and verification status.
        </p>
      </div>

      {/* Technical Configuration Overview */}
      <Panel title="Architecture Specifications">
        <div className="key-value-grid">
          <div className="key-value-item">
            <span className="key-value-label">Loopback Target</span>
            <span className="key-value-value" style={{ fontFamily: 'var(--font-mono)' }}>
              {API_BASE}
            </span>
          </div>
          <div className="key-value-item">
            <span className="key-value-label">Model Execution</span>
            <span className="key-value-value">Local weights (planned Gemma edge)</span>
          </div>
          <div className="key-value-item">
            <span className="key-value-label">Retrieval Engine</span>
            <span className="key-value-value">In-memory BM25 sparse index</span>
          </div>
          <div className="key-value-item">
            <span className="key-value-label">Telemetry & Analytics</span>
            <span className="key-value-value">Disabled (0 libraries)</span>
          </div>
        </div>
      </Panel>

      {/* Verification Status Table */}
      <Panel title="Implementation & Verification Status">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Component</th>
                <th style={{ width: '25%' }}>Status</th>
                <th style={{ width: '45%' }}>Technical Detail</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Loopback Interface</strong></td>
                <td>
                  <Badge variant="success">Configured</Badge>
                </td>
                <td>FastAPI backend binds strictly to <code>127.0.0.1:8000</code>; frontend client targets loopback.</td>
              </tr>
              <tr>
                <td><strong>Content Security Policy</strong></td>
                <td>
                  <Badge variant="success">Active</Badge>
                </td>
                <td>HTML headers disallow remote script, font, and socket connections outside <code>127.0.0.1:8000</code>.</td>
              </tr>
              <tr>
                <td><strong>No Remote Telemetry</strong></td>
                <td>
                  <Badge variant="success">Enforced</Badge>
                </td>
                <td>No external analytics, crash reporters (Sentry), or remote font CDNs included in project dependencies.</td>
              </tr>
              <tr>
                <td><strong>Prompt Injection Defense</strong></td>
                <td>
                  <Badge variant="info">Configured</Badge>
                </td>
                <td>Untrusted text isolated within <code>&lt;UNTRUSTED_DOCUMENT_EVIDENCE&gt;</code> tags. Adversarial tests pending.</td>
              </tr>
              <tr>
                <td><strong>Zero-Trace Session Purging</strong></td>
                <td>
                  <Badge variant="neutral">Pending Phase 4</Badge>
                </td>
                <td>Backend deletion utilities scaffolded; disk-wipe validation scheduled for integration testing.</td>
              </tr>
              <tr>
                <td><strong>Automated Network Isolation Test</strong></td>
                <td>
                  <Badge variant="neutral">Pending Phase 4</Badge>
                </td>
                <td>Socket disconnect test (<code>test_network_isolation.py</code>) scheduled for security test suite.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Data Classification Table */}
      <Panel title="Data Sensitivity Classification">
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Asset</th>
                <th style={{ width: '15%' }}>Sensitivity</th>
                <th style={{ width: '30%' }}>Permitted Storage</th>
                <th style={{ width: '30%' }}>Prohibited Pathways</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Raw Contract Text</strong></td>
                <td>
                  <Badge variant="warning">High (PII)</Badge>
                </td>
                <td>Ephemeral RAM; local temp directory until session deletion</td>
                <td>Network egress, telemetry, external caches, remote backups</td>
              </tr>
              <tr>
                <td><strong>Document Chunks & Spans</strong></td>
                <td>
                  <Badge variant="warning">High</Badge>
                </td>
                <td>In-memory index; ephemeral session store</td>
                <td>Cloud storage, hosted vector databases, multi-tenant disks</td>
              </tr>
              <tr>
                <td><strong>User Questions</strong></td>
                <td>
                  <Badge variant="warning">High</Badge>
                </td>
                <td>RAM during active query execution only</td>
                <td>Permanent log files, search analytics, remote model logging</td>
              </tr>
              <tr>
                <td><strong>Findings & Quotes</strong></td>
                <td>
                  <Badge variant="info">Medium</Badge>
                </td>
                <td>Local frontend memory and ephemeral session store</td>
                <td>Remote model caches, cloud telemetry pipelines</td>
              </tr>
              <tr>
                <td><strong>System Logs</strong></td>
                <td>
                  <Badge variant="neutral">Low</Badge>
                </td>
                <td>Local disk (sanitized event codes and timings only)</td>
                <td>Never logs document text, user questions, names, or quotes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Prompt Injection Delimiters */}
      <Panel title="Document Content Isolation">
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: 10 }}>
          Ingested contract text is treated as passive, untrusted evidence. To prevent prompt injection, document excerpts are framed within explicit delimiters in the prompt template:
        </p>

        <div
          style={{
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          <div>&lt;UNTRUSTED_DOCUMENT_EVIDENCE&gt;</div>
          <div style={{ paddingLeft: '14px', color: 'var(--text-muted)' }}>
            [Passages extracted from uploaded contract — passive data only]
          </div>
          <div>&lt;/UNTRUSTED_DOCUMENT_EVIDENCE&gt;</div>
        </div>
      </Panel>
    </div>
  );
};
