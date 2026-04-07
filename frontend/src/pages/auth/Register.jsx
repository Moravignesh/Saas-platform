import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', username: '', password: '', role: 'subscriber' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>ContentHub</h1>
          <p>Create your account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="yourusername" required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="subscriber">Subscriber – Access content</option>
              <option value="creator">Creator – Publish content</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
            <UserPlus size={16} />{loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-sm text-muted" style={{ marginTop: 20, textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
