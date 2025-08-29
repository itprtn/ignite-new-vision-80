
import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../components/auth-provider'
import { Toaster } from '../components/ui/toaster'
import { useAppPersistence } from '../hooks/use-app-persistence'

// Import des pages principales
import DashboardPage from './pages/Dashboard'
import CampaignsPage from './pages/Campaigns'
import ProjectsPage from './pages/Projects'
import AnalyticsPage from './pages/Analytics'
import EmailTemplatesPage from './pages/EmailTemplates'
import SettingsPage from './pages/Settings'
import LoginPage from './pages/Login'
import SignupPage from './pages/Signup'
import ProjectDetailsPage from './pages/ProjectDetails'
import LeadGenerationPage from './pages/LeadGeneration'
import CommissionsPage from './pages/Commissions'

function AppContent() {
  // Initialize app persistence for better navigation stability
  useAppPersistence()

  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/campaigns" element={<CampaignsPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<ProjectDetailsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/email-templates" element={<EmailTemplatesPage />} />
      <Route path="/lead-generation" element={<LeadGenerationPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/commissions" element={<CommissionsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
