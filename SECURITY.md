# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Godpowers, please report it
responsibly.

### How to Report

1. Do NOT open a public GitHub issue
2. Email the maintainers (see project README for contact)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested remediation if you have one

### What to Expect

- Acknowledgment within 7 days
- Assessment within 14 days
- Fix timeline based on severity
- Credit in the CHANGELOG when the fix ships (unless you prefer anonymity)

## Scope

Godpowers is a meta-prompting framework. Security concerns include:

### In scope
- Vulnerabilities in `bin/install.js` (file system access, path traversal)
- Vulnerabilities in `hooks/*.sh` (command injection, privilege escalation)
- Vulnerabilities in `scripts/*.{sh,js}` (CI / test infrastructure)
- Skill or agent prompts that could be exploited to leak credentials

### Out of scope
- AI model behavior (report to the model provider)
- Issues in dependencies (report upstream)
- Social engineering of AI agents (use `--conservative` mode)

## Hardening Recommendations

When using Godpowers in a sensitive context:

1. **Review `--yolo` decisions**: Before merging or deploying, read
   `.godpowers/YOLO-DECISIONS.md` to verify auto-picked defaults match intent
2. **Never accept Critical findings under `--yolo`**: This is enforced by the
   framework but worth re-checking
3. **Keep `.godpowers/` out of public repos** if it contains sensitive PRD
   content (add to `.gitignore` per-project)
4. **Review hooks before installing**: `hooks/pre-tool-use.sh` and
   `hooks/session-start.sh` run with your shell privileges
5. **Verify the npm package signature**: `npm install godpowers --verify`

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.3.x   | Yes |
| 0.2.x   | Security fixes only |
| < 0.2   | No |

## Disclosure Policy

We follow coordinated disclosure:

1. Reporter privately reports the issue
2. We acknowledge within 7 days
3. We work on a fix
4. We coordinate disclosure timing with the reporter
5. Public disclosure happens after the fix is released

We aim for fix-to-disclosure within 90 days for most issues, faster for
Critical severity.
