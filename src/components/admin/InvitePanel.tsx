import { useState, type FormEvent } from 'react'
import { supabase } from '../../lib/supabase'
import type { Role } from '../../types/database'

export default function InvitePanel() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('inspector')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError(null)

    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token

    const { error: fnError } = await supabase.functions.invoke('invite-user', {
      body: { email, role, fullName },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })

    if (fnError) {
      setStatus('error')
      setError(fnError.message)
      return
    }

    setStatus('sent')
    setEmail('')
    setFullName('')
    setRole('inspector')
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 text-base font-semibold text-neutral-900">Invite a User</h2>
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-4 sm:items-end">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-neutral-600">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          >
            <option value="inspector">Inspector</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={status === 'sending'}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-60 sm:col-span-4"
        >
          {status === 'sending' ? 'Sending invite…' : 'Send Invite'}
        </button>
      </form>

      {status === 'sent' && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Invite sent.</p>
      )}
      {status === 'error' && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
