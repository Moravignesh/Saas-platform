import React, { useEffect, useState } from 'react'
import { adminAPI } from '../../api'
import toast from 'react-hot-toast'
import { Trash2, Lock, Unlock, Search } from 'lucide-react'

export default function AdminContent() {
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    adminAPI.getContent().then(r => setContent(r.data)).catch(() => toast.error('Failed to load content')).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Remove this content permanently?')) return
    try {
      await adminAPI.deleteContent(id)
      setContent(c => c.filter(x => x.id !== id))
      toast.success('Content removed')
    } catch { toast.error('Delete failed') }
  }

  const filtered = content.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.creator_username || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page-content">
      <div className="page-header"><h1>Content Moderation</h1><p>Review and remove inappropriate content</p></div>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
            <Search size={15} color="var(--text3)" />
            <input placeholder="Search content..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="text-sm text-muted">{filtered.length} items</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Creator</th><th>Type</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="font-bold text-sm">{c.title}</div>
                    <div className="text-xs text-muted truncate" style={{ maxWidth: 300 }}>{c.description}</div>
                  </td>
                  <td className="text-sm">{c.creator_username || `#${c.creator_id}`}</td>
                  <td>
                    <span className={`badge ${c.is_premium ? 'badge-premium' : 'badge-free'}`}>
                      {c.is_premium ? <><Lock size={10} />Premium</> : <><Unlock size={10} />Free</>}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={13} />Remove</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5}><div className="empty-state">No content found</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
