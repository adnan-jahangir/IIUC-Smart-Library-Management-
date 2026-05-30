# IIUC Smart Library Management System - Architecture & Engineering Plan

## 1. Project Architecture Overview
The system follows a modern decoupled architecture using the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) enriched with Real-Time capabilities (Socket.IO) and Artificial Intelligence (external AI providers).

### High-Level Architecture
- **Client Tier**: A React-based Single Page Application (SPA), styled with Tailwind CSS, utilizing Zustand (or Context) for global state management.
- **API Tier**: A RESTful Node.js/Express.js server handling business logic, authentications, and data processing.
- **Data Tier**: MongoDB highly scalable NoSQL data storage (accessed via Mongoose).
- **Background Intelligence**: 
  - `node-cron` for scheduled tasks (fine calculation, overdue emails).
- External AI API integration for intelligent book recommendations and summaries.
  - `Socket.IO` for real-time dashboards, availability updates, and queue notifications.

## 2. Feature Breakdown by Role

### Guest (Public)
- View modern, premium academic landing page.
- Browse catalog, search, and view book details.
- Interact with AI Assistant preview (limited features).
- *Cannot borrow/reserve. Prompted to login for any core action.*

### Student
- **Dashboard**: Track borrowed books, due dates, overdue statuses, and current fines.
- **Actions**: Send borrow requests, renew books (max 2 times), reserve unavailable books.
- **AI Assist**: Personalized academic recommendations, book summaries, exam prep insights.
- **Notifications**: Real-time updates on request approvals, due date warnings.

### Teacher
- **Dashboard**: Track borrowed, reserved, and academic requests.
- **Actions**: Same core actions as Student, plus the ability to *Request Academic/Research Books* to be added to the library inventory.
- **AI Assist**: Discover reference materials, summarize dense research textbooks.

### Librarian
- **Dashboard**: Operational overview (books issued/returned today, pending requests).
- **Core Operations**: Approve/reject borrows, manually issue/return books, manage book stock, manage reservation queues.
- **Management**: Track overdue lists and fine collections. Send manual or automated alerts.

### Admin
- **Dashboard**: High-level statistical tracking (Total users, books, fines collected, AI usage dashboards).
- **Management**: Register/manage Librarians, oversee system settings.
- **Analytics**: System-wide trends, department-wise book usage.

## 3. Database Schema Plan (MongoDB / Mongoose)

1. **User Model**: 
   - `id`, `name`, `email`, `passwordHash`, `role` (Enum: Student, Teacher, Librarian, Admin), `universityId`, `department`, `semester`, `isActive`.
2. **Book Model**:
   - `id`, `title`, `author`, `isbn`, `description`, `department`, `category`, `semester`, `totalCopies`, `availableCopies`, `coverImageUrl`, `locationRack`.
3. **BorrowRecord Model**:
   - `id`, `bookId`, `userId`, `status` (Enum: Pending, Approved, Issued, Returned, Rejected), `issueDate`, `dueDate`, `returnDate`, `renewalCount`, `fineAmount`.
4. **Reservation Model**:
   - `id`, `bookId`, `userId`, `status` (Enum: Waiting, Notified, Fulfilled, Canceled), `queuePosition`, `requestDate`.
5. **FineTransaction Model**:
   - `id`, `userId`, `borrowRecordId`, `amount`, `status` (Enum: Unpaid, Paid), `createdAt`.
6. **Notification Model**:
   - `id`, `userId`, `message`, `type` (Alert, Info, Success), `isRead`, `createdAt`.
7. **AcademicRequest Model** (Teacher specific):
   - `id`, `teacherId`, `title`, `author`, `reason`, `status`.

## 4. Frontend Folder Structure
```text
/src
 ├── assets/          # Images, logos, icons
 ├── components/
 │   ├── common/      # Reusable UI (Buttons, Modals, Inputs, StatusBadges)
 │   ├── layout/      # Navigate/Sidebars (PublicLayout, DashboardLayout)
 │   └── specific/    # Domain UI (BookCard, AIChatbox, FineWarningCard)
 ├── pages/
 │   ├── public/      # Home, Catalog, BookDetails, About
 │   ├── auth/        # Login, Register
 │   ├── student/     # Student Dashboard pages
 │   ├── teacher/     # Teacher Dashboard pages
 │   ├── librarian/   # Librarian Management pages
 │   └── admin/       # Admin Analytics pages
 ├── store/           # Zustand state slices (authStore, uiStore, cartStore)
 ├── hooks/           # Custom React Hooks (useAuth, useSocket, useBooks)
 ├── services/        # Axios API configurations and endpoints
 ├── utils/           # Formatting dates, text truncations, fine calculations
 ├── routes/          # Protected and Public Route wrappers
 └── App.jsx          # Main routing & configuration tree
```

## 5. Backend Folder Structure
```text
/server
 ├── src/
 │   ├── config/        # Environment, DB connect, Socket init, Mailer configs
 │   ├── controllers/   # Request handling logic (auth.controller, book.controller)
 │   ├── middlewares/   # JWT verification, Role checks, Error handling logs
 │   ├── models/        # Mongoose Schemas (User, Book, BorrowRecord, etc.)
 │   ├── routes/        # API routing definitions
 │   ├── services/      # Complex business logic (ai.service, mail.service)
 │   ├── sockets/       # Socket.IO event listeners and emitters
 │   ├── utils/         # Cron jobs (daily penalty checks), general helpers
 │   └── app.js         # Express app initialization
 ├── .env               # Secrets
 └── server.js          # Entry execution script
```

## 6. Route Map (Frontend)

**Public Routes:**
- `/` - Premium Landing Page
- `/catalog` - Full Book Catalog with Filters
- `/book/:id` - Detailed Book View
- `/login`, `/register` - Authentication

**Protected Student/Teacher Routes:**
- `/dashboard` - Overview Cards
- `/dashboard/borrows` - Active borrows & Return history
- `/dashboard/requests` - Track pending borrow requests
- `/dashboard/reservations` - Queue status for out-of-stock books
- `/dashboard/ai-assistant` - Dedicated AI Summarizer / Chat
- `/dashboard/academic-requests` - (Teacher Only) Request new library additions

**Protected Librarian Routes:**
- `/librarian` - Operations Dashboard
- `/librarian/manage-books` - CRUD inventory operations
- `/librarian/borrow-requests` - Pending workflow queue (Approve/Reject)
- `/librarian/overdue-fines` - Track defaults and manual overrides

**Protected Admin Routes:**
- `/admin` - Analytics Overview (Charts / System stats)
- `/admin/manage-users` - Role management & Librarian creation

## 7. API Plan (Backend)

**Auth API:**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

**Books API:**
- `GET /api/books` (Public catalog with filters/pagination/search)
- `GET /api/books/:id`
- `POST /api/books` (Librarian/Admin only)
- `PUT /api/books/:id`

**Borrows & Fines API:**
- `POST /api/borrows/request` (Student/Teacher)
- `PUT /api/borrows/:id/approve` (Librarian)
- `POST /api/borrows/:id/renew`
- `PUT /api/borrows/:id/return`
- `GET /api/fines`

**Reservations API:**
- `POST /api/reservations/queue`
- `GET /api/reservations/book/:id`

**AI & Analytics API:**
- `POST /api/ai/recommend`
- `POST /api/ai/summarize`
- `GET /api/analytics/system-overview` (Admin)

## 8. Development Roadmap (Module Build Order)

### PHASE 1: Planning & Architecture (Current)
- Establish system architecture, folder layouts, and component breakdown.

### PHASE 2: Frontend UI & Public Features
- Initialize React (Vite), Tailwind CSS setup.
- Build High-end Landing Page, NavBar, Footer.
- Build Public Book Catalog, Book Cards, Login/Register UI.
- Establish role-based routing layout (Dashboard Wrapper).

### PHASE 3: Backend Core & Authentication
- Initialize Node/Express server.
- Setup MongoDB schemas (User, Book).
- Implement JWT Auth System & Role Middlewares.
- Build Book CRUD API.

### PHASE 4: Library Core Engine (Borrow/Renew/Fine/Reserve)
- Backend: Implement Borrowing policy (15 days, max 2 renewals).
- Backend: Setup Reservation queue logic.
- Frontend: Student/Teacher action panels, Librarian Approval queues.

### PHASE 5: Intelligence & Automations
- Integrate the AI assistant for recommendations, summaries, and study help.
- Set up `node-cron` to automatically calculate daily fines (5 BDT/day).
- Add `Nodemailer` for due date warnings.

### PHASE 6: Real-Time & Analytics
- Attach Socket.IO for live dashboard stat updates and borrow status changes.
- Build Recharts data visualization for Admin Panel.
- Polish UI/UX, Seed Data, and final integrations.
