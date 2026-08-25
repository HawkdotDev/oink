import React, { useState, useRef, useEffect } from 'react'
import {
  Bell,
  CheckCheck,
  Trash2,
  Sparkles,
  ShieldCheck,
  Layers,
  Info,
  CheckCircle2,
  X
} from 'lucide-react'
import { APP_VERSION } from '../../../utils/version'

interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  type: 'update' | 'backup' | 'system' | 'tip'
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: `Oink v${APP_VERSION} Live`,
    description:
      'Updated with sleek monochrome styling, improved full screen, and fast workspace navigation.',
    time: 'Just now',
    read: false,
    type: 'update'
  },
  {
    id: '2',
    title: 'Workspace Autosave Active',
    description: 'Local note changes are continuously secured to your file system.',
    time: '12m ago',
    read: false,
    type: 'backup'
  },
  {
    id: '3',
    title: 'Graph Indexer Initialized',
    description: 'All internal markdown links and cross-references are indexed.',
    time: '1h ago',
    read: true,
    type: 'system'
  },
  {
    id: '4',
    title: 'Pro Tip: Quick Switcher',
    description: 'Press Ctrl+P anywhere to jump between documents instantly.',
    time: '3h ago',
    read: true,
    type: 'tip'
  }
]

function NotificationsMenuComponent(): React.JSX.Element {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const stored = localStorage.getItem('oink_app_notifications')
      return stored ? JSON.parse(stored) : DEFAULT_NOTIFICATIONS
    } catch {
      return DEFAULT_NOTIFICATIONS
    }
  })
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      localStorage.setItem('oink_app_notifications', JSON.stringify(notifications))
    } catch {
      // ignore
    }
  }, [notifications])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return (): void => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = (): void => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleToggleRead = (id: string): void => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)))
  }

  const handleDismiss = (id: string, e: React.MouseEvent): void => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleClearAll = (): void => {
    setNotifications([])
  }

  const renderIcon = (type: NotificationItem['type']): React.JSX.Element => {
    switch (type) {
      case 'update':
        return <Sparkles size={13} className="text-zinc-200 shrink-0" />
      case 'backup':
        return <ShieldCheck size={13} className="text-zinc-300 shrink-0" />
      case 'system':
        return <Layers size={13} className="text-zinc-400 shrink-0" />
      case 'tip':
      default:
        return <Info size={13} className="text-zinc-400 shrink-0" />
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`header-action-btn relative ${showMenu ? 'active' : ''}`}
        onClick={(): void => setShowMenu((prev) => !prev)}
        title={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      >
        <Bell size={13} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-zinc-100 rounded-full ring-2 ring-[#121215]" />
        )}
      </button>

      {/* NOTIFICATIONS DROPDOWN POPOVER */}
      {showMenu && (
        <div className="widgets-dropdown-menu notifications-dropdown-menu">
          {/* Header */}
          <div className="widgets-dropdown-header flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-100 text-xs">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.2 rounded font-mono border border-zinc-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-zinc-800/80 transition-colors"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={11} />
                  <span>Read all</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800/60 transition-colors"
                  onClick={handleClearAll}
                  title="Clear all notifications"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="flex flex-col gap-1 max-h-[340px] overflow-y-auto py-1">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={24} className="text-zinc-600" />
                <span className="text-xs text-zinc-400 font-medium">All caught up!</span>
                <span className="text-[11px] text-zinc-600">No new notifications</span>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={(): void => handleToggleRead(item.id)}
                  className={`group flex items-start justify-between gap-2 p-2 rounded-lg cursor-pointer transition-all border ${
                    !item.read
                      ? 'bg-zinc-900/90 border-zinc-700/60 shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-zinc-900/40 hover:border-zinc-800/50'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="p-1 rounded bg-zinc-800/80 border border-zinc-700/50 mt-0.5">
                      {renderIcon(item.type)}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs truncate ${
                            !item.read ? 'font-semibold text-zinc-100' : 'text-zinc-300 font-normal'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-[10px] text-zinc-500 shrink-0">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-tight mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 p-0.5 rounded transition-opacity"
                    onClick={(e): void => handleDismiss(item.id, e)}
                    title="Dismiss"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 mt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              All systems normal
            </span>
            <span>Local workspace storage</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(NotificationsMenuComponent)
