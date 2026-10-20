import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  SquareKanban,
  CalendarRange,
  Link2,
  CalendarDays,
  BookOpen,
  StickyNote,
  ChartColumn,
  Flame,
  Ellipsis,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'

// every section gets its own candy color, Duolingo-style
const NAV = [
  { id: 'board', icon: SquareKanban, key: 'navBoard', color: '#58CC02' },
  { id: 'plan', icon: CalendarRange, key: 'navPlan', color: '#1CB0F6' },
  { id: 'habits', icon: Link2, key: 'navHabits', color: '#FF9600' },
  { id: 'calendar', icon: CalendarDays, key: 'navCalendar', color: '#FF4B4B' },
  { id: 'learning', icon: BookOpen, key: 'navLearning', color: '#CE82FF' },
  { id: 'notes', icon: StickyNote, key: 'navNotes', color: '#FFC800' },
  { id: 'stats', icon: ChartColumn, key: 'navStats', color: '#1CB0F6' },
]
// first four live in the mobile tab bar; the rest go in the "More" sheet
const MOBILE_TABS = NAV.slice(0, 4)
const MOBILE_MORE = NAV.slice(4)

export function Logo({ compact = false }) {
  if (compact) {
    return <span className="nacre inline-block h-8 w-8 rounded-full border-2 border-greenDark" aria-label="inji" />
  }
  return (
    <span className="text-[26px] font-extrabold tracking-tight leading-none lowercase select-none text-textPrimary">
      i<span className="text-accent">n</span>ji
    </span>
  )
}

function Avatar({ user, profileName, profileAvatar, size = 32 }) {
  const initials = profileName?.trim()
    ? profileName.trim().split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] ?? '?').toUpperCase()
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-accent text-white text-[12px] font-extrabold overflow-hidden shrink-0 border-2 border-greenDark"
      style={{ width: size, height: size }}
    >
      {profileAvatar ? (
        <img src={profileAvatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        initials
      )}
    </span>
  )
}

function LangToggle({ className = '' }) {
  const { lang, setLang } = useTranslation()
  return (
    <div className={`inline-flex rounded-xl border-2 border-border overflow-hidden text-[12px] font-extrabold ${className}`}>
      {['az', 'en'].map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`px-3 h-8 transition-colors ${lang === code ? 'bg-blue text-white' : 'bg-white text-textMuted hover:text-textSecondary'}`}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

function Streak({ streakDays, compact = false }) {
  const { t } = useTranslation()
  const lit = streakDays > 0
  return (
    <span
      className={`inline-flex items-center gap-1 text-[14px] font-extrabold whitespace-nowrap ${lit ? 'text-orange' : 'text-textMuted'}`}
      title={t('streak', { n: streakDays })}
    >
      <Flame size={20} strokeWidth={2.4} fill={lit ? '#FF9600' : '#E5E7EB'} className={lit ? 'text-orange' : 'text-borderStrong'} />
      {compact ? streakDays : t('streak', { n: streakDays })}
    </span>
  )
}

function NavIcon({ icon: Icon, color, size = 22 }) {
  return <Icon size={size} strokeWidth={2.4} style={{ color }} />
}

const SIDEBAR_KEY = 'inji_sidebar_open'

function readSidebarOpen() {
  try {
    return localStorage.getItem(SIDEBAR_KEY) !== '0'
  } catch {
    return true
  }
}

export default function Navbar({ streakDays, page, onNavigate, user, onSignIn, profileName, profileAvatar }) {
  const { t } = useTranslation()
  const [moreOpen, setMoreOpen] = useState(false)
  // desktop sidebar: open = icons + labels, closed = icons only (tablets are always icons only)
  const [open, setOpen] = useState(readSidebarOpen)

  function toggleSidebar() {
    setOpen((v) => {
      try {
        localStorage.setItem(SIDEBAR_KEY, v ? '0' : '1')
      } catch {
        // storage unavailable — the toggle still works for this visit
      }
      return !v
    })
  }

  function go(id) {
    onNavigate(id)
    setMoreOpen(false)
  }

  const accountLabel = profileName?.trim() || user?.email
  const activeItem = 'bg-blueSoft border-[#84D8FF] text-blueDark'
  const idleItem = 'border-transparent text-textSecondary hover:bg-surfaceAlt'
  // classes that only apply when the desktop sidebar is open
  const wide = (cls) => (open ? cls : '')
  const ToggleIcon = open ? PanelLeftClose : PanelLeftOpen
  const toggleLabel = open ? t('sidebarCollapse') : t('sidebarExpand')

  return (
    <>
      {/* ── Desktop / tablet: side rail — collapsible on desktop ── */}
      <aside
        className={`hidden md:flex sticky top-0 h-dvh shrink-0 flex-col border-r-2 border-border bg-surface md:w-[84px] transition-[width] duration-200 ${
          open ? 'lg:w-[240px]' : 'lg:w-[84px]'
        }`}
      >
        <div className={`flex h-[72px] shrink-0 items-center justify-center gap-2 ${wide('lg:justify-between lg:pl-6 lg:pr-3')}`}>
          <span className={wide('lg:hidden')}><Logo compact /></span>
          <span className={`hidden ${wide('lg:inline')}`}><Logo /></span>
          {open && (
            <button
              onClick={toggleSidebar}
              title={toggleLabel}
              aria-label={toggleLabel}
              aria-expanded="true"
              className="hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:bg-surfaceAlt hover:text-textSecondary"
            >
              <ToggleIcon size={20} strokeWidth={2.4} />
            </button>
          )}
        </div>

        {!open && (
          <div className="hidden lg:flex justify-center -mt-2 mb-2">
            <button
              onClick={toggleSidebar}
              title={toggleLabel}
              aria-label={toggleLabel}
              aria-expanded="false"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-border text-textMuted hover:bg-surfaceAlt hover:text-textSecondary"
            >
              <ToggleIcon size={18} strokeWidth={2.4} />
            </button>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 flex flex-col gap-1.5">
          {NAV.map(({ id, icon, key, color }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => go(id)}
                title={t(key)}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3.5 h-12 shrink-0 rounded-2xl border-2 px-0 justify-center ${wide('lg:px-3.5 lg:justify-start')} text-[15px] font-extrabold transition-colors ${
                  active ? activeItem : idleItem
                }`}
              >
                <NavIcon icon={icon} color={color} />
                <span className={`hidden whitespace-nowrap ${wide('lg:inline')}`}>{t(key)}</span>
              </button>
            )
          })}
        </nav>

        <div className="px-3 pb-4 pt-3 flex flex-col gap-3 border-t-2 border-border">
          <div className={`flex justify-center ${wide('lg:justify-start lg:px-3')}`}>
            <span className={wide('lg:hidden')}><Streak streakDays={streakDays} compact /></span>
            <span className={`hidden ${wide('lg:inline')}`}><Streak streakDays={streakDays} /></span>
          </div>
          <LangToggle className={`self-center ${wide('lg:self-start lg:ml-3')}`} />
          {user ? (
            <button
              onClick={() => go('profile')}
              className={`flex items-center gap-2.5 rounded-2xl border-2 p-1.5 justify-center ${wide('lg:px-2.5 lg:justify-start')} transition-colors ${
                page === 'profile' ? activeItem : idleItem
              }`}
              title={accountLabel}
            >
              <Avatar user={user} profileName={profileName} profileAvatar={profileAvatar} />
              <span className={`hidden min-w-0 truncate text-[13px] font-extrabold ${wide('lg:block')}`}>{accountLabel}</span>
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="press flex items-center justify-center gap-2 h-11 rounded-2xl bg-accent text-white text-[14px] font-extrabold shadow-[0_4px_0_#46A302] hover:bg-[#61D90A]"
              title={t('authLoginButton')}
            >
              <LogIn size={18} strokeWidth={2.5} />
              <span className={`hidden whitespace-nowrap ${wide('lg:inline')}`}>{t('authLoginButton')}</span>
            </button>
          )}
        </div>
      </aside>

      {/* ── Mobile: top bar ── */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 h-14 px-4 bg-surface border-b-2 border-border pt-[env(safe-area-inset-top)] box-content">
        <Logo />
        <div className="flex items-center gap-3">
          <Streak streakDays={streakDays} compact />
          {user ? (
            <button onClick={() => go('profile')} aria-label={accountLabel}>
              <Avatar user={user} profileName={profileName} profileAvatar={profileAvatar} size={32} />
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="press h-9 px-3.5 rounded-xl bg-accent text-white text-[13px] font-extrabold shadow-[0_3px_0_#46A302]"
            >
              {t('authLoginButton')}
            </button>
          )}
        </div>
      </header>

      {/* ── Mobile: bottom tab bar ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t-2 border-border bg-surface pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-[66px] px-1.5 gap-1">
          {MOBILE_TABS.map(({ id, icon, key, color }) => {
            const active = page === id
            return (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={active ? 'page' : undefined}
                className={`my-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 text-[11px] font-extrabold ${
                  active ? activeItem : 'border-transparent text-textMuted'
                }`}
              >
                <NavIcon icon={icon} color={color} />
                <span className="leading-none">{t(key)}</span>
              </button>
            )
          })}
          {(() => {
            const active = moreOpen || MOBILE_MORE.some((n) => n.id === page) || page === 'profile'
            return (
              <button
                onClick={() => setMoreOpen(true)}
                className={`my-1.5 flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2 text-[11px] font-extrabold ${
                  active ? activeItem : 'border-transparent text-textMuted'
                }`}
              >
                <Ellipsis size={22} strokeWidth={2.6} className="text-textMuted" />
                <span className="leading-none">{t('navMore')}</span>
              </button>
            )
          })()}
        </div>
      </nav>

      {/* ── Mobile: "More" sheet ── */}
      <AnimatePresence>
        {moreOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end">
            <motion.div
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              className="relative w-full rounded-t-3xl border-t-2 border-border bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
              <div className="grid grid-cols-2 gap-2">
                {MOBILE_MORE.map(({ id, icon, key, color }) => (
                  <button
                    key={id}
                    onClick={() => go(id)}
                    className={`flex items-center gap-3 h-14 px-4 rounded-2xl border-2 text-[15px] font-extrabold ${
                      page === id ? activeItem : 'border-border text-textSecondary'
                    }`}
                  >
                    <NavIcon icon={icon} color={color} />
                    {t(key)}
                  </button>
                ))}
                {user && (
                  <button
                    onClick={() => go('profile')}
                    className={`flex items-center gap-3 h-14 px-4 rounded-2xl border-2 text-[15px] font-extrabold ${
                      page === 'profile' ? activeItem : 'border-border text-textSecondary'
                    }`}
                  >
                    <Avatar user={user} profileName={profileName} profileAvatar={profileAvatar} size={24} />
                    {t('navProfile')}
                  </button>
                )}
              </div>
              <div className="mt-4 pt-4 border-t-2 border-border flex items-center justify-between px-1">
                <span className="text-[14px] font-extrabold text-textSecondary">{t('language')}</span>
                <LangToggle />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
