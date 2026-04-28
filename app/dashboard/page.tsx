import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/lib/auth'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', padding: '2rem' }}>
      <div style={{ maxWidth: 480, width: '100%', background: 'white', borderRadius: 16, border: '1.5px solid var(--border)', padding: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--gold)' }}>
            {profile ? `${profile.first_name[0]}${profile.last_name[0]}` : user.email?.[0].toUpperCase()}
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
              {profile ? `${profile.first_name} ${profile.last_name}` : 'User'}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--stone)', margin: 0 }}>{user.email}</p>
          </div>
        </div>

        {profile && (
          <div style={{ background: 'var(--surface)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
              {[
                ['First name',   profile.first_name],
                ['Middle name',  profile.middle_name || '—'],
                ['Last name',    profile.last_name],
                ['Department',   profile.department],
                ['Role',         profile.role],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: '0.5rem 0', color: 'var(--stone)', width: '40%', textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.06em' }}>{label}</td>
                  <td style={{ padding: '0.5rem 0', color: 'var(--ink)', fontWeight: 500 }}>{value}</td>
                </tr>
              ))}
            </table>
          </div>
        )}

        <form action={async () => { 'use server'; await (await import('@/lib/supabase/server')).createClient().then(s => s.auth.signOut()); redirect('/login') }}>
          <button type="submit" style={{ width: '100%', padding: '0.85rem', background: 'var(--ink)', color: 'var(--cream)', border: 'none', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}
