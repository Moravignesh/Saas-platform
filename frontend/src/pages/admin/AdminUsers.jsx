import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'
import { Trash2, ShieldOff, Shield, Search } from 'lucide-react'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminAPI.getUsers().then(r => setUsers(r.data)).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false))
  }, [])

  const handleBlock = async (id) => {
    try {
      const r = await adminAPI.blockUser(id)
      setUsers(u => u.map(x => x.id === id ? { ...x, is_blocked: r.data.is_blocked } : x))
      toast.success(r.data.message)
    } catch (err) { toast.error(err.response?.data?.detail || 'Action failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user permanently?')) return
    try {
      await adminAPI.deleteUser(id)
      setUsers(u => u.filter(x => x.id !== id))
      toast.success('User deleted')
    } catch (err) { toast.error(err.response?.data?.detail || 'Delete failed') }
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page-content">
      <div className="page-header"><h1>User Management</h1><p>Manage all platform users</p></div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
            <Search size={15} color="var(--text3)" />
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-sm text-muted">{filtered.length} users</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{u.username[0].toUpperCase()}</div>
                      <div>
                        <div className="font-bold text-sm">{u.username}</div>
                        <div className="text-xs text-muted">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td>{u.is_blocked ? <span className="badge badge-expired">Blocked</span> : <span className="badge badge-active">Active</span>}</td>
                  <td className="text-sm text-muted">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className={`btn btn-sm ${u.is_blocked ? 'btn-success' : 'btn-secondary'}`} onClick={() => handleBlock(u.id)}>
                        {u.is_blocked ? <Shield size={13} /> : <ShieldOff size={13} />}{u.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5}><div className="empty-state">No users found</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
