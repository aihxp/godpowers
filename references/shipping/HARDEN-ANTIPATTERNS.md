# HARDEN Antipatterns

## 1. The Compliance-Only Audit

**Sample**: Auditor runs OWASP top-10 checklist; checks all boxes; ships.

**Why it fails**: OWASP top-10 is a floor, not a ceiling. A compliant
system can still leak through application-specific vulnerabilities the
checklist doesn't cover.

**Fix**: Adversarial review with named threat models. Auditor asks
"what would an attacker who has X try?" and traces the attack path
through actual code, not through a checklist.

## 2. The Findings Without Owner

**Sample**: HARDEN/FINDINGS.md lists 12 findings. None have owners or
deadlines.

**Why it fails**: Findings without owners are graveyards. Three months
later they're still open and no one remembers why.

**Fix**: Every finding gets an owner, severity, and a deadline. CRITICAL
findings block launch. HIGH findings have a deadline within the next
sprint. Open findings auto-surface in /god-status until closed.

## 3. The Untested Remediation

**Sample**: Finding closed because "we added validation." No test
demonstrates the validation works against the original attack.

**Why it fails**: Remediation that wasn't tested may not actually fix
the issue. Regression is invisible.

**Fix**: Each remediation lands with a regression test that fails
without the fix and passes with it. Closed findings link to the test.

## 4. The Auth Boundary Confusion

**Sample**: The system has authentication (who you are) but the team
treats it as authorization (what you can do).

**Why it fails**: Logged-in users can take actions they should not be
allowed to. Authorization is a separate layer.

**Fix**: Document auth boundaries explicitly: identity (who), session
(active), permissions (what). Each layer has its own tests.

## 5. The Trusted Input

**Sample**: Backend trusts data from frontend because "we control both."

**Why it fails**: Anyone can call the backend directly. Frontend
validation prevents accidents, not attacks.

**Fix**: Every input is untrusted. Validation runs on the boundary
between layers, not just at the UI.

## 6. The Outdated Threat Model

**Sample**: Threat model written at /god-init has not been updated even
though the system added a payment integration and a public API.

**Fix**: Threat model is a living document. /god-feature, /god-deploy,
and any change touching trust boundaries triggers a HARDEN review of
the affected boundary.
