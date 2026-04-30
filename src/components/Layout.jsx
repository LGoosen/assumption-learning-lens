import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquareHeart,
  NotebookPen,
  ShieldCheck,
  ClipboardList,
  CalendarRange,
  FileBarChart2,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LABELS } from '../utils/constants.js';

const NAV_BY_ROLE = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      to: '/student/feedback',
      label: 'Give Feedback',
      icon: MessageSquareHeart,
    },
    { to: '/student/reflections', label: 'My Reflections', icon: NotebookPen },
    { to: '/privacy', label: 'Privacy', icon: ShieldCheck },
  ],
  staff: [
    { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/staff/summary', label: 'Class Summary', icon: ClipboardList },
    { to: '/staff/reflection', label: 'Reflection', icon: NotebookPen },
    { to: '/privacy', label: 'Privacy', icon: ShieldCheck },
  ],
  management: [
    { to: '/management/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/management/cycles', label: 'Feedback Cycles', icon: CalendarRange },
    { to: '/management/reports', label: 'Reports', icon: FileBarChart2 },
    { to: '/management/settings', label: 'Settings', icon: Settings },
    { to: '/privacy', label: 'Privacy', icon: ShieldCheck },
  ],
};

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = (user && NAV_BY_ROLE[user.role]) || [];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex">
      <aside
        className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-stone-200 bg-white"
        aria-label="Primary navigation"
      >
        <div className="px-6 py-5 border-b border-stone-100">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <UserPanel user={user} onSignOut={handleSignOut} />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-stone-200 sticky top-0 z-30">
          <Logo />
          <button
            type="button"
            onClick={() => setMobileOpen((s) => !s)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="p-2 rounded-md text-navy-800 hover:bg-stone-50"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </header>

        {mobileOpen && (
          <nav
            id="mobile-nav"
            className="md:hidden bg-white border-b border-stone-200 px-3 py-3 space-y-1"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : ''}`
                }
              >
                <item.icon className="w-5 h-5" aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            ))}
            <div className="pt-3 mt-2 border-t border-stone-100">
              <UserPanel user={user} onSignOut={handleSignOut} compact />
            </div>
          </nav>
        )}

        <main className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-10 max-w-6xl w-full mx-auto">
          {children}
        </main>

        <footer className="px-6 py-4 text-center text-xs text-stone-400 no-print">
          Assumption Learning Lens · Student voice for learning, not
          surveillance.
        </footer>
      </div>
    </div>
  );
}

function UserPanel({ user, onSignOut, compact = false }) {
  if (!user) return null;
  return (
    <div
      className={`px-4 ${compact ? 'py-2' : 'py-4'} border-t border-stone-100`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-full bg-navy-800 text-ivory-100 flex items-center justify-center text-sm font-semibold"
          aria-hidden="true"
        >
          {(user.displayName || '?').slice(0, 1)}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-navy-900 truncate">
            {user.displayName}
          </div>
          <div className="text-xs text-stone-400">
            {ROLE_LABELS[user.role] || user.role}
            {user.grade ? ` · Grade ${user.grade}` : ''}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onSignOut}
        className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-navy-700 hover:bg-stone-50 border border-stone-200"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );
}
