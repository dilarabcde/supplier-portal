# Supplier Portal

A full-stack supplier application and approval management system developed with **SAP CAP, SAPUI5, SAP BTP, SAP HANA Cloud, and XSUAA**.

The project provides separate interfaces for suppliers and approvers. Suppliers can register, verify their email addresses, submit supplier applications and certificates, and track their application status. Approvers can review applications, analyze supplier certificates, approve or reject applications, and manage the supplier evaluation process.

---

## Features

### Supplier Portal

- Supplier registration and login
- Email verification
- Supplier application form
- PDF certificate upload
- File size validation
- Application status tracking
- Rejected application revision and resubmission
- Decision note display
- Multilingual interface (Turkish / English)

### Supplier Approvals

- Dashboard with application statistics
- View all supplier applications
- Filter applications by status
- Search by company, contact person, or email
- Configurable table columns
- Sorting and filtering
- Application detail view
- Supplier history
- Certificate viewing
- AI-assisted certificate analysis
- Start review process
- Approve applications
- Reject applications with a decision note
- Select fields that must be revised by the supplier

### Security & Authorization

- Authentication with SAP XSUAA
- Role-based authorization
- Dedicated `Approver` role
- Protected approval operations
- Protected Supplier Approvals application
- Authentication through SAP BTP

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| Backend | SAP CAP / Node.js |
| Frontend | SAPUI5 |
| Database | SAP HANA Cloud |
| Authentication | SAP XSUAA |
| Platform | SAP BTP |
| Routing | SAP Application Router |
| API | OData V4 |
| Local Development | Node.js / CDS |
| Version Control | Git / GitHub |

---

## Architecture

```text
                         SAP BTP
                            │
                         XSUAA
                            │
                     Application Router
                            │
             ┌──────────────┴──────────────┐
             │                             │
     Supplier Portal              Supplier Approvals
        SAPUI5                        SAPUI5
             │                             │
             └──────────────┬──────────────┘
                            │
                         OData V4
                            │
                      SAP CAP Backend
                            │
                      SAP HANA Cloud
```

---

## Application Flow

### Supplier Flow

```text
Register
   ↓
Email Verification
   ↓
Login
   ↓
Supplier Application
   ↓
Certificate Upload
   ↓
Application Submitted
   ↓
Status Tracking
```

If an application is rejected:

```text
Rejected
   ↓
Decision Note
   ↓
Requested Fields Become Editable
   ↓
Application Revision
   ↓
Resubmission
```

### Approver Flow

```text
Login through XSUAA
   ↓
Supplier Approvals
   ↓
View Application
   ↓
Start Review
   ↓
Certificate / AI Analysis
   ↓
Approve or Reject
   ↓
Application Status Updated
```

---

## Authorization

The approval side of the application uses role-based authorization through **SAP XSUAA**.

The project defines an `Approver` role that protects approval operations such as:

- Starting an application review
- Approving an application
- Rejecting an application
- Accessing the Supplier Approvals application

Users without the required role cannot access protected approval functionality.

---

## Database

The production-style environment uses **SAP HANA Cloud**.

Main entities include:

- `SupplierUsers`
- `SupplierApplications`
- `ApplicationHistory`
- `ApplicationRevisionFields`

Supplier certificates are stored as binary PDF data in the database together with their metadata.

---

## Project Structure

```text
supplier-portal/
│
├── app/
│   ├── com.abics.supplierportal/
│   │   └── Supplier-facing SAPUI5 application
│   │
│   ├── com.abics.supplierapprovals/
│   │   └── Approver-facing SAPUI5 application
│   │
│   └── router/
│       └── SAP Application Router and Fiori sandbox configuration
│
├── db/
│   └── CAP data model
│
├── srv/
│   └── CAP services and business logic
│
├── xs-security.json
│   └── XSUAA scopes and role definitions
│
└── package.json
```

---

## Running the Project

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- SAP CAP development tools (`@sap/cds`)
- SAP BTP CLI / Cloud Foundry CLI when using cloud services

Install the dependencies:

```bash
npm install
```

### Start the CAP Backend

For the hybrid SAP BTP environment:

```bash
cds watch --profile hybrid
```

The CAP backend runs by default at:

```text
http://localhost:4004
```

### Start the Application Router

Open another terminal:

```bash
cd app/router
cds bind --exec --profile hybrid -- npm start
```

The application router runs at:

```text
http://localhost:5000
```

Open the Fiori Launchpad:

```text
http://localhost:5000/fiori-apps.html#Shell-home
```

---

## Internationalization

The application supports multiple languages using the SAPUI5 i18n mechanism.

Currently supported languages:

- Turkish
- English

The displayed language is determined by the browser language configuration.

---

## Application Statuses

Supplier applications can move through the following states:

```text
Submitted
    ↓
InReview
    ↓
 ┌───────────┐
 │           │
Approved   Rejected
              │
              ↓
          Revision
              │
              ↓
         Resubmission
```

---

## AI-Assisted Certificate Analysis

The approver interface includes AI-assisted certificate analysis.

The feature is designed to help the approver evaluate uploaded supplier certificates and identify potentially relevant certificate information while keeping the final approval decision with the approver.

---

## Security Notes

Sensitive configuration must not be committed to the repository.

Files containing credentials, service keys, API keys, tokens, or local BTP bindings should be excluded through `.gitignore`.

Never commit:

```text
API keys
Passwords
SAP BTP service credentials
HANA Cloud credentials
XSUAA secrets
Authentication tokens
Private environment configuration
```

---

## Future Improvements

The project can be extended with:

- Docker containerization
- GitHub Actions CI/CD
- Automated testing
- Automated SAP BTP deployment
- Infrastructure as Code
- Security scanning
- Container image scanning
- Centralized logging
- Monitoring and observability

These improvements can evolve the application into a complete **DevOps-oriented cloud project**.

---

## Demo

A demonstration video of the project can be added here:

```text
YouTube Demo: <DEMO_LINK>
```

---

## Author

**Dilara Öztürk**

Computer Engineering  
Atatürk University
