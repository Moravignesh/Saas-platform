import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardAPI } from '../../api'
import toast from 'react-hot-toast'
import { BookOpen, CreditCard, CheckCircle } from 'lucide-react'

export default function SubscriberDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.user()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  const activeSubs = data?.active_subscriptions ?? []
  const accessibleContent = data?.accessible_content ?? []
  const billingHistory = data?.billing_history ?? []

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>My Dashboard</h1>
        <p>Your subscriptions and accessible content</p>
      </div>

      {/* Stat Cards */}
      <div className="grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <CheckCircle size={20} color="var(--green)" />
          </div>
          <div className="stat-label">Active Subscriptions</div>
          <div className="stat-value">{activeSubs.length}</div>
          <div className="stat-sub">Currently active</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(124,106,255,0.15)' }}>
            <BookOpen size={20} color="var(--accent)" />
          </div>
          <div className="stat-label">Accessible Content</div>
          <div className="stat-value">{accessibleContent.length}</div>
          <div className="stat-sub">Available to read</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <CreditCard size={20} color="var(--yellow)" />
          </div>
          <div className="stat-label">Billing History</div>
          <div className="stat-value">{billingHistory.length}</div>
          <div className="stat-sub">Total transactions</div>
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className="card mb-4">
        <div className="section-title">
          <CheckCircle size={16} /> Active Subscriptions
        </div>
        {activeSubs.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>Expires</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeSubs.map(s => (
                  <tr key={s.id}>
                    <td className="text-sm">Creator #{s.creator_id}</td>
                    <td><span className="badge badge-active">Active</span></td>
                    <td className="text-sm text-muted">
                      {s.start_date ? new Date(s.start_date).toLocaleDateString() : '–'}
                    </td>
                    <td className="text-sm text-muted">
                      {s.expiry_date ? new Date(s.expiry_date).toLocaleDateString() : '–'}
                    </td>
                    <td className="font-bold" style={{ color: 'var(--green)' }}>
                      ${s.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 32 }}>
            <CheckCircle size={40} />
            <h3>No active subscriptions</h3>
            <p><Link to="/browse">Browse creators</Link> to subscribe.</p>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="card">
        <div className="section-title">
          <CreditCard size={16} /> Billing History
        </div>
        {billingHistory.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Creator</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map(s => (
                  <tr key={s.id}>
                    <td className="text-xs text-muted">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-sm">Creator #{s.creator_id}</td>
                    <td className="font-bold" style={{ color: 'var(--green)' }}>
                      ${s.amount}
                    </td>
                    <td>
                      <span className={`badge badge-${s.status}`}>{s.status}</span>
                    </td>
                    <td className="text-xs text-muted truncate" style={{ maxWidth: 160 }}>
                      {s.stripe_transaction_id || '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 32 }}>
            No billing history
          </div>
        )}
      </div>
    </div>
  )
}