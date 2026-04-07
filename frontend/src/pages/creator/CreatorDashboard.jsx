import React, { useEffect, useState } from 'react'
import { dashboardAPI } from '../../api'
import { Link } from 'react-router-dom'
import { Users, DollarSign, FileText, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreatorDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.creator().then(r => setData(r.data)).catch(() => toast.error('Failed to load dashboard')).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page-content">
      <div className="page-header flex items-center justify-between">
        <div><h1>Creator Studio</h1><p>Your content performance at a glance</p></div>
        <Link to="/creator/content/new" className="btn btn-primary"><Plus size={16} />New Content</Link>
      </div>
      <div className="grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(124,106,255,0.15)' }}><Users size={20} color="var(--accent)" /></div>
          <div className="stat-label">Subscribers</div>
          <div className="stat-value">{data?.total_subscribers ?? 0}</div>
          <div className="stat-sub">Active this month</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}><DollarSign size={20} color="var(--green)" /></div>
          <div className="stat-label">Revenue</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>${(data?.total_revenue ?? 0).toFixed(2)}</div>
          <div className="stat-sub">Total earned</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}><FileText size={20} color="var(--accent3)" /></div>
          <div className="stat-label">Content</div>
          <div className="stat-value">{data?.content_count ?? 0}</div>
          <div className="stat-sub">Published pieces</div>
        </div>
      </div>
      <div className="card">
        <div className="section-title">Recent Subscriptions</div>
        {data?.recent_subscriptions?.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Subscriber</th><th>Status</th><th>Amount</th><th>Date</th><th>Expires</th></tr></thead>
              <tbody>
                {data.recent_subscriptions.map(s => (
                  <tr key={s.id}>
                    <td className="text-sm">User #{s.subscriber_id}</td>
                    <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                    <td className="font-bold" style={{ color: 'var(--green)' }}>${s.amount}</td>
                    <td className="text-xs text-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="text-xs text-muted">{s.expiry_date ? new Date(s.expiry_date).toLocaleDateString() : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><Users size={40} /><h3>No subscribers yet</h3><p>Publish premium content to start earning</p></div>
        )}
      </div>
    </div>
  )
}
