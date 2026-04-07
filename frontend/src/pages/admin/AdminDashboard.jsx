import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, FileText, DollarSign, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const COLORS = ['#7c6aff', '#10b981', '#f59e0b', '#ef4444', '#06b6d4']

function StatCard({ label, value, sub, icon, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: color + '20' }}>
        {React.cloneElement(icon, { size: 20, color })}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [revenue, setRevenue] = useState([])
  const [growth, setGrowth] = useState([])
  const [dist, setDist] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminAPI.summary(), adminAPI.revenue(), adminAPI.usersGrowth(), adminAPI.subscriptionDist()])
      .then(([s, r, g, d]) => {
        setSummary(s.data); setRevenue(r.data.slice(-14))
        setGrowth(g.data.slice(-14)); setDist(d.data)
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page-content">
      <div className="page-header"><h1>Admin Dashboard</h1><p>Platform overview and analytics</p></div>

      {summary && (
        <div className="grid-4 mb-6">
          <StatCard label="Total Users" value={summary.total_users} sub={`+${summary.new_users_this_week} this week`} icon={<Users />} color="#7c6aff" />
          <StatCard label="Active Subs" value={summary.active_subscriptions} sub="Currently active" icon={<UserCheck />} color="#10b981" />
          <StatCard label="Total Revenue" value={`$${summary.total_revenue.toFixed(2)}`} sub="All time" icon={<DollarSign />} color="#f59e0b" />
          <StatCard label="Content" value={summary.content_count} sub={`${summary.total_creators} creators`} icon={<FileText />} color="#06b6d4" />
        </div>
      )}

      <div className="grid-2 mb-6">
        <div className="chart-container">
          <div className="chart-title">Revenue – Last 14 days</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="date" tick={{ fill: '#606078', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#606078', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#7c6aff" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-container">
          <div className="chart-title">User Growth – Last 14 days</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
              <XAxis dataKey="date" tick={{ fill: '#606078', fontSize: 10 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fill: '#606078', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} />
              <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="chart-container">
          <div className="chart-title">Subscription Distribution</div>
          {dist.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dist} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}>
                  {dist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: 40 }}>No subscription data yet</div>
          )}
        </div>
        {summary && (
          <div className="card">
            <div className="chart-title">Quick Stats</div>
            {[
              { label: 'Creators', value: summary.total_creators, color: '#f59e0b' },
              { label: 'Subscribers', value: summary.total_subscribers, color: '#7c6aff' },
              { label: 'New this month', value: summary.new_users_this_month, color: '#10b981' },
              { label: 'Total Revenue', value: `$${summary.total_revenue.toFixed(2)}`, color: '#06b6d4' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between"
                style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="text-sm text-muted">{item.label}</span>
                <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
