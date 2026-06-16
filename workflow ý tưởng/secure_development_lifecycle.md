---
description: Nexus-Driven Secure Development Lifecycle (NSDL) Workflow
---
# Workflow: Secure Development Lifecycle (NSDL)

This workflow ensures the product is built fast, but with high quality and security, following the Nexus-Driven Secure Development Lifecycle.

## Phase 1: Secure Design
1. **Threat Modeling:**
   - Identify potential security risks in the defined architecture (e.g., unauthorized access, data leaks).
2. **Security Requirements:**
   - Enforce authentication/authorization rules before writing code.
   - Define input validation mechanisms.

## Phase 2: Code & Quality Assurance
1. **Implementation & Refactoring:**
   - Write code according to the implementation plan.
   - Refactor continuously to keep functions clean and modular.
2. **Automated Verification:**
   - Run type checks, linters, and any available unit tests.
3. **Artifact Generation:**
   - Generate `walkthrough.md` to document the completed features and how to test them manually.
