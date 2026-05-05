# microipfs: The Permanent Record as a Service

> A scalable microservice for creating permanent, verifiable academic records on IPFS.

This project provides a suite of tools for educational institutions to transition to a model of student-owned, verifiable digital records. It acts as a "Permanent Record as a Service," leveraging the power of IPFS for immutable storage and Verifiable Credentials for cryptographic proof.

# Core Features

1.  **Batch Archiving (`/batch-archive`):** A scalable endpoint for institutions to archive large volumes of student work (e.g., end-of-semester projects) to IPFS. It returns a single, easily-managed root CID for the entire batch.
2.  **Verifiable Credentials with IPFS Proof (`/issue-credential`):** A system for issuing tamper-proof academic credentials (e.g., for a diploma or a specific skill) that are cryptographically linked to the underlying student work stored on IPFS.
3.  **Student-Owned Identity & Data:** The platform includes reference implementations for a student-run digital wallet (`/portfolio.html`) with client-side encryption, and a public verifier (`/verify.html`) that can perform "deep verification" of a credential and its linked proof of work.
4.  **Learning Object Repository (`/add-learning-object`):** A tool for creating permanent, resilient archives of open educational resources.
5.  **AI Model Playground (`/playground.html`):** An interactive tool for running small AI/ML models directly in the browser from IPFS.

---

# Installation and Setup

## 1. Install Dependencies
```bash
npm install
```

## 2. Configure Environment
Create a `.env` file in the root of the project and add your `NFT_STORAGE_KEY`.
```
NFT_STORAGE_KEY=<YOUR_API_KEY>
```

## 3. Run the Server
```bash
node index.js
```
The server will start, and if `keys.json` is not found, it will generate a new key pair for signing Verifiable Credentials.

---

# API Reference

## 1. Batch Archive

A scalable endpoint for creating a permanent archive of multiple files in a single transaction.

**Endpoint:** `POST /batch-archive`

**Body (JSON):** An object with an `items` property, which is an an array of objects. Each object must have a `url` (the URL of the content to pin) and can have an optional `metadata` object. The `studentId` field in the metadata has been replaced with `studentDid`.
```json
{
  "items": [
    {
      "url": "https://example.com/student-a/thesis.pdf",
      "metadata": { "studentDid": "did:web:example.com:students:123", "title": "My Final Thesis" }
    },
    {
      "url": "https://example.com/student-b/project.zip",
      "metadata": { "studentDid": "did:web:example.com:students:456", "title": "Capstone Project" }
    }
  ]
}
```
The endpoint returns a single `manifestCid` for the entire batch.

## 2. Create Student DID

Creates a new `did:web` Decentralized Identifier for a student.

**Endpoint:** `POST /create-did`

**Authentication:** Requires a Bearer Token in the `Authorization` header. The token should be set in the `.env` file as `ADMIN_TOKEN`.

**Body (JSON):**
*   `studentId` (string): A unique identifier for the student (e.g., a username or legacy ID).

The endpoint will generate a new cryptographic key pair for the student, create a DID Document, and save it to a public directory. The private key is saved to the server's `private/keys` directory and is not returned in the response. It returns the student's new DID.

## 3. Issue Verifiable Credential

Issues a W3C-compliant Verifiable Credential (VC) as a JWT.

**Endpoint:** `POST /issue-credential`

**Body (JSON):**
*   `studentDid` (string): The Decentralized Identifier of the student.
*   `claims` (object): A JSON object containing the claims to be included in the credential (e.g., `{ "degree": "Bachelor of Science" }`).
*   `proofOfWorkCID` (string, optional): The IPFS CID of a manifest file (e.g., from a batch archive) that contains the evidence supporting this credential. This enables "deep verification."

The server signs the credential with its private key. The public key is available at `/.well-known/jwks.json` for verifiers.

## 3. Pin Learning Object

Pins a single educational resource with rich metadata.

**Endpoint:** `POST /add-learning-object` (multipart/form-data)

**Fields:** `files`, `title`, `author`, `subject`, `gradeLevel`, `license`, `description`.

## 4. Pin Encrypted Object (Student Portfolio)

Stores a pre-encrypted blob of data. The server has no knowledge of the contents.

**Endpoint:** `POST /add-encrypted-object` (multipart/form-data)

**Fields:** `file`

## 5. Check CID Status

Checks the pinning status of a CID on NFT.storage.

**Endpoint:** `GET /status/:cid`

---

# Future Vision: DIDs in K-12 Education

The question of how a K-12 school in the U.S. could issue DIDs requires a thoughtful approach that balances state-level educational requirements with federal privacy laws. A successful implementation would not be a single, monolithic system, but a federated trust network.

## A Potential Roadmap

1.  **Adopt the `did:web` Method:** This is the most practical starting point. Each school district could host their DID documents on their own web servers, making their DIDs resolvable via standard HTTPS. This avoids the need for a custom blockchain and leverages existing, trusted infrastructure. A school's DID might look like `did:web:bostonschools.org:students:12345`.

2.  **State-Level Trust Registries:** Each state's Department of Public Instruction (DPI) could maintain a cryptographically-verifiable list of all accredited school districts in their state. This registry would essentially be a "DID of DIDs," allowing anyone to confirm that a particular school district is a legitimate issuer of student credentials.

3.  **Cross-State Interoperability:** A national body, perhaps facilitated by the U.S. Department of Education, could maintain a registry of all state DPIs. This would create a chain of trust from the federal level down to the individual school district, allowing a university in California to verify a credential from a high school in Massachusetts.

## Key Considerations

*   **Privacy (FERPA & COPPA):** Verifiable Credentials allow for "selective disclosure." A student could prove they are over 13 without revealing their exact birthdate, or prove they are a student at a particular school without revealing their student ID number. This is a significant privacy enhancement over traditional, all-or-nothing ID cards.
*   **Key Management for Minors:** For younger students, the school or district could act as a "custodial wallet," managing the student's private keys. As students get older, they could be taught to manage their own keys, perhaps in a dedicated digital literacy course.
*   **Verifiable Credentials for Everything:** This system could be used for more than just identity. It could be used to issue verifiable credentials for transcripts, attendance records, and even individual skills or competencies, creating a rich, student-owned "learning ledger."
