import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { contentAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Plus, Edit2, Trash2, Lock, Unlock } from 'lucide-react'

export default function CreatorContent() {
  const { user } = useAuth()
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    contentAPI.list().then(r => setContent(r.data.filter(c => c.creator_id === user?.id))).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }, [user])

  const handleDelete = async (id) => {
    if (!confirm('Delete this content?')) return
    try { await contentAPI.delete(id); setContent(c => c.filter(x => x.id !== id)); toast.success('Deleted') }
    catch { toast.error('Delete failed') }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page-content">
      <div className="page-header flex items-center justify-between">
        <div><h1>My Content</h1><p>{content.length} published pieces</p></div>
        <Link to="/creator/content/new" className="btn btn-primary"><Plus size={16} />New Content</Link>
      </div>
      {content.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Plus size={48} /><h3>No content yet</h3><p>Create your first piece of content</p>
            <Link to="/creator/content/new" className="btn btn-primary" style={{ marginTop: 16 }}>Create Content</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {content.map(c => (
            <div key={c.id} className="card" style={{ padding: '16px 20px' }}>
              <div className="flex items-center justify-between">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{c.title}</span>
                    <span className={`badge ${c.is_premium ? 'badge-premium' : 'badge-free'}`}>
                      {c.is_premium ? <><Lock size={10} />Premium</> : <><Unlock size={10} />Free</>}
                    </span>
                  </div>
                  <p className="text-sm text-muted truncate">{c.description || 'No description'}</p>
                  <p className="text-xs text-muted" style={{ marginTop: 4 }}>Created {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/creator/content/edit/${c.id}`} className="btn btn-secondary btn-sm"><Edit2 size={13} />Edit</Link>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
