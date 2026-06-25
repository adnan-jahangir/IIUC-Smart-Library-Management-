# 📚 IIUC Smart Library Management

A modern, full-stack library management system designed for the International Islamic University Chittagong (IIUC). Built on the **MERN Stack** and supercharged with an **AI Copilot**, it optimizes day-to-day library operations, automates book tracking, and provides intelligent recommendations and instant search support for students and faculty.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://iiuc-smartlibrary.vercel.app/)
[![Tech Stack](https://img.shields.io/badge/Stack-MERN%20%7C%20AI%20Chat%20%7C%20Vite-blue)](#tech-stack)

---

## ✨ Features

### 🤖 Intelligent AI Library Assistant
- **Natural Language Search:** Find books by describing topics instead of exact keywords (e.g., *"Show me books on complex databases for 3rd-year CSE"*).
- **Automated Book Summarization:** Get quick, AI-generated abstracts and key takeaways of library books directly on the detail page.
- **Smart Recommendations:** Contextual recommendations based on a student's department, current semester, or past reading trends.
- **24/7 Virtual Librarian Chatbot:** Handles routine inquiries like check-out policies, opening hours, or dynamic fine rules instantly.

### 🛡️ Role-Based Access Control (RBAC)
- **Student/Faculty Portals:** Browse the catalog, check real-time availability, hold items, and view individual borrowing histories.
- **Admin Dashboard:** Centralized panel for librarians to manage books, issue/return copies, register members, and audit system logs.

### 📖 Smart Cataloging & Inventory
- **Real-time Availability:** Live stock counters that auto-update whenever a book is checked in or issued out.
- **Categorization:** Advanced searching, filtering, and indexing by title, author, department, or shelf location.

### 🔄 Automated Borrowing Workflow
- **Digital Issue & Return:** Streamlined processing using student ID lookup to eliminate manual registration errors.
- **Fine Management:** Automated system to track overdue items, calculate dynamic late fines, and lock borrowing privileges when caps are exceeded.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Context API
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **AI Integration:** Google Gemini API / OpenAI API via LangChain (or native integration)
- **Authentication:** JSON Web Tokens (JWT) & Bcrypt hashing

---

## 📂 Project Structure

```text
iiuc-smart-library/
├── backend/            # Node/Express server configuration
│   ├── config/         # Database, AI API, and server connections
│   ├── controllers/    # Request handlers (Auth, Book, Transaction, AI Chat)
│   ├── models/         # MongoDB schemas (User, Book, Transaction, ChatHistory)
│   ├── routes/         # Dedicated API endpoints (includes /api/ai)
│   └── server.js       # Backend entry point
│
└── frontend/           # Vite + React single-page application
    ├── src/
    │   ├── components/ # Reusable UI components (Navbar, ChatWidget, Tables)
    │   ├── context/    # Global authentication and AI streaming states
    │   ├── pages/      # View layouts (Dashboard, Catalog, AI-Assistant, History)
    │   └── utils/      # Client-side API fetch functions
