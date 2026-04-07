import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Users, FileText, CreditCard, LogOut, Plus, BookOpen, BarChart3, Home } from 'lucide-react'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const adminNav = [
    { to: '/admin', icon: <LayoutDashboard size={16} />, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: <Users size={16} />, label: 'Users' },
    { to: '/admin/content', icon: <FileText size={16} />, label: 'Content' },
    { to: '/admin/subscriptions', icon: <CreditCard size={16} />, label: 'Subscriptions' },
  ]
  const creatorNav = [
    { to: '/creator', icon: <BarChart3 size={16} />, label: 'Dashboard', end: true },
    { to: '/creator/content', icon: <FileText size={16} />, label: 'My Content' },
    { to: '/browse', icon: <BookOpen size={16} />, label: 'Browse' },
  ]
  const subscriberNav = [
    { to: '/my-dashboard', icon: <Home size={16} />, label: 'Dashboard' },
    { to: '/browse', icon: <BookOpen size={16} />, label: 'Browse Content' },
  ]

  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'creator' ? creatorNav : subscriberNav
  const sectionLabel = user?.role === 'admin' ? 'Admin Panel' : user?.role === 'creator' ? 'Creator Studio' : 'My Account'

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>ContentHub</h2>
          <span>Subscription Platform</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">{sectionLabel}</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {item.icon}{item.label}
            </NavLink>
          ))}
          {user?.role === 'creator' && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>Quick Actions</div>
              <NavLink to="/creator/content/new" className="nav-item"><Plus size={16} />New Content</NavLink>
            </>
          )}
          {user?.role === 'admin' && (
            <>
              <div className="nav-section-label" style={{ marginTop: 8 }}>Browse</div>
              <NavLink to="/browse" className="nav-item"><BookOpen size={16} />Content Feed</NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button onClick={handleLogout}
              style={{ background: 'none', border: 'none', color: 'var(--text3)', padding: 4, borderRadius: 6 }}
              title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-content"><Outlet /></div>
    </div>
  )
}
