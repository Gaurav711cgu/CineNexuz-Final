# Security Policy & Vulnerability Disclosure

CineNexuz takes security and data protection seriously. We appreciate the efforts of security researchers in keeping our entertainment platform secure.

---

## 🛡️ Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.x.x   | :x:                |

---

## 📬 Reporting a Vulnerability

If you discover a security vulnerability in CineNexuz, please follow our responsible disclosure process:

1. **Do not** report security vulnerabilities through public GitHub issues.
2. Email your findings directly to **security@cinenexus.ai** or **gauravkumarnayak@gmail.com**.
3. Include detailed steps to reproduce the issue, proof of concept (PoC), and affected components.

### ⏱️ Response SLAs
- **Initial Acknowledgment:** Within 24 hours.
- **Triage & Assessment:** Within 48 hours.
- **Security Patch Deployment:** Within 7 business days for critical vulnerabilities.

---

## 🔒 Security Best Practices Implemented
- JWT access & refresh token rotation with Redis blacklist revocation.
- Singleflight cache stampede mutex protection.
- OWASP recommended HTTP security headers (`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`).
- Non-root Docker user execution (`securityContext`).
- Static AST security analysis via Bandit in CI/CD pipeline.
