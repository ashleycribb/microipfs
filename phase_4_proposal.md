# Proposal: Phase 4 — The Verifiable Student

## 1. Vision: From a Private Portfolio to a Verifiable Record

Phase 2 of this project gave students a tool for **private, self-sovereign storage**. Phase 4 will give them a tool for **public, verifiable achievement**.

The goal is to integrate the concepts of Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs) directly into the student portfolio workflow. This will transform the system from a simple storage locker into a true lifelong learning and career passport. When this phase is complete, a student will not only be able to store their work on IPFS but also to hold a cryptographically signed "attestation" from their institution about that work (e.g., a grade, a skill badge, or a formal credit).

---

## 2. Proposed Features

This phase will introduce two core components:

### A. The "Institutional Issuer" Endpoint

*   We will create a new, secure API endpoint, `/issue-credential`.
*   This endpoint will be used by the **institution** (e.g., a teacher or administrator).
*   It will accept a student's DID, the IPFS CID of a piece of student work, and a set of claims (e.g., `grade: "A"`, `skill: "Critical Thinking"`).
*   The endpoint will then generate a W3C-compliant Verifiable Credential, sign it with the institution's private key (held on the server), and return the VC to the issuer, who can then transmit it to the student.

### B. The Student Wallet and Verifier UI

*   We will enhance the `portfolio.html` page to act as a rudimentary **digital wallet**.
*   Students will be able to upload and store the VCs they receive from their school.
*   We will add a "Share Proof" feature. This will allow a student to generate a **Verifiable Presentation**, which is a package containing their DID, the original credential, and a link to the work on IPFS.
*   We will create a simple, public-facing "Verifier" page. Anyone (e.g., an employer) with a link to a Verifiable Presentation can visit this page, and it will automatically verify the cryptographic signatures and confirm that the student's credential is authentic.

---

## 3. Technical Stack

*   **DIDs:** We will use the `did:key` method for simplicity in this proof-of-concept. This method is easy to generate and requires no blockchain interaction.
*   **VCs:** We will use a standard JavaScript library (e.g., `veramo` or a similar W3C VC-JWT library) on the server to create and sign the JSON Web Token (JWT)-based credentials.
*   **Cryptography:** The server will hold a private key for signing credentials. The verification process on the public page will use the corresponding public key.

---

## 4. User Flow

1.  **Student:** A student uploads an essay using the existing client-side encryption feature and gets an IPFS CID. They generate a `did:key` in their portfolio and share it and the CID with their teacher.
2.  **Teacher:** The teacher grades the essay. They access an internal school dashboard and use the `/issue-credential` endpoint, providing the student's DID, the essay's CID, and the grade.
3.  **Student:** The student receives the signed VC from their teacher and adds it to their portfolio "wallet."
4.  **Student (later):** The student applies for a job. They use the "Share Proof" feature to generate a single URL.
5.  **Employer:** The employer clicks the URL, which opens the Verifier page. The page automatically fetches the data, verifies the signatures, and displays a confirmation: "✓ This credential is authentic and was issued by [School Name]."
