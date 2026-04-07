import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { subscriptionAPI } from './api'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import AppLayout from './components/shared/AppLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminContent from './pages/admin/AdminContent'
import AdminSubscriptions from './pages/admin/AdminSubscriptions'
import CreatorDashboard from './pages/creator/CreatorDashboard'
import CreatorContent from './pages/creator/CreatorContent'
import ContentForm from './pages/creator/ContentForm'
import SubscriberDashboard from './pages/subscriber/SubscriberDashboard'
import ContentBrowse from './pages/subscriber/ContentBrowse'
import ContentView from './pages/subscriber/ContentView'
import NotFound from './pages/NotFound'


// ✅ Stripe redirects here after successful payment
function SubscriptionSuccess() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    const activate = async () => {
      if (sessionId) {
        try {
          await subscriptionAPI.verifySession(sessionId)
        } catch (err) {
          console.log('Session verify:', err)
        }
      }
      toast.success('🎉 Payment successful! You are now subscribed.')
      navigate('/my-dashboard', { replace: true })
    }

    activate()
  }, [])

  return (
    <div className="loading-page">
      <div className="spinner" />
      <p style={{ color: 'var(--text3)', marginTop: 12 }}>Confirming your payment...</p>
    </div>
  )
}


// ✅ Stripe redirects here if user cancels payment
function SubscriptionCancel() {
  const navigate = useNavigate()

  useEffect(() => {
    toast.error('Payment cancelled. You were not charged.')
    navigate('/browse', { replace: true })
  }, [])

  return (
    <div className="loading-page">
      <div className="spinner" />
      <p style={{ color: 'var(--text3)', marginTop: 12 }}>Redirecting...</p>
    </div>
  )
}


function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  if (user.role === 'creator') return <Navigate to="/creator" replace />
  return <Navigate to="/browse" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1a24', color: '#f0f0f8', border: '1px solid #2a2a3a' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ✅ Stripe payment redirect routes — must be public (no ProtectedRoute) */}
          <Route path="/subscription/success" element={<SubscriptionSuccess />} />
          <Route path="/subscription/cancel" element={<SubscriptionCancel />} />

          {/* Role redirect */}
          <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AppLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
          </Route>

          {/* Creator routes */}
          <Route path="/creator" element={<ProtectedRoute roles={['creator', 'admin']}><AppLayout /></ProtectedRoute>}>
            <Route index element={<CreatorDashboard />} />
            <Route path="content" element={<CreatorContent />} />
            <Route path="content/new" element={<ContentForm />} />
            <Route path="content/edit/:id" element={<ContentForm />} />
          </Route>

          {/* Subscriber routes */}
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="browse" element={<ContentBrowse />} />
            <Route path="content/:id" element={<ContentView />} />
            <Route path="my-dashboard" element={<SubscriberDashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}