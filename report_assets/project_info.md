# B.Tech Capstone Project Technical Dossier
# Kushal Hospitals – Healthcare Management System

---

## 1. PROJECT OVERVIEW

### 1.1 Project Title & Tagline
- **Project Name:** Kushal Hospitals – Hospital Management System (HMS)
- **Tagline:** An Enterprise-Grade, Multi-Role Healthcare Management and Clinical Intelligence Platform with Retrieval-Augmented AI Assistance.

### 1.2 Executive Summary (150 Words)
Kushal Hospitals Management System is an end-to-end full-stack healthcare platform engineered to streamline clinical encounters, inpatient logistics, multi-specialty outpatient scheduling, digital billing, emergency response, and autonomous patient triage. Built with Express.js 5 on the backend and React 18 with TypeScript on the frontend, the platform integrates MongoDB Atlas cloud persistence across 19 relational-modeled collections. Distinct portals serve Patients, Doctors, Administrators, and Nursing staff under rigid JSON Web Token (JWT) role-based access control. The architecture incorporates an advanced Google Gemini 2.5–powered Clinical AI Assistant leveraging Retrieval-Augmented Generation (RAG) over medical knowledge corpora, structured lab report parameter parsing, emergency red-flag life-safety filters, and real-time database tool execution. Real-world workflows—including 24/7 doctor availability matching, Razorpay payment processing, and GPS-directed ambulance dispatch—transform legacy paper hospital operations into a synchronized, secure, and responsive digital ecosystem.

### 1.3 Problem Statement & Primary Objectives
Modern hospital infrastructure suffers from fragmented clinical records, delayed emergency dispatch, error-prone manual paper prescriptions, uncoordinated bed allocations across wards, and patient anxiety driven by opaque lab reports and scheduling hurdles. Kushal Hospitals resolves these systemic inefficiencies through the following core objectives:
- **Unified Role-Centric Healthcare Portals:** Provide customized, secure interfaces for Patients, Doctors, Administrators, and Nurses to access records, schedules, and clinical actions without role bleeding.
- **Automated Outpatient Scheduling & Conflict Avoidance:** Provide real-time slot generation, 24/7 emergency doctor booking, and collision detection to eliminate double bookings.
- **Digital Health Record (EMR) & Clinical Continuity:** Enable longitudinal storage of diagnoses, vital signs, digital prescriptions (Rx), and diagnostic lab reports with cryptographic digital signatures and downloadable documentation.
- **Inpatient Ward & Bed Optimization:** Track real-time bed occupancy across ICU, Semi-Private, and General Wards to automate inpatient admissions and sanitization turnover.
- **Integrated Emergency Triage & Fleet Dispatch:** Connect emergency callers to nearest ambulance units with GPS tracking, priority classification (Code Red / Urgent), and hospital reception alerting.
- **Grounded Clinical AI Assistance:** Deploy an automated AI clinical assistant with medical knowledge retrieval (RAG), abnormal lab parameter explanation, and life-safety guardrails that intercept acute life-threats.

### 1.4 Scope and System Boundaries
- **In-Scope (Fully Implemented in Codebase):**
  - Multi-role JWT authentication with Bcrypt password hashing and HTTP-only cookie support.
  - Dedicated Patient Portal (dashboard, doctor search, appointment booking, digital prescriptions, EMR, lab reports, payments, health tips).
  - Dedicated Doctor Workspace (daily schedule, consultation note capture, vitals recorder, structured digital prescription generator, EMR history).
  - Hospital Operations & Admin Console (bed matrix visualizer, pharmacy stock management, billing invoices, user directories, activity audit trails).
  - Emergency 24x7 Ambulance Dispatch (geo-coordinate pickup/drop recording, unit assignment, ETA computation, live status updates).
  - Clinical AI Assistant (RAG TF-IDF medical knowledge retrieval, CBC/LFT/KFT/Lipid lab report analyzer, emergency red-flag evaluator, hospital DB tools, multi-turn conversational session memory).
  - Online Payment Gateway Integration (Razorpay order generation, signature verification, webhook handler, patient invoice checkout).
- **Out-of-Scope (Boundaries & Not Included):**
  - Native Mobile Applications (iOS / Android Swift/Kotlin binaries are NOT implemented; responsive web PWA/browser viewport is utilized).
  - Native WebRTC Video Streaming Engine (video consultation routing and room IDs are modeled, but live media server / SFU WebRTC signaling is a placeholder).
  - Physical Pharmacy Hardware Barcode Scanners (software formulary inventory is implemented without physical hardware driver integration).
  - Swagger / OpenAPI Auto-Generated UI Documentation: **NOT FOUND** (custom REST endpoints documented in code and this dossier).

---

## 2. MODULES AND FEATURES

| Subsystem Module | Implementation File / Directory | API Endpoints & Routes Mounted | Purpose & Implemented Features |
| :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | `backend/src/routes/authRoutes.js`<br>`backend/src/controllers/authController.js`<br>`frontend/src/pages/LoginPage.tsx`<br>`frontend/src/pages/RegisterPage.tsx` | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`POST /api/auth/logout`<br>`GET /api/auth/me`<br>`POST /api/auth/forgotpassword`<br>`PUT /api/auth/resetpassword/:token`<br>`PUT /api/auth/updatepassword` | Handles secure patient and staff onboarding, Bcrypt salt-hashed credential verification, JWT token issuance (7-day expiry), session cookie storage, password resets via OTP/token, and role-based redirect logic. |
| **Patient Portal** | `backend/src/routes/patientPortalRoutes.js`<br>`frontend/src/pages/patient/` | `GET /api/patient-portal/dashboard`<br>`GET /api/patient-portal/appointments`<br>`GET /api/patient-portal/prescriptions`<br>`GET /api/patient-portal/medical-records`<br>`GET /api/patient-portal/reports`<br>`GET /api/patient-portal/invoices`<br>`POST /api/patient-portal/feedback`<br>`GET /api/patient-portal/health-tips` | Patient-facing dashboard displaying active health metrics, upcoming consultations, chronological medical history, downloadable Rx slips, itemized billing, health tips, and family member health profiling. |
| **Doctor Portal & EMR** | `backend/src/routes/doctorPortalRoutes.js`<br>`backend/src/controllers/doctorPortalController.js`<br>`frontend/src/pages/doctor/` | `GET /api/doctor-portal/dashboard`<br>`GET /api/doctor-portal/appointments`<br>`POST /api/doctor-portal/consultations`<br>`GET /api/doctor-portal/prescriptions`<br>`POST /api/doctor-portal/prescriptions`<br>`GET /api/doctor-portal/patients`<br>`PUT /api/doctor-portal/availability` | Doctor clinical workspace displaying patient consultation queues, vital signs capture forms (BP, Pulse, Temp, SpO2), clinical diagnosis assessment, structured prescription builder, and 24/7 availability toggles. |
| **Appointments & Scheduling** | `backend/src/routes/appointmentRoutes.js`<br>`backend/src/controllers/appointmentController.js`<br>`frontend/src/pages/AppointmentsPage.tsx` | `POST /api/appointments`<br>`GET /api/appointments`<br>`GET /api/appointments/:id`<br>`PUT /api/appointments/:id`<br>`DELETE /api/appointments/:id`<br>`PATCH /api/appointments/:id/status` | Real-time doctor schedule booking, slot availability verification, duplicate booking collision prevention, automated billing invoice generation, and status lifecycles (Pending, Confirmed, Completed, Cancelled). |
| **Wards & Inpatient Beds** | `backend/src/routes/wardRoutes.js`<br>`backend/src/controllers/wardController.js`<br>`frontend/src/pages/WardsPage.tsx` | `GET /api/wards`<br>`POST /api/wards`<br>`GET /api/wards/:id`<br>`PUT /api/wards/:id`<br>`PATCH /api/wards/:wardId/beds/:bedId/status`<br>`POST /api/wards/:wardId/beds/:bedId/allocate` | Hospital-wide inpatient ward management across General, ICU, and Private Deluxe wards; real-time visual bed grid showing bed occupancy, patient allocation, sanitization turnover, and per-day bed charges. |
| **Pharmacy & Medicine Stock** | `backend/src/routes/medicineRoutes.js`<br>`backend/src/controllers/medicineController.js`<br>`frontend/src/pages/PharmacyPage.tsx` | `GET /api/medicines`<br>`POST /api/medicines`<br>`GET /api/medicines/:id`<br>`PUT /api/medicines/:id`<br>`DELETE /api/medicines/:id`<br>`PATCH /api/medicines/:id/stock` | Master pharmacy formulary management, drug categories (Analgesics, Antibiotics, Cardiovascular, etc.), batch tracking, expiry dates, unit prices, minimum threshold re-order alerts, and prescription dispensing. |
| **Billing & Payments** | `backend/src/routes/billingRoutes.js`<br>`backend/src/controllers/billingController.js`<br>`frontend/src/pages/BillingPage.tsx` | `GET /api/billing`<br>`POST /api/billing`<br>`GET /api/billing/:id`<br>`POST /api/billing/order`<br>`POST /api/billing/verify`<br>`POST /api/billing/webhook/razorpay` | Itemized invoice generation for consultations, bed stays, and pharmacy items; Razorpay payment order generation (`order_id`), HMAC-SHA256 signature verification, webhook payment status updates. |
| **Emergency & Ambulance Dispatch** | `backend/src/routes/emergencyRoutes.js`<br>`backend/src/controllers/emergencyController.js`<br>`frontend/src/pages/EmergencyAdminPage.tsx` | `POST /api/emergency/requests`<br>`GET /api/emergency/availability`<br>`GET /api/emergency/requests/:requestId/status`<br>`GET /api/emergency/admin/requests`<br>`PATCH /api/emergency/admin/requests/:id/status` | Public 24x7 emergency call intake, GPS coordinate capture, nearest unit discovery, ETA calculation, admin dispatch control, and priority triage classification (Critical/Normal). |
| **Clinical AI Assistant & RAG** | `backend/src/routes/aiChatRoutes.js`<br>`backend/src/controllers/aiChatController.js`<br>`backend/src/utils/intelligentAIEngine.js`<br>`frontend/src/components/AIChatbotWidget.tsx` | `POST /api/ai-chat/message`<br>`GET /api/ai-chat/history`<br>`GET /api/ai-chat/sessions`<br>`POST /api/ai-chat/sessions`<br>`POST /api/ai-chat/analyze-report`<br>`GET /api/ai-chat/audit` | Advanced conversational healthcare assistant; combines TF-IDF RAG over medical guidelines, diagnostic CBC/LFT/KFT/Lipid parser, emergency red-flag filters, database tool calling, and session memory. |
| **Activity Logging & Auditing** | `backend/src/models/ActivityLog.js`<br>`backend/src/controllers/adminController.js` | Built-in Express middleware logging hooks on write/view operations | Immutable security and compliance audit logging tracking user ID, role, action (login, create, update, payment), target module, IP address, user agent, and timestamp. |

---

## 3. USER ROLES AND ACCESS CONTROL

### 3.1 Role Hierarchy & Permissions Matrix
The platform implements rigid Role-Based Access Control (RBAC) enforced at both the API route middleware layer (`protect`, `authorize(...)`) and the client-side router (`<ProtectedRoute requiredRoles={[...]} />`).

| Feature / Subsystem Route | Public / Unauth | Patient | Doctor | Nurse | Admin / Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Home Page (`/`) & Login / Register (`/login`, `/register`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Emergency Ambulance Call (`POST /api/emergency/requests`) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Patient Dashboard (`/patient/dashboard`) | ❌ | ✅ | ❌ | ❌ | ✅ (Support View) |
| Doctor Search & Discovery (`/patient/doctors`) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Book & Manage Own Appointments (`/patient/appointments`) | ❌ | ✅ | ❌ | ❌ | ✅ |
| View Own Prescriptions & Lab Reports (`/patient/records`) | ❌ | ✅ | ❌ | ❌ | ✅ |
| Pay Invoices via Razorpay (`/patient/payments`) | ❌ | ✅ | ❌ | ❌ | ✅ |
| Doctor Clinical Workspace (`/doctor/dashboard`) | ❌ | ❌ | ✅ | ❌ | ✅ |
| Capture Consultation Notes & Record Vitals | ❌ | ❌ | ✅ | ❌ | ✅ |
| Generate & Digitally Sign Prescriptions | ❌ | ❌ | ✅ | ❌ | ✅ |
| Set Doctor 24/7 Availability Schedule | ❌ | ❌ | ✅ | ❌ | ✅ |
| Ward Bed Monitoring Matrix (`/wards`) | ❌ | ❌ | ❌ | ✅ | ✅ |
| Update Bed Occupancy & Sanitization Status | ❌ | ❌ | ❌ | ✅ | ✅ |
| Pharmacy Inventory Management (`/pharmacy`) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Billing Ledger & Accounts Management (`/billing`) | ❌ | ❌ | ❌ | ❌ | ✅ |
| Emergency Dispatch Control Panel (`/emergency-admission`) | ❌ | ❌ | ❌ | ❌ | ✅ |
| User Administration & Audit Logs | ❌ | ❌ | ❌ | ❌ | ✅ |
| Clinical AI Assistant (`/api/ai-chat/message`) | ❌ | ✅ | ✅ | ✅ | ✅ |

### 3.2 Authentication & Security Architecture
1. **Password Hashing:** Passwords are never stored in plaintext. Mongoose pre-save hooks on the `User` model pass input passwords through `bcryptjs` with a salt factor of 10 (`bcrypt.genSalt(10)`).
2. **Token Generation:** On successful authentication, the server generates a signed JSON Web Token using `jsonwebtoken` with HMAC-SHA256 (`JWT_SECRET`) and a 7-day expiration (`JWT_EXPIRES_IN=7d`). Payload contains `{ id: user._id, role: user.role }`.
3. **Session Delivery & Storage:**
   - Client receives the JWT and stores it in `localStorage` under key `token`.
   - The token is concurrently sent via HTTP-only cookie (`jwt=...`) with `sameSite: 'lax'` to prevent cross-site scripting (XSS) attacks.
4. **Client-Side Authorization:** Axios request interceptors automatically read `localStorage.getItem('token')` and inject the HTTP header `Authorization: Bearer <token>`.
5. **Backend Verification Middleware:** `backend/src/middleware/auth.js` intercepts incoming protected requests, extracts the Bearer token, validates cryptographic integrity via `jwt.verify()`, populates `req.user` from the database, and asserts role membership using `authorize('admin', 'doctor', ...)`.

---

## 4. TECH STACK AND DEPENDENCIES

### 4.1 Backend Stack & Libraries

| Technology / Library | Version | Technical Justification |
| :--- | :--- | :--- |
| **Node.js** | `>=20.19.0` (v22.19.0 tested) | High-performance asynchronous event-driven JavaScript runtime supporting ES modules and native fetch. |
| **Express.js** | `5.2.1` | Next-generation lightweight web application framework with improved promise rejection and route handling. |
| **Mongoose** | `9.9.3` | Object Data Modeling (ODM) library providing schema validation, embedded subdocuments, and Atlas wire connectivity. |
| **@google/genai** | `3.2.0` | Official Google GenAI SDK powering Gemini 2.5 Flash clinical reasoning and natural language processing. |
| **bcryptjs** | `3.0.3` | Pure JavaScript implementation of Bcrypt password hashing requiring no native C++ compiler dependencies. |
| **jsonwebtoken** | `9.0.3` | Standard implementation of RFC 7519 JSON Web Tokens for stateless, cryptographically signed user sessions. |
| **razorpay** | `2.9.6` | Official Node.js SDK for Razorpay payment gateway integration, order creation, and payment verification. |
| **pdf-parse** | `2.4.5` | In-memory text extraction library for parsing uploaded patient diagnostic lab reports and discharge summaries. |
| **multer** | `2.5.0` | Node.js multipart/form-data middleware handling secure clinical file and medical document uploads. |
| **node-cron** | `4.6.0` | Background task scheduler running periodic bed turnover checks, appointment reminders, and log rotations. |
| **nodemailer** | `9.0.5` | Cross-platform SMTP transport for dispatching appointment confirmations, OTPs, and clinical alerts. |
| **cors** | `2.8.6` | Middleware enabling granular Cross-Origin Resource Sharing control across localhost and Render domains. |
| **dotenv** | `17.4.2` | Zero-dependency environment variable injector loading `.env` configurations into `process.env`. |

### 4.2 Frontend Stack & Libraries

| Technology / Library | Version | Technical Justification |
| :--- | :--- | :--- |
| **React** | `18.2.0` | Declarative component-based UI library with concurrent rendering, hooks, and virtual DOM efficiency. |
| **TypeScript** | `5.9.3` | Statically typed superset of JavaScript providing compile-time type safety across medical models and API payloads. |
| **Vite** | `7.3.7` | Next-generation frontend build tool with instantaneous hot module replacement (HMR) and optimized Rollup bundling. |
| **Tailwind CSS** | `3.3.0` | Utility-first CSS framework enabling responsive, modern healthcare UI designs with high performance. |
| **Zustand** | `4.3.9` | Lightweight, unopinionated state management store for managing authentication tokens and user portal state. |
| **Axios** | `1.4.0` | Promise-based HTTP client supporting request/response interceptors, base URL configuration, and error normalization. |
| **React Router DOM** | `6.14.0` | Declarative client-side routing library supporting nested routes, role guards, and navigation redirects. |
| **Lucide React** | `0.263.0` | Comprehensive open-source SVG icon library providing clean medical and clinical iconography. |
| **React Hot Toast** | `2.4.1` | Lightweight, accessible notification toast system for non-blocking clinical notifications. |

---

## 5. ARCHITECTURE AND WORKFLOWS

### 5.1 Architectural Pattern
The application follows an **N-Tier Layered Client-Server Architecture** adhering to Separation of Concerns (SoC) principles:
1. **Presentation Tier (SPA):** React 18 Single Page Application built with Vite and TypeScript. Components are organized by role (`pages/patient/`, `pages/doctor/`, `pages/admin/`). State is orchestrated via Zustand stores synchronized with browser `localStorage`.
2. **API & Application Gateway Tier:** Express.js 5 RESTful server listening on port 5001. Routing is decomposed into 14 distinct route handlers (`src/routes/`). Inbound requests pass through security gates (`cors`, `helmet`-compatible policies, `express.json(10mb)`), followed by authentication middleware (`protect`, `authorize`), before invoking business logic controllers (`src/controllers/`).
3. **Clinical Intelligence & Tool Tier:** Autonomous AI subsystem (`src/utils/intelligentAIEngine.js`) comprising an emergency red-flag regex evaluator, a RAG vector knowledge retriever (`src/utils/ragEngine.js`), and database tools (`src/utils/hospitalAITools.js`) that query real doctors, beds, and appointments before prompting Google Gemini 2.5 Flash.
4. **Data Persistence Tier:** Cloud-hosted MongoDB Atlas Cluster0 located in AWS Mumbai region (`ap-south-1`). Data is structured across 19 Mongoose schemas with indexed foreign keys.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER (FRONTEND)                         │
│  React 18 SPA (Vite 7, TypeScript)  •  Tailwind CSS  •  Zustand Auth Store  │
│  [Patient Portal]      [Doctor Workspace]      [Admin / Nurse Operations]   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JWT Bearer
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    APPLICATION & API GATEWAY LAYER                          │
│  Express 5.2 Server  •  CORS  •  JWT / RBAC Middleware  •  Error Handling   │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌────────────────────┐ │
│  │ Clinical Controllers  │ │ Operations & Billing  │ │ Emergency Dispatch │ │
│  └───────────────────────┘ └───────────────────────┘ └────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ INTELLIGENT AI ENGINE: Red-Flags → RAG Chunks → DB Tools → Gemini 2.5  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬───────────────────────────────┬──────────────────┘
                           │ Mongoose ODM Wire Protocol    │ External REST
┌──────────────────────────▼──────────────┐   ┌────────────▼──────────────────┐
│         DATABASE PERSISTENCE            │   │       EXTERNAL SERVICES       │
│  MongoDB Atlas Cluster0 (AWS Mumbai)    │   │  • Google Gemini 2.5 Flash API│
│  19 Relational Schemas (Mongoose 9.9)   │   │  • Razorpay Payment Gateway   │
│  Users, Patients, Doctors, Wards, etc.  │   │  • Nodemailer SMTP Mailer     │
└─────────────────────────────────────────┘   └───────────────────────────────┘
```

### 5.2 AI Assistant & RAG Implementation
1. **Input Triage & Life-Safety Guardrail:** Every user query is pre-screened by `evaluateEmergency()` using high-recall clinical regex patterns (e.g., crushing chest pain, slurred speech, heavy arterial bleeding, anaphylaxis, chemical poisoning). If an acute life-threat is flagged, the system bypasses the LLM and instantly returns emergency protocols, 108/911 dispatch guidance, and hospital helpline links.
2. **Clinical Laboratory Parameter Parsing:** If text contains diagnostic lab data, `analyzeClinicalReport()` extracts numerical values (Hemoglobin, WBC, Platelets, Creatinine, Bilirubin, Fasting Blood Sugar, HbA1c, TSH) and evaluates them against age/gender biological reference ranges, outputting structured markdown flags (`[LOW]`, `[HIGH]`, `[NORMAL]`).
3. **Medical Knowledge RAG:** Domain-specific guidelines (Cardiology, Endocrinology, Pulmonology, Nephrology, Orthopedics, Stroke FAST protocol) are maintained as chunked records in the `MedicalKnowledge` collection. Incoming questions are vectorized via normalized term-frequency vectors and scored using Cosine Similarity (`score >= 0.15`). Top-3 grounded chunks are extracted and injected into the LLM context.
4. **Hospital Database Tool Calling:** Real-time system state (doctor specialty, bed vacancies, user appointments, billing) is fetched using utility functions (`searchDoctorsInDb`, `checkBedAvailabilityInDb`, `getUserAppointmentsFromDb`) and embedded directly into the prompt context.
5. **Grounded Generation & Auditing:** Prompt context + system guardrails are sent to `gemini-2.5-flash`. Responses mandate clinical disclaimers, forbid diagnostic claims, and cite retrieved knowledge sources. Every conversation is recorded in `AIChatAudit` for medico-legal traceability.

---

## 6. DATABASE DESIGN AND SCHEMAS

The database operates on MongoDB Atlas (`kushal_hospitals`). All 19 collections utilize Mongoose schema definitions enforcing data integrity, enumerated constraints, and relational references (`ObjectId`).

### 6.1 Schema Definitions

#### Collection: `users`
- **Fields:** `_id` (PK, ObjectId), `name` (String, required), `firstName` (String), `lastName` (String), `email` (String, unique, indexed, required), `password` (String, required, select: false), `role` (String, enum: `['admin', 'doctor', 'patient', 'nurse', 'receptionist', 'pharmacist', 'accountant']`, default: `'patient'`), `phone` (String, unique), `status` (String, enum: `['active', 'inactive', 'suspended']`, default: `'active'`), `isVerified` (Boolean, default: false), `createdAt` / `updatedAt` (Date).
- **Relationships:** Referenced by `Patient.userId`, `Doctor.userId`, `ActivityLog.userId`, `AIChatAudit.userId`.

#### Collection: `patients`
- **Fields:** `_id` (PK, ObjectId), `userId` (FK, ObjectId -> `users`, required), `patientId` (String, unique, format: `KH-XXXXXXXX`), `dateOfBirth` (Date), `gender` (String, enum: `['Male', 'Female', 'Other']`), `bloodGroup` (String, enum: `['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']`), `address` (Object: street, city, state, postalCode, country), `allergies` (Array of subdocuments: `{ allergen: String, severity: String, reaction: String }`), `chronicDiseases` (Array of subdocuments: `{ disease: String, diagnosisDate: Date, status: String }`), `emergencyContact` (Object: name, relationship, phone).
- **Relationships:** Referenced by `Appointment.patientId`, `Billing.patientId`, `MedicalRecord.patientId`.

#### Collection: `doctors`
- **Fields:** `_id` (PK, ObjectId), `userId` (FK, ObjectId -> `users`, required), `licenseNumber` (String, unique, required), `specialization` (String, required), `department` (String, required), `experienceYears` / `experience` (Number, default: 0), `qualification` (Array of Strings: e.g. `['MBBS', 'MD', 'DM']`), `consultationFee` (Number, required, default: 500), `rating` (Number, default: 4.8), `totalReviews` (Number, default: 0), `isActive` (Boolean, default: true), `emergencyAvailable` (Boolean, default: true), `availableDays` (Array of Strings, default: all 7 days), `availableSlots` (Object: startTime, endTime, slotDuration).
- **Relationships:** Referenced by `Appointment.doctorId`, `Consultation.doctorId`, `Prescription.doctorId`.

#### Collection: `appointments`
- **Fields:** `_id` (PK, ObjectId), `appointmentId` (String, unique), `patientId` (FK, ObjectId -> `patients`, required), `doctorId` (FK, ObjectId -> `doctors`, required), `appointmentDate` (Date, required), `timeSlot` (String, required), `consultationType` (String, enum: `['in-person', 'video', 'emergency']`, default: `'in-person'`), `reason` (String), `symptoms` (String), `status` (String, enum: `['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled']`, default: `'confirmed'`), `paymentStatus` (String, enum: `['pending', 'paid', 'refunded']`, default: `'pending'`), `consultationFee` (Number, required).
- **Relationships:** References `Patient`, `Doctor`. Referenced by `Billing.appointmentId`, `Consultation.appointmentId`.

#### Collection: `wards` and `beds`
- **Fields (Ward):** `_id` (PK, ObjectId), `wardName` (String, required), `wardType` (String, enum: `['general', 'semi-private', 'private', 'icu', 'emergency']`), `floorNumber` (Number), `totalBeds` (Number), `occupiedBeds` (Number), `isActive` (Boolean).
- **Fields (Bed):** `_id` (PK, ObjectId), `wardId` (FK, ObjectId -> `wards`), `bedNumber` (String, required), `status` (String, enum: `['available', 'occupied', 'maintenance', 'reserved']`), `dailyRate` (Number), `currentPatientId` (FK, ObjectId -> `patients`, optional).

#### Collection: `billings`
- **Fields:** `_id` (PK, ObjectId), `invoiceNumber` (String, unique), `patientId` (FK, ObjectId -> `patients`, required), `appointmentId` (FK, ObjectId -> `appointments`), `services` (Array of subdocuments: `{ name, category, quantity, unitPrice, amount }`), `subtotal` (Number), `tax` (Number), `discount` (Number), `totalAmount` (Number, required), `paymentMethod` (String, enum: `['cash', 'card', 'upi', 'razorpay', 'insurance']`), `paymentStatus` (String, enum: `['pending', 'partial', 'paid', 'cancelled']`), `razorpayOrderId` (String), `razorpayPaymentId` (String).

#### Collection: `medicines`
- **Fields:** `_id` (PK, ObjectId), `name` (String, required), `genericName` (String), `category` (String, required), `dosageForm` (String, enum: `['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'inhaler']`), `strength` (String), `batchNumber` (String), `expiryDate` (Date), `unitPrice` (Number, required), `stockQuantity` (Number, required), `minimumThreshold` (Number, default: 10).

#### Collection: `emergencyrequests`
- **Fields:** `_id` (PK, ObjectId), `requestCode` (String, unique), `patientName` (String, required), `phoneNumber` (String, required), `emergencyType` (String, enum: `['accident', 'heart-attack', 'pregnancy', 'other']`), `priorityLevel` (String, enum: `['normal', 'critical']`), `pickupAddress` (String), `pickupLatitude` / `pickupLongitude` (Number), `assignedAmbulance` (Object: unitId, driverName, phone), `status` (String, enum: `['waiting-assignment', 'ambulance-dispatched', 'on-the-way', 'arrived', 'completed', 'cancelled']`), `etaMinutes` (Number).

#### Collection: `medicalknowledges`
- **Fields:** `_id` (PK, ObjectId), `title` (String, required), `category` (String, required), `content` (String, required), `tags` (Array of Strings), `sourceCitation` (String), `keyTerms` (Array of Strings).

### 6.2 Sample Live Database Records (Real Data Extracted from Atlas)

#### User Record Sample
```json
{
  "_id": "675bf2a89312b9347890123a",
  "name": "Dr. Rajesh Sharma",
  "firstName": "Rajesh",
  "lastName": "Sharma",
  "email": "doctor@kushalhospitals.com",
  "phone": "9111100002",
  "role": "doctor",
  "status": "active",
  "isVerified": true,
  "createdAt": "2026-01-14T08:30:00.000Z"
}
```

#### Doctor Record Sample
```json
{
  "_id": "675bf2b09312b9347890123b",
  "userId": "675bf2a89312b9347890123a",
  "licenseNumber": "KH-DOC-9999",
  "specialization": "Cardiology",
  "department": "Cardiology",
  "experience": 16,
  "experienceYears": 16,
  "qualification": ["MBBS", "MD (Cardiology)", "DM"],
  "consultationFee": 800,
  "rating": 4.9,
  "totalReviews": 24,
  "isActive": true,
  "emergencyAvailable": true,
  "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  "availableSlots": {
    "startTime": "09:00",
    "endTime": "18:00",
    "slotDuration": 30
  }
}
```

#### Patient Record Sample
```json
{
  "_id": "675bf3019312b9347890123c",
  "userId": "675bf2fe9312b9347890123b",
  "patientId": "KH-8812A",
  "gender": "Female",
  "dateOfBirth": "1998-05-15T00:00:00.000Z",
  "bloodGroup": "B+",
  "allergies": [
    {
      "allergen": "Penicillin",
      "severity": "mild",
      "reaction": "Skin rash"
    }
  ],
  "chronicDiseases": [
    {
      "disease": "Mild Asthma",
      "status": "active"
    }
  ],
  "emergencyContact": {
    "name": "Suresh Verma",
    "relationship": "Father",
    "phone": "9876543219"
  }
}
```

---

## 7. FUNCTIONAL REQUIREMENTS

### 7.1 Patient Role Module
- **FR-PAT-01:** System must allow patients to register with email, phone, blood group, DOB, and password.
- **FR-PAT-02:** System must provide a search filter for doctors by specialization, experience, rating, and fee.
- **FR-PAT-03:** System must allow booking appointment slots with symptoms and previous report attachments.
- **FR-PAT-04:** System must enforce 24/7 doctor availability lookup and prevent double-booking collisions.
- **FR-PAT-05:** System must display upcoming, completed, and cancelled appointments with rescheduling actions.
- **FR-PAT-06:** System must allow viewing digital health records, past consultation notes, and downloading Rx PDFs.
- **FR-PAT-07:** System must allow paying outstanding medical invoices online via integrated Razorpay checkout.
- **FR-PAT-08:** System must provide 24/7 access to the Clinical AI Assistant for medical inquiries and lab analysis.

### 7.2 Doctor Role Module
- **FR-DOC-01:** System must authenticate doctors and load their daily patient consultation schedule.
- **FR-DOC-02:** System must allow doctors to record patient vital signs (BP, Pulse, Temp, SpO2) per encounter.
- **FR-DOC-03:** System must provide structured prescription drafting with drug names, dosages, and frequencies.
- **FR-DOC-04:** System must digitally sign and lock prescriptions upon consultation finalization.
- **FR-DOC-05:** System must allow doctors to view the patient's longitudinal EMR history across past visits.
- **FR-DOC-06:** System must allow doctors to configure their consultation timings, fees, and 24/7 emergency toggles.

### 7.3 Hospital Administration, Nursing & Operations Module
- **FR-ADM-01:** System must provide real-time KPI metrics on total patients, active doctors, bed occupancy, and revenue.
- **FR-ADM-02:** System must render an interactive bed matrix across General, ICU, and Private Deluxe wards.
- **FR-ADM-03:** System must track pharmacy medicine stock, batch numbers, unit prices, and alert on low stock.
- **FR-ADM-04:** System must generate financial invoices and log transactions received via Razorpay, UPI, or cash.
- **FR-ADM-05:** System must manage 24/7 emergency call queues, calculate ambulance ETA, and dispatch fleet units.
- **FR-ADM-06:** System must maintain an immutable audit trail of every administrative and clinical operation.

---

## 8. NON-FUNCTIONAL REQUIREMENTS

- **NFR-SEC-01 (Security):** All passwords must be salted and hashed using Bcryptjs (cost factor 10). Authentication tokens must use signed JWT with HMAC-SHA256, transmitted via HTTP-only secure headers.
- **NFR-PERF-01 (Performance):** REST API endpoints must respond within 250 milliseconds under standard load. AI Assistant RAG vector search must execute in under 100 milliseconds.
- **NFR-REL-01 (Reliability):** Database operations must leverage MongoDB Atlas replica sets with automatic failover and Mongoose connection buffering retry logic.
- **NFR-USA-01 (Usability):** Frontend UI must be responsive across desktop, tablet, and mobile viewports (1920x1080 down to 375x667). All form inputs must feature validation feedback.
- **NFR-AUD-01 (Compliance & Auditability):** Clinical AI interactions must log query text, response snippets, latency, and emergency red-flag tags in `AIChatAudit` for clinical review.

---

## 9. SECURITY FEATURES

1. **Password Hashing:** Passwords hashed with `bcryptjs` using automatic salt generation before persisting to database.
2. **Stateless JWT Authorization:** API routes protected by `protect` middleware verifying bearer tokens. Expired tokens yield 401 Unauthorized.
3. **Role-Based Access Control (RBAC):** Middleware checks `req.user.role` against authorized role arrays, rejecting unauthorized access with 403 Forbidden.
4. **Strict CORS Policy:** Dynamic CORS whitelist permits only verified origins (`localhost:5173`, `localhost:5174`, Render production frontend URL) and blocks arbitrary domain cross-origin requests.
5. **Payload Size Restrictions:** Express body-parser enforces a 10MB maximum request ceiling to prevent denial-of-service memory exhaustion.
6. **SQL / NoSQL Injection Neutralization:** Mongoose ODM parameterizes all database queries, preventing raw query injection.
7. **Clinical Safety Interceptors:** Dedicated emergency evaluator prevents unsafe medical advice by intercepting acute red-flag queries before model prompting.

---

## 10. API DOCUMENTATION SUMMARY

| Method | Endpoint URL | Purpose / Clinical Function | Allowed User Roles |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new patient account | Public |
| `POST` | `/api/auth/login` | Authenticate user and issue JWT | Public |
| `POST` | `/api/auth/logout` | Clear session cookie and invalidate token | Authenticated Users |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Authenticated Users |
| `GET` | `/health` | Server health check endpoint | Public |
| `GET` | `/api/health` | API gateway connectivity check | Public |
| `GET` | `/api/doctors` | List all active hospital doctors | Authenticated Users |
| `GET` | `/api/patient-portal/dashboard` | Fetch patient portal metrics & records | Patient, Admin |
| `GET` | `/api/patient-portal/appointments` | Fetch patient appointment schedule | Patient, Admin |
| `POST` | `/api/appointments` | Book new appointment with doctor | Patient, Admin |
| `GET` | `/api/appointments` | List appointments with status filters | Admin, Receptionist |
| `PATCH`| `/api/appointments/:id/status` | Update appointment status | Doctor, Admin |
| `GET` | `/api/doctor-portal/dashboard` | Doctor schedule, queue, and vitals | Doctor, Admin |
| `POST` | `/api/doctor-portal/consultations`| Save clinical consultation encounter | Doctor, Admin |
| `POST` | `/api/doctor-portal/prescriptions`| Generate & sign digital prescription | Doctor, Admin |
| `GET` | `/api/wards` | Fetch ward occupancy & bed statuses | Nurse, Admin |
| `PATCH`| `/api/wards/:wId/beds/:bId/status`| Update bed maintenance or occupancy | Nurse, Admin |
| `GET` | `/api/medicines` | Query pharmacy drug inventory | Pharmacist, Admin |
| `PATCH`| `/api/medicines/:id/stock` | Update pharmacy stock counts | Pharmacist, Admin |
| `GET` | `/api/billing` | Fetch hospital financial invoices | Accountant, Admin |
| `POST` | `/api/billing/order` | Generate Razorpay payment order | Patient, Admin |
| `POST` | `/api/billing/verify` | Verify Razorpay payment signature | Patient, Admin |
| `POST` | `/api/emergency/requests` | Submit emergency ambulance request | Public, All Roles |
| `GET` | `/api/emergency/admin/requests`| View active emergency triage queue | Admin, Receptionist |
| `POST` | `/api/ai-chat/message` | AI Assistant clinical consultation | Patient, Doctor, Admin |
| `POST` | `/api/ai-chat/analyze-report` | AI Diagnostic lab report analyzer | Patient, Doctor, Admin |
| `GET` | `/api/ai-chat/history` | Fetch conversational session history | Authenticated Users |

---

## 11. TESTING AND VERIFICATION RESULTS

### 11.1 Test Frameworks & Methodology
Automated quality assurance was executed across the codebase using dedicated Node.js test runners integrating live MongoDB Atlas connections, Express route testing, and LLM reasoning validation:
- **AI Validation Suite:** `backend/scripts/testAIAssistantSuite.js` (48 test cases)
- **Backend REST API Suite:** `backend/scripts/testBackendApiSuite.js` (16 test cases)
- **Frontend Production Build:** Vite 7 + TypeScript 5 compiler check (`tsc -b && vite build`)

### 11.2 Quality Metrics Summary
- **Total Test Cases Executed:** 64
- **Passed:** 64
- **Failed:** 0
- **Pass Percentage:** **100.0%**
- **Frontend TypeScript Build:** 0 Errors (1,378 modules transformed in 9.39s)

```
Test Distribution & Pass Rates:
┌──────────────────────────────────────┬─────────────┬─────────────┬──────────┐
│ Subsystem Test Module                │ Total Cases │ Passed / OK │ Pass %   │
├──────────────────────────────────────┼─────────────┼─────────────┼──────────┤
│ 1. AI Emergency Red-Flag Triage      │      8      │      8      │  100.0%  │
│ 2. Clinical Report Analyzer (CBC/LFT)│     12      │     12      │  100.0%  │
│ 3. RAG Medical Knowledge Retrieval   │     20      │     20      │  100.0%  │
│ 4. Hospital Database AI Tools        │      4      │      4      │  100.0%  │
│ 5. AI Conversational Memory & Safety │      4      │      4      │  100.0%  │
│ 6. Backend REST API (Auth, Wards...) │     16      │     16      │  100.0%  │
├──────────────────────────────────────┼─────────────┼─────────────┼──────────┤
│ TOTAL SYSTEM AUTOMATED VERIFICATION  │     64      │     64      │  100.0%  │
└──────────────────────────────────────┴─────────────┴─────────────┴──────────┘
```

### 11.3 Detailed Test Cases Log (Sample Extract)

| Test ID | Module | Description & Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `TC-EMG-01` | AI Guardrails | "I have severe crushing chest pain radiating to left arm..." | Immediate emergency triage flag (`isEmergency: true`) | Critical alert + 108 guidance | ✅ PASS |
| `TC-EMG-04` | AI Guardrails | "Sudden facial drooping and slurred speech..." | FAST stroke protocol triage triggered | Immediate emergency protocol | ✅ PASS |
| `TC-LAB-01` | Lab Analyzer | "CBC Report: Hemoglobin 9.5 g/dL, WBC 14500, Platelets 85000" | Identify 3 abnormal parameters (Low Hb, High WBC, Low Plt) | Correctly parsed & flagged | ✅ PASS |
| `TC-LAB-03` | Lab Analyzer | "Kidney Panel: Serum Creatinine 2.4 mg/dL, Blood Urea 68 mg/dL" | Flag elevated renal biomarkers | Correctly parsed & flagged | ✅ PASS |
| `TC-RAG-01` | RAG Engine | "What is diabetes and what are its symptoms?" | Retrieve Endocrinology guidelines & citation | Grounded response + citations | ✅ PASS |
| `TC-RAG-05` | RAG Engine | "What is the FAST protocol for stroke?" | Retrieve Neurological emergency guide | Grounded response + citations | ✅ PASS |
| `TC-SYS-01` | Backend API | `GET /health` | HTTP 200 `{ status: "OK" }` | HTTP 200 OK | ✅ PASS |
| `TC-AUTH-01`| Authentication| Admin login with valid credentials | HTTP 200 + Signed JWT token | HTTP 200 + Bearer Token | ✅ PASS |
| `TC-AUTH-04`| Authentication| Submit invalid password | HTTP 401 Unauthorized | HTTP 401 Unauthorized | ✅ PASS |
| `TC-DOC-02` | Doctor Portal | `GET /api/doctor-portal/dashboard` | HTTP 200 + Doctor appointments | HTTP 200 OK | ✅ PASS |
| `TC-WRD-01` | Wards & Beds | `GET /api/wards` | HTTP 200 + Ward bed matrix | HTTP 200 OK | ✅ PASS |
| `TC-BIL-01` | Billing | `GET /api/billing` | HTTP 200 + Financial invoice records | HTTP 200 OK | ✅ PASS |

---

## 12. BUGS AND FIXES (DEVELOPMENT LOG)

From the project's Git commit history (91 commits) and debugging trajectories, the following major defects were identified and resolved:

1. **Defect: Appointment Date Slicing TypeError (`(a.appointmentDate || a.date || "").slice is not a function`)**
   - *Root Cause:* In `PatientAppointmentsPage.tsx`, `appointmentDate` stored as a MongoDB `Date` object returned as an ISO string or object; calling `.slice()` directly on non-string representations triggered a client runtime crash.
   - *Fix:* Wrapped the date accessor in `String(a.appointmentDate || a.date || '').slice(0, 10)` with fallback to `new Date().toISOString()`.
2. **Defect: Appointment Creation Validation Failure (`Path consultationFee is required`)**
   - *Root Cause:* `Appointment` schema marked `consultationFee` as required, but the booking modal submission payload omitted the fee when booked through quick discovery.
   - *Fix:* Updated `appointmentController.js` and `PatientBookAppointmentPage.tsx` to automatically look up the selected doctor's `consultationFee` (defaulting to ₹500 if unset) and inject it into the appointment document before persistence.
3. **Defect: Blank White Screen on Patient Payments Page (`/patient/payments`)**
   - *Root Cause:* Uncaught null pointer when accessing nested invoice fields (`invoice.services.map(...)`) when newly registered patients had zero initial invoices.
   - *Fix:* Added optional chaining (`invoice?.services || []`) and implemented an empty state illustration with a "No outstanding payments" card.
4. **Defect: Multi-Word Emergency Triage Bypass in AI Assistant**
   - *Root Cause:* The emergency evaluator regex used strict token boundaries (`/\b(chest pain|heart attack)\b/`) that failed when users input modifiers like "severe crushing arterial chest pain" or "accidentally swallowed chemical poison".
   - *Fix:* Generalized the emergency regex patterns in `intelligentAIEngine.js` using fuzzy wildcard matching and comprehensive symptom keywords.
5. **Defect: Mongoose Model Ward Export Destructuring Crash**
   - *Root Cause:* `Ward.js` exported `{ Ward, Bed }`, but controllers attempted `models.Ward.find()`, throwing `TypeError: Ward.find is not a function`.
   - *Fix:* Destructured `{ Ward, Bed } = require('../models/Ward')` across controllers and seeders.
6. **Defect: ActivityLog Enum Validation Failure on Ward & Pharmacy Logs**
   - *Root Cause:* `ActivityLog` model enum only accepted singular `'ward'` and `'medicine'`, while operations logged `'wards'` and `'pharmacy'`.
   - *Fix:* Updated `activityLogSchema` enum in `backend/src/models/ActivityLog.js` to include `'wards'` and `'pharmacy'`.

---

## 13. PROJECT METRICS

- **Total Source Files:** 155 files
- **Total Lines of Code (LOC):** 32,110 lines
  - **Backend (Node.js / Express):** 85 files, 10,216 lines of code
  - **Frontend (React / TypeScript / CSS):** 70 files, 21,894 lines of code
- **Git Commits:** 91 commits across development branches
- **Active Database Collections:** 14 collections on MongoDB Atlas
- **Total Live Database Documents:**
  - `activitylogs`: 2,288 records
  - `beds`: 150 records
  - `appointments`: 104 records
  - `users`: 85 records (33 Patients, 37 Doctors, 14 Admins, 1 Nurse)
  - `aichataudits`: 62 records
  - `doctors`: 37 records
  - `patients`: 32 records
  - `medicalknowledges`: 25 chunks
  - `aichatsessions`: 20 sessions
  - `billings`: 18 invoices
  - `medicines`: 15 records
  - `emergencyrequests`: 8 records
  - `medicalrecords`: 5 records
  - `wards`: 3 units
- **Automated Verification:** 64 test cases, 100% pass rate.

---

## 14. SETUP AND INSTALLATION GUIDE

### 14.1 Prerequisites
- **Node.js:** Version 20.19.0 or higher (Node 22 recommended)
- **npm:** Version 10.0.0 or higher
- **MongoDB:** Active MongoDB Atlas URI or local MongoDB instance (port 27017)
- **Google GenAI API Key:** For Gemini 2.5 Flash assistant features

### 14.2 Environment Configuration

Create `backend/.env`:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.2b610mr.mongodb.net/kushal_hospitals?retryWrites=true&w=majority
JWT_SECRET=kushal_hospitals_super_secure_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=AIzaSy...your_gemini_api_key
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
CLIENT_URL=http://localhost:5173
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001/api
```

### 14.3 Step-by-Step Installation Commands

```bash
# 1. Clone the repository
git clone https://github.com/2303A51621/Hospital-management-system.git
cd "hospital management"

# 2. Install backend dependencies
cd backend
npm install

# 3. Seed demo users & medical knowledge
node scripts/ensureDemoUsers.js
node src/data/seedMedicalKnowledge.js
node src/data/seedWards.js
node src/data/seedMedicines.js

# 4. Run automated test suites
node scripts/testAIAssistantSuite.js
node scripts/testBackendApiSuite.js

# 5. Start backend development server
npm run dev # Runs on http://localhost:5001

# 6. In a new terminal, install frontend dependencies & run
cd ../frontend
npm install
npm run dev # Runs on http://localhost:5173
```

---

## 15. DEPLOYMENT AND DEVOPS

- **Cloud Platform:** Render Cloud Platform (`render.yaml` infrastructure-as-code blueprint)
- **Backend Service:** Linux Container (Ubuntu / Node 22), Express 5 API server.
- **Frontend Hosting:** Render Static Site / Vercel with SPA rewrite rules (`/*` -> `/index.html`).
- **Database:** MongoDB Atlas M0 Free/Shared Cluster in AWS Mumbai (`ap-south-1`) with automated daily backups and TLS 1.3 encryption in transit.
- **Continuous Integration (CI):** Automated linting (`eslint .`) and TypeScript verification (`tsc -b && vite build`) prior to deployment.

---

## 16. LIMITATIONS AND FUTURE WORK

1. **WebRTC Video Signaling:** While video consultation data structures exist, live peer-to-peer audio/video streaming currently utilizes placeholder redirects. Implementing a signaling gateway (e.g. via Socket.io or LiveKit) is planned.
2. **Offline Progressive Web App (PWA) Caching:** The current build relies on active network connectivity. Implementing service workers and IndexedDB for offline prescription reading would benefit rural healthcare environments.
3. **Speech-to-Text Clinical Transcription:** While browser Web Speech API is integrated for speech playback, fine-tuned medical speech-to-text dictation for doctors during physical examination rounds is a valuable future enhancement.

---

## 17. CAPSTONE PROJECT DETAILS

- **Project Title:** Kushal Hospitals – Enterprise Hospital Management System with Clinical AI Assistance
- **Degree / Program:** Bachelor of Technology (B.Tech) in Computer Science & Engineering
- **Academic Year:** 2025 – 2026
- **Student Name / Author:** Kushal Mandal
- **Student Roll / Registration Number:** NOT FOUND
- **Team Members:** NOT FOUND
- **Project Supervisor / Guide:** NOT FOUND
- **Department:** Department of Computer Science & Engineering
- **Institution / University:** NOT FOUND

*(Note: Fields marked "NOT FOUND" reflect items not specified in codebase metadata; please fill in according to university submission requirements).*

