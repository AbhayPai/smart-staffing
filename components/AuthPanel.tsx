'use client'

import Image from 'next/image'

interface AuthPanelProps {
  mode: 'login' | 'signup'
}

export default function AuthPanel({ mode }: AuthPanelProps) {
  return (
    <aside className="auth-panel panel-fade">

      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', justifyContent: 'center', minHeight: '100vh'}}>
          <LogoMark />
        </div>
      </div>
    </aside>
  )
}

export function LogoMark({ color = 'dark', size = 200 }: { color?: 'dark' | 'gold', size?: number }) {
  const c = color === 'gold' ? 'var(--gold)' : 'var(--ink)'
  return (
    <Image src="/logo.png" alt="Materialplus" width={size} height={size} />
  )
}
