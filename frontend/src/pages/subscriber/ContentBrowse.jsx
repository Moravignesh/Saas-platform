import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { contentAPI, subscriptionAPI } from '../../api'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import { Lock, Unlock, Search, CreditCard, CheckCircle } from 'lucide-react'

export default function ContentBrowse() {
  const { user } = useAuth()
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [subscribing, setSubscribing] = useState({})
  const [searchParams] = useSearchParams()

  // Handle Stripe redirect back after payment
  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      toast.success('🎉 Payment successful! You are now subscribed.')
      contentAPI.list().then(r => setContent(r.data))
    }
    if (payment === 'cancel') {
      toast.error('Payment cancelled. You were not charged.')
    }
  }, [])

  useEffect(() => {
    contentAPI.list()
      .then(r => setContent(r.data))
      .catch(() => toast.error('Failed to load content'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubscribe = async (creatorId) => {
    setSubscribing(s => ({ ...s, [creatorId]: true }))
    try {
      const res = await subscriptionAPI.createSession(creatorId)
      if (res.data.url) {
        // Real Stripe — redirect to checkout
        window.location.href = res.data.url
      } else {
        // Demo mode — no Stripe keys
        toast.success('Subscribed! (Demo mode)')
        const r = await contentAPI.list()
        setContent(r.data)
      }
    } catch (err) {
      const detail = err.response?.data?.detail
      if (detail === 'Already subscribed') {
        toast.error('You are already subscribed to this creator')
      } else {
        // Fallback to demo
        try {
          await subscriptionAPI.activateDemo(creatorId)
          toast.success('Subscribed! (Demo mode)')
          const r = await contentAPI.list()
          setContent(r.data)
        } catch {
          toast.error('Subscription failed. Please try again.')
        }
      }
    } finally {
      setSubscribing(s => ({ ...s, [creatorId]: false }))
    }
  }

  const filtered = content.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' ||
      (filter === 'free' && !c.is_premium) ||
      (filter === 'premium' && c.is_premium)
    return matchSearch && matchFilter
  })

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Browse Content</h1>
        <p>Discover and subscribe to premium creators</p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
          <Search size={15} color="var(--text3)" />
          <input
            placeholder="Search content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="tabs" style={{ margin: 0, borderBottom: 'none' }}>
          {['all', 'free', 'premium'].map(f => (
            <button
              key={f}
              className={`tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state"><Search size={48} /><h3>No content found</h3></div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(c => {
            const isLocked = c.is_premium && !c.body && !c.content_url && c.creator_id !== user?.id
            return (
              <div key={c.id} className="content-card">
                <div className="content-card-body">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`badge ${c.is_premium ? 'badge-premium' : 'badge-free'}`}>
                      {c.is_premium ? <><Lock size={10} />Premium</> : <><Unlock size={10} />Free</>}
                    </span>
                    <span className="text-xs text-muted">
                      by {c.creator_username || `#${c.creator_id}`}
                    </span>
                  </div>
                  <div className="content-card-title">{c.title}</div>
                  <div className="content-card-desc">
                    {c.description || 'No description provided'}
                  </div>

                  {isLocked ? (
                    <div style={{ padding: '10px 12px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div className="lock-overlay">
                        <Lock size={13} />
                        <span>Premium — subscribe to unlock</span>
                      </div>
                    </div>
                  ) : (
                    <Link to={`/content/${c.id}`} className="btn btn-secondary btn-sm w-full">
                      <CheckCircle size={13} /> Read Content
                    </Link>
                  )}
                </div>

                {isLocked && (
                  <div className="content-card-footer">
                    <span className="text-xs text-muted">$9.99 / month</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSubscribe(c.creator_id)}
                      disabled={subscribing[c.creator_id]}
                    >
                      <CreditCard size={13} />
                      {subscribing[c.creator_id] ? 'Redirecting...' : 'Subscribe & Pay'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}