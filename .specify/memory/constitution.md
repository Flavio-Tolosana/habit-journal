<!-- Sync Impact Report
  Version change: N/A → 1.0.0
  Modified principles: N/A (initial creation)
  Added sections: Core Principles (I–X), Security & Data Validation,
    Testing & Quality Gates, Governance
  Removed sections: None
  Follow-up TODOs: None
-->

# Habit Journal Constitution

## Core Principles

### I. Simplicity Over Cleverness
Every implementation MUST be the simplest solution that satisfies the
current requirement. Code MUST NOT use abstractions, patterns, or
indirection unless a concrete, present need justifies them. When two
approaches are equally valid, choose the shorter, more readable one.

### II. Single Responsibility
Each module, component, or function MUST have one clearly defined
responsibility. If a unit of code is difficult to describe in a single
sentence, it MUST be split. Business logic, data access, and
presentation MUST remain separated.

### III. Data Integrity First
Habit entries, streaks, and journal records are the core value of the
application. All mutations to user data MUST be validated at the boundary
and processed through a single authoritative path. Clock time, date
calculations, and timezone handling MUST use a single, consistent
strategy — no ad-hoc date arithmetic.

### IV. Offline-First Resilience
The application MUST function without a network connection. All core
operations — creating entries, viewing history, tracking streaks — MUST
work entirely offline. Sync, when implemented, is a secondary concern
and MUST NOT degrade the offline experience.

### V. Minimal Dependency Footprint
Dependencies MUST be evaluated against the cost of maintaining them. A
new dependency MUST NOT be added if the functionality can be achieved
with less than ~30 lines of straightforward code. Every dependency MUST
have an explicit reason documented at the time of introduction.

### VI. Test-Driven Development (NON-NEGOTIABLE)
Tests MUST be written before implementation for all business logic. The
cycle is: write a failing test → implement the minimum code to pass →
refactor. Tests MUST be deterministic, fast, and independent of external
services. A feature is not complete until its tests pass.

### VII. Accessible by Default
Every user-facing interface MUST meet WCAG 2.1 AA at minimum. Semantic
HTML, keyboard navigability, sufficient color contrast, and screen
reader compatibility are baseline requirements, not afterthoughts.
Accessibility regressions MUST be treated as bugs.

### VIII. Explicit Error Handling
Every error path MUST be handled intentionally — either recovered from,
surfaced to the user with actionable context, or logged with sufficient
detail for debugging. Silent failures, swallowed exceptions, and bare
`catch` blocks that hide errors MUST NOT exist in the codebase.

### IX. Progressive Disclosure
Complexity MUST be hidden until it is needed. Default views, settings,
and workflows MUST present the simplest common case. Advanced features
MUST be opt-in and clearly separated from the primary flow.

### X. Versioned Data Contracts
Any data schema, storage format, or inter-module interface that
persists or crosses a boundary MUST be versioned. Breaking changes to
stored user data MUST include a migration path. Schema changes MUST be
reviewed with the same rigor as API changes.

## Security & Data Validation

- All user input MUST be validated and sanitized at the point of entry
  before reaching any business logic.
- Authentication tokens and credentials MUST NOT be stored in source
  code, logs, or client-side storage in plaintext.
- The application MUST NOT transmit user data over unencrypted channels.
- Session management MUST follow industry best practices (expiration,
  revocation, secure cookie flags where applicable).
- Personal journal data is sensitive. The application MUST NOT leak data
  through error messages, debug output, or third-party analytics without
  explicit user consent.

## Testing & Quality Gates

- Unit tests MUST cover all business logic and data transformation
  functions. Target: ≥90% line coverage on core modules.
- Integration tests MUST verify data persistence, retrieval, and
  consistency across all storage operations.
- UI components MUST have tests for critical user flows (create entry,
  view streak, edit/delete).
- Linting and type checking MUST pass with zero errors before any code
  is merged.
- No feature branch MAY be merged if any previously passing test is
  broken.

## Governance

This constitution is the supreme authority for all development decisions
within the Habit Journal project. When this document conflicts with any
other source of guidance, this constitution takes precedence.

**Amendment Process**: Any change to this constitution MUST be proposed as
a dedicated pull request with a clear rationale, reviewed by at least one
contributor, and merged only after discussion. The PR description MUST
include the specific version bump rationale (MAJOR / MINOR / PATCH).

**Semantic Versioning**:
- MAJOR: Removal or incompatible redefinition of a principle; change to
  governance or amendment process itself.
- MINOR: Addition of a new principle or section; material expansion of
  an existing principle's guidance.
- PATCH: Clarifications, wording improvements, typo fixes, formatting
  corrections that do not alter the meaning of any principle.

**Compliance Review**: All pull requests MUST be reviewed for
constitution compliance as part of the code review process. Quality
gates defined in the Testing & Quality Gates section MUST be enforced
by CI/CD automation wherever technically feasible.

**Version**: 1.0.0 | **Ratified**: 2026-08-26 | **Last Amended**: 2026-08-26
