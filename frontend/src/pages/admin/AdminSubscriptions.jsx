import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'

export default function AdminSubscriptions() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getSubscriptions().then(r => setSubs(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }, [])

  const badge = (s) => {
    const map = { active: 'badge-active', expired: 'badge-expired', pending: 'badge-pending', cancelled: 'badge-cancelled' }
    return <span className={`badge ${map[s] || 'badge-pending'}`}>{s}</span>
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page-content">
      <div className="page-header"><h1>Subscription Monitor</h1><p>Track all platform subscriptions</p></div>
      <div className="flex gap-3 mb-6">
        {['active', 'expired', 'pending', 'cancelled'].map(status => (
          <div key={status} className="card card-sm" style={{ flex: 1, textAlign: 'center' }}>
            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{subs.filter(s => s.status === status).length}</div>
            <div style={{ marginTop: 4 }}>{badge(status)}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Subscriber</th><th>Creator</th><th>Status</th><th>Amount</th><th>Start</th><th>Expiry</th><th>Transaction</th></tr></thead>
            <tbody>
              {subs.map(s => (
                <tr key={s.id}>
                  <td className="text-muted text-xs">#{s.id}</td>
                  <td className="text-sm">User #{s.subscriber_id}</td>
                  <td className="text-sm">Creator #{s.creator_id}</td>
                  <td>{badge(s.status)}</td>
                  <td className="font-bold text-sm" style={{ color: 'var(--green)' }}>${s.amount}</td>
                  <td className="text-xs text-muted">{s.start_date ? new Date(s.start_date).toLocaleDateString() : '–'}</td>
                  <td className="text-xs text-muted">{s.expiry_date ? new Date(s.expiry_date).toLocaleDateString() : '–'}</td>
                  <td className="text-xs text-muted truncate" style={{ maxWidth: 120 }}>{s.stripe_transaction_id || '–'}</td>
                </tr>
              ))}
              {subs.length === 0 && <tr><td colSpan={8}><div className="empty-state">No subscriptions yet</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
