import { useAuth } from '../hooks/useAuth'

interface HeaderProps {
  tab: 'dashboard' | 'admin'
  onTabChange: (tab: 'dashboard' | 'admin') => void
}

export default function Header({ tab, onTabChange }: HeaderProps) {
  const { profile, isAdmin, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-sm font-bold text-neutral-900">
            IC
          </div>
          <span className="text-sm font-semibold text-neutral-900">Inspector Clock</span>
        </div>

        {isAdmin && (
          <div className="flex rounded-lg border border-neutral-200 bg-white p-0.5 text-sm">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`rounded-md px-3 py-1 font-medium transition ${
                tab === 'dashboard' ? 'bg-neutral-900 text-white' : 'text-neutral-500'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onTabChange('admin')}
              className={`rounded-md px-3 py-1 font-medium transition ${
                tab === 'admin' ? 'bg-neutral-900 text-white' : 'text-neutral-500'
              }`}
            >
              Admin
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-neutral-500 sm:inline">
            {profile?.full_name || profile?.email}
          </span>
          <button
            onClick={() => signOut()}
            className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
