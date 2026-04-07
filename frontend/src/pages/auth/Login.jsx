import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { LogIn } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.username}!`)
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'creator') navigate('/creator')
      else navigate('/browse')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role) => {
    const demos = {
      admin: { email: 'admin@platform.com', password: 'Admin@123' },
      creator: { email: 'creator@demo.com', password: 'Creator@123' },
      subscriber: { email: 'user@demo.com', password: 'User@123' },
    }
    setForm(demos[role])
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>ContentHub</h1>
          <p>Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            <LogIn size={16} />{loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <p className="text-xs text-muted" style={{ marginBottom: 10 }}>Demo accounts (click to fill):</p>
          <div className="flex gap-2">
            {['admin', 'creator', 'subscriber'].map(role => (
              <button key={role} onClick={() => fillDemo(role)} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>{role}</button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted" style={{ marginTop: 20, textAlign: 'center' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}
