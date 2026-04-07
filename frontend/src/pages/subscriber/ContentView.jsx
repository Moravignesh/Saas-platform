import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { contentAPI } from '../../api'
import toast from 'react-hot-toast'
import { ArrowLeft, Send, MessageCircle, Clock } from 'lucide-react'

export default function ContentView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [content, setContent] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([contentAPI.get(id), contentAPI.getComments(id)])
      .then(([c, cm]) => { setContent(c.data); setComments(cm.data) })
      .catch(err => {
        if (err.response?.status === 403) { toast.error('Subscribe to access this premium content'); navigate('/browse') }
        else { toast.error('Content not found'); navigate('/browse') }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      const r = await contentAPI.addComment(id, { text: newComment })
      setComments(c => [r.data, ...c])
      setNewComment('')
      toast.success('Comment added')
    } catch { toast.error('Failed to add comment') }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (!content) return null

  return (
    <div className="page-content" style={{ maxWidth: 800 }}>
      <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }}>
        <ArrowLeft size={14} />Back
      </button>
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className={`badge ${content.is_premium ? 'badge-premium' : 'badge-free'}`}>
            {content.is_premium ? 'Premium' : 'Free'}
          </span>
          <span className="text-xs text-muted">by {content.creator_username || `Creator #${content.creator_id}`}</span>
          <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
            <Clock size={11} style={{ display: 'inline', marginRight: 4 }} />
            {new Date(content.created_at).toLocaleDateString()}
          </span>
        </div>
        <h1 style={{ fontSize: '1.6rem', marginBottom: 12 }}>{content.title}</h1>
        {content.description && (
          <p style={{ color: 'var(--text2)', fontSize: '1rem', marginBottom: 20, lineHeight: 1.7 }}>{content.description}</p>
        )}
        {content.body && (
          <div style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.8, padding: '20px 0', borderTop: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
            {content.body}
          </div>
        )}
        {content.content_url && (
          <div style={{ marginTop: 16, padding: 16, background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
            <p className="text-sm text-muted" style={{ marginBottom: 8 }}>External Resource:</p>
            <a href={content.content_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Open Link ↗</a>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-title"><MessageCircle size={16} />Comments ({comments.length})</div>
        <form onSubmit={handleComment} style={{ marginBottom: 24 }}>
          <div className="flex gap-2">
            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary" disabled={submitting || !newComment.trim()}>
              <Send size={14} />{submitting ? '...' : 'Post'}
            </button>
          </div>
        </form>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <MessageCircle size={36} /><h3>No comments yet</h3><p>Be the first to comment</p>
            </div>
          ) : (
            comments.map(c => (
              <div key={c.id} style={{ padding: '12px 16px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="user-avatar" style={{ width: 26, height: 26, fontSize: '0.72rem' }}>
                    {(c.author_username || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-bold">{c.author_username || `User #${c.author_id}`}</span>
                  <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text2)', lineHeight: 1.6 }}>{c.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
