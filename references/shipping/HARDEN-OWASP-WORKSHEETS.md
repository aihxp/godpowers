# OWASP Top 10 Manual Walkthrough

> Worksheets for each of the OWASP Top 10. Use during /god-harden.

## A01: Broken Access Control

For each protected endpoint:
- [ ] What permission is required?
- [ ] Is the permission check present and correct?
- [ ] Test: unauthenticated user hitting endpoint -> 401
- [ ] Test: authenticated user without permission -> 403
- [ ] Test: authenticated user WITH permission -> 200

```
Endpoint: GET /api/users/:id
Required: authenticated AND (user_id == :id OR role == admin)
Implementation: src/api/users.ts:45 (permission check is line 47)
Tested: yes (test_users_self_access, test_users_other_403, test_users_admin_other_200)
```

## A02: Cryptographic Failures

- [ ] All ePHI / PII / financial data encrypted at rest? (DB-level, not just app-level)
- [ ] All transmissions over TLS 1.2+? (verify with `nmap --script ssl-enum-ciphers`)
- [ ] No hardcoded secrets? (run `grep -ri "sk_live\|api_key\|secret" src/`)
- [ ] No weak algorithms? (no MD5, no SHA1 for security; AES-256 minimum for symmetric; RSA-2048 minimum for asymmetric)
- [ ] Random number generation cryptographically secure? (crypto.randomBytes, not Math.random)

## A03: Injection

For each input source (user form, URL param, header, file upload, third-party webhook):
- [ ] SQL: parameterized queries only? (no string concat)
- [ ] XSS: output encoded? CSP headers in place?
- [ ] Command injection: never pass user input to shell commands?
- [ ] Template injection: safe template engines? No `eval()` of user data?
- [ ] LDAP/XML/NoSQL injection: parameterized?

```
Input: req.body.email (signup endpoint)
Validation: src/auth/signup.ts:23 (zod schema)
Used in: SQL via Prisma (parameterized) - safe
```

## A04: Insecure Design

- [ ] Rate limiting on auth endpoints?
- [ ] Bulk operation safeguards (e.g., delete-all has confirmation)?
- [ ] Race condition risks? (TOCTOU on account balance, e.g.)
- [ ] Business logic flaws? (negative quantities, sign-up bypass, etc.)

## A05: Security Misconfiguration

- [ ] Default credentials removed?
- [ ] Verbose error messages disabled in production?
- [ ] Security headers present? (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] Unnecessary features disabled? (debug endpoints, sample data)
- [ ] Cloud bucket permissions? (no public-by-default S3)

## A06: Vulnerable Components

- [ ] `npm audit` (or equivalent) clean for high+critical?
- [ ] Dependencies updated within last 12 months?
- [ ] Pinned versions or version ranges?

## A07: Authentication Failures

- [ ] Strong password policy?
- [ ] MFA available for sensitive accounts?
- [ ] Session fixation prevented? (rotate session ID on login)
- [ ] Credential stuffing protection? (rate limit, account lockout, captcha)
- [ ] Forgot-password flow secure? (token expiry, single-use)

## A08: Data Integrity Failures

- [ ] Updates signed/verified? (e.g., software updates from upstream)
- [ ] No unsafe deserialization? (no `pickle.loads(user_input)` or equivalent)
- [ ] Critical data has integrity checks? (HMAC, signature)

## A09: Logging Failures

- [ ] Security events logged? (auth, authz failures, admin actions)
- [ ] No sensitive data in logs? (no passwords, no full tokens, no PII unless required and redacted)
- [ ] Alerts on suspicious activity? (e.g., 100 failed logins in 5 min)

## A10: SSRF

- [ ] User-supplied URLs validated? (no localhost, no internal IPs)
- [ ] Internal services not reachable from user-facing endpoints?
- [ ] Cloud metadata endpoints blocked? (169.254.169.254 in AWS, etc.)
