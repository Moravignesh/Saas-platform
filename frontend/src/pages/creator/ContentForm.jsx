import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { contentAPI } from '../../api'
import toast from 'react-hot-toast'
import { Save, ArrowLeft } from 'lucide-react'

export default function ContentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id)
  const [form, setForm] = useState({ title: '', description: '', body: '', content_url: '', is_premium: false })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEditing)

  useEffect(() => {
    if (isEditing) {
      contentAPI.get(id)
        .then(r => { const { title, description, body, content_url, is_premium } = r.data; setForm({ title: title||'', description: description||'', body: body||'', content_url: content_url||'', is_premium: is_premium||false }) })
        .catch(() => toast.error('Failed to load content'))
        .finally(() => setFetching(false))
    }
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      if (isEditing) { await contentAPI.update(id, form); toast.success('Content updated!') }
      else { await contentAPI.create(form); toast.success('Content created!') }
      navigate('/creator/content')
    } catch (err) { toast.error(err.response?.data?.detail || 'Save failed') }
    finally { setLoading(false) }
  }

  if (fetching) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page-content">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: 12 }}><ArrowLeft size={14} />Back</button>
        <h1>{isEditing ? 'Edit Content' : 'Create Content'}</h1>
      </div>
      <div className="card" style={{ maxWidth: 720 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter content title" required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" rows={2} />
          </div>
          <div className="form-group">
            <label className="form-label">Content Body</label>
            <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} placeholder="Write your content here..." rows={8} />
          </div>
          <div className="form-group">
            <label className="form-label">Content URL (optional)</label>
            <input type="url" value={form.content_url} onChange={e => setForm({ ...form, content_url: e.target.value })} placeholder="https://example.com/video" />
          </div>
          <div className="form-group">
            <label className="flex items-center gap-3" style={{ cursor: 'pointer', width: 'auto' }}>
              <input type="checkbox" checked={form.is_premium} onChange={e => setForm({ ...form, is_premium: e.target.checked })} style={{ width: 'auto' }} />
              <span className="form-label" style={{ margin: 0 }}>Premium content (subscribers only)</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={15} />{loading ? 'Saving...' : isEditing ? 'Update Content' : 'Publish Content'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
