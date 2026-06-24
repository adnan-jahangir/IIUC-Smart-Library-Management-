import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import TeacherLayout from './layouts/TeacherLayout';
import LibrarianLayout from './layouts/LibrarianLayout';
import AdminLayout from './layouts/AdminLayout';

// Protected Route Component
import ProtectedRoute from './routes/ProtectedRoute';

// === Public Pages ===
import Home from './pages/public/Home';
import Catalog from './pages/public/Catalog';
import BookDetails from './pages/public/BookDetails';
import Departments from './pages/public/Departments';
import FeaturedBooks from './pages/public/FeaturedBooks';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import DigitalReader from './pages/public/DigitalReader';

// === Student Pages ===
import StudentDashboard from './pages/student/StudentDashboard';
import StudentSearchBooks from './pages/student/StudentSearchBooks';
import StudentMyBooks from './pages/student/StudentMyBooks';
import StudentBorrowRequests from './pages/student/StudentBorrowRequests';
import StudentReservations from './pages/student/StudentReservations';
import StudentFines from './pages/student/StudentFines';
import StudentNotifications from './pages/student/StudentNotifications';
import StudentProfile from './pages/student/StudentProfile';

// === Teacher Pages ===
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherSearchBooks from './pages/teacher/TeacherSearchBooks';
import TeacherMyBooks from './pages/teacher/TeacherMyBooks';
import TeacherBorrowRequests from './pages/teacher/TeacherBorrowRequests';
import TeacherReservations from './pages/teacher/TeacherReservations';
import TeacherAcademicRequests from './pages/teacher/TeacherAcademicRequests';

import TeacherNotifications from './pages/teacher/TeacherNotifications';
import TeacherProfile from './pages/teacher/TeacherProfile';
import AIAssistantDocumentTab from './pages/shared/AIAssistantDocumentTab';
import AIAssistantRoadmapTab from './pages/shared/AIAssistantRoadmapTab';
import AIAssistantContainer from './pages/shared/AIAssistantContainer';
import AIAssistantChatTab from './pages/shared/AIAssistantChatTab';
import AIAssistantRecommendationsTab from './pages/shared/AIAssistantRecommendationsTab';

// === Librarian Pages ===
import LibrarianDashboard from './pages/librarian/LibrarianDashboard';
import LibrarianManageBooks from './pages/librarian/LibrarianManageBooks';
import LibrarianBorrowRequests from './pages/librarian/LibrarianBorrowRequests';
import LibrarianIssueBooks from './pages/librarian/LibrarianIssueBooks';
import LibrarianReturnBooks from './pages/librarian/LibrarianReturnBooks';
import LibrarianReservations from './pages/librarian/LibrarianReservations';
import LibrarianOverdueList from './pages/librarian/LibrarianOverdueList';
import LibrarianFines from './pages/librarian/LibrarianFines';
import LibrarianNotifications from './pages/librarian/LibrarianNotifications';
import LibrarianReports from './pages/librarian/LibrarianReports';
import LibrarianProfile from './pages/librarian/LibrarianProfile';

// === Admin Pages ===
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminManageUsers from './pages/admin/AdminManageUsers';
import AdminManageRoles from './pages/admin/AdminManageRoles';
import AdminBooksOverview from './pages/admin/AdminBooksOverview';
import AdminBorrowAnalytics from './pages/admin/AdminBorrowAnalytics';
import AdminFineAnalytics from './pages/admin/AdminFineAnalytics';
import AdminAIUsage from './pages/admin/AdminAIUsage';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import AdminProfile from './pages/admin/AdminProfile';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* === Public Routes === */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/book/:id" element={<BookDetails />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/featured" element={<FeaturedBooks />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route path="/digital-reader/:id" element={<DigitalReader />} />

        {/* === Student Routes === */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="search" element={<StudentSearchBooks />} />
            <Route path="my-books" element={<StudentMyBooks />} />
            <Route path="borrow-requests" element={<StudentBorrowRequests />} />
            <Route path="reservations" element={<StudentReservations />} />
            <Route path="fines" element={<StudentFines />} />
            <Route path="ai-assistant" element={<AIAssistantContainer />}>
              <Route index element={<Navigate to="chat" replace />} />
              <Route path="chat" element={<AIAssistantChatTab />} />
              <Route path="docs" element={<AIAssistantDocumentTab />} />
              <Route path="roadmap" element={<AIAssistantRoadmapTab />} />
              <Route path="recommendations" element={<AIAssistantRecommendationsTab />} />
            </Route>
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
        </Route>

        {/* === Teacher Routes === */}
        <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
          <Route path="/teacher" element={<TeacherLayout />}>
            <Route index element={<Navigate to="/teacher/dashboard" replace />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="search" element={<TeacherSearchBooks />} />
            <Route path="my-books" element={<TeacherMyBooks />} />
            <Route path="borrow-requests" element={<TeacherBorrowRequests />} />
            <Route path="reservations" element={<TeacherReservations />} />
            <Route path="academic-requests" element={<TeacherAcademicRequests />} />
            <Route path="ai-assistant" element={<AIAssistantContainer />}>
              <Route index element={<Navigate to="chat" replace />} />
              <Route path="chat" element={<AIAssistantChatTab />} />
              <Route path="docs" element={<AIAssistantDocumentTab />} />
              <Route path="roadmap" element={<AIAssistantRoadmapTab />} />
              <Route path="recommendations" element={<AIAssistantRecommendationsTab />} />
            </Route>
            <Route path="notifications" element={<TeacherNotifications />} />
            <Route path="profile" element={<TeacherProfile />} />
          </Route>
        </Route>

        {/* === Librarian Routes === */}
        <Route element={<ProtectedRoute allowedRoles={['librarian']} />}>
          <Route path="/librarian" element={<LibrarianLayout />}>
            <Route index element={<Navigate to="/librarian/dashboard" replace />} />
            <Route path="dashboard" element={<LibrarianDashboard />} />
            <Route path="manage-books" element={<LibrarianManageBooks />} />
            <Route path="borrow-requests" element={<LibrarianBorrowRequests />} />
            <Route path="issue-books" element={<LibrarianIssueBooks />} />
            <Route path="return-books" element={<LibrarianReturnBooks />} />
            <Route path="reservations" element={<LibrarianReservations />} />
            <Route path="overdue-list" element={<LibrarianOverdueList />} />
            <Route path="fines" element={<LibrarianFines />} />
            <Route path="notifications" element={<LibrarianNotifications />} />
            <Route path="reports" element={<LibrarianReports />} />
            <Route path="profile" element={<LibrarianProfile />} />
          </Route>
        </Route>

        {/* === Admin Routes === */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="manage-users" element={<AdminManageUsers />} />
            <Route path="manage-roles" element={<AdminManageRoles />} />
            <Route path="books-overview" element={<AdminBooksOverview />} />
            <Route path="borrow-analytics" element={<AdminBorrowAnalytics />} />
            <Route path="fine-analytics" element={<AdminFineAnalytics />} />
            <Route path="ai-usage" element={<AdminAIUsage />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Route>

        {/* Fallback 404 Route */}
        <Route path="*" element={
          <div className="flex flex-col items-center justify-center min-h-screen">
            <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
            <p className="text-gray-600 mb-4">The page you are looking for doesn't exist.</p>
            <a href="/" className="text-emerald-600 hover:underline">Go back home</a>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;
