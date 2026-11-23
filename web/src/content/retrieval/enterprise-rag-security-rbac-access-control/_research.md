# RAG security: manual evidence review

Reviewed September 22, 2026. These are source-specific editorial notes, not a generated review certificate. The Python examples are local policy fixtures; no deployed identity provider, vector service, permission connector, model, attack decoder, or compliance assessment was exercised.

## Authorization and retrieval

- Deny-by-default and per-request permission checks: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html . The trusted boundary is defined by privileges and handling, not solely process memory.
- PostgreSQL owners normally bypass RLS unless forced; superusers and BYPASSRLS roles still bypass it: https://www.postgresql.org/docs/current/ddl-rowsecurity.html . Test the application's actual connection role.
- Approximate pgvector scans can underfill after a selective filter; iterative scans stop at configured limits: https://github.com/pgvector/pgvector#filtering and https://github.com/pgvector/pgvector#iterative-index-scans . Security and recall are separate contracts. No SQL or ANN benchmark was run.
- Weaviate constructs an allow-list and can traverse other nodes while admitting eligible IDs only. ACORN is documented as the default from v1.34: https://docs.weaviate.io/weaviate/concepts/filtering . Filter capabilities don't authenticate a caller or constrain an unrestricted credential.
- Pinecone metadata operators: https://docs.pinecone.io/guides/search/filter-by-metadata . The canonical record and Python adapter aren't vendor-ready payloads.
- Graph reports require current access to every contributing source, including merged-description dependencies. Mixed ACL labels aren't inherently unsafe for a caller holding all grants. Block stale derived text during repair. This is an application contract, not a claimed built-in GraphRAG feature.

## Permission synchronization and identities

- Graph webhook endpoints can be throttled and notifications dropped: https://learn.microsoft.com/en-us/graph/change-notifications-delivery-webhooks . Don't claim every source sends complete ACLs or guarantees seconds-long propagation.
- Drive provides paginated change cursors: https://developers.google.com/workspace/drive/api/guides/manage-changes . Connector support determines reconciliation of permissions, memberships, and removals. An hourly audit-log sweep isn't universal.
- Revocation doesn't require re-embedding unchanged text. A tombstone denies reads but isn't erasure. Clearing groups doesn't clear other grants. Five-minute freshness and sixty-second task lifetimes are illustrative choices; revocation also depends on detection and current memberships.
- API access tokens and sign-in ID tokens have different purposes: https://learn.microsoft.com/en-us/entra/identity-platform/access-tokens . Access tokens aren't universally JWTs.
- Constrain JWT algorithms, issuer keys, audience, and token purpose; don't trust arbitrary key URLs: https://www.rfc-editor.org/rfc/rfc8725.html . A signature establishes integrity, not permission freshness.
- Entra's subject is application-specific; directory identity can use tenant-qualified oid. Group overage can omit the group list: https://learn.microsoft.com/en-us/entra/identity-platform/access-token-claims-reference . Claims and partition mappings are provider-specific.
- Validate tenant, subject, actor, and scopes: https://learn.microsoft.com/en-us/entra/identity-platform/claims-validation . Don't authorize using display names or caller-written tenant headers.
- HMAC verifiers can mint tokens because they share the key. The fixture tests request binding and one-time use, not public-key JWTs. A stolen bearer token can win first use: https://www.rfc-editor.org/rfc/rfc6750.html . Short expiry doesn't establish zero standing privileges if broad grants can be renewed indefinitely.

## Injection, integrity, and sensitive representations

- The current OWASP site identifies the taxonomy as the 2025 LLM Top 10: https://genai.owasp.org/llmrisk/llm01-prompt-injection/ and https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/ . Delimiters mitigate risk without proving prevention.
- Indirect injection comes through external observations: https://arxiv.org/abs/2302.12173 . Authorized text isn't authority to execute actions.
- System-level agent constraints complement heuristic defenses: https://arxiv.org/html/2506.08837v1 . Signatures don't establish a safe procedure; relevant wording doesn't guarantee first rank.
- Vec2Text assumes black-box encoder queries. Recovery varies by setup and length; clinical-note names were inserted pseudonyms: https://arxiv.org/html/2310.06816v1 . Don't claim arbitrary passwords, real patient identities, or universal exact inversion.
- Community Presidio documentation distinguishes identification from de-identification and warns detection isn't complete: https://presidio.dataprivacystack.org/ . Citation membership doesn't establish sentence support. Buffer drafts for a whole-answer send gate.
- Original guardrail tools aren't guaranteed authorization or injection defenses: https://arxiv.org/abs/2310.10501 and https://arxiv.org/abs/2312.06674 .

## Compliance scope

- SOC 2 examines service-organization controls, not namespace layout: https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services .
- Applicable HIPAA safeguards for electronic PHI: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html . This lesson doesn't certify compliance or prescribe one legally sufficient index layout.

The earlier generated packet's unsupported product dates, top-k guarantees, mandatory raw-prompt logging, instantaneous synchronization, and guessed vendor URLs were removed. Relevant passages were checked; entire papers and every connector path aren't claimed.
