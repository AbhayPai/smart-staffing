'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthPanel, { LogoMark } from '@/components/AuthPanel'
import { signInServer } from '@/lib/auth-server'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPw]   = useState(false)
  const [errors, setErrors]         = useState<{ email?: string; password?: string; server?: string }>({})
  const [loading, setLoading]       = useState(false)
  const [success, setSuccess]       = useState(false)

  function validate() {
    const e: typeof errors = {}
    if (!email) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.'
    if (!password) e.password = 'Password is required.'
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const result = await signInServer({ email, password })

    // If we get a result back, it's an error (redirect() never returns)
    if (result && 'error' in result) {
      setErrors({ server: result.error })
      setLoading(false)
    }
    // Otherwise, redirect() was called and handling the redirect
  }

  return (
    <div className="auth-root">
      <AuthPanel mode="login" />

      <main className="auth-form-container">
        <div className="auth-form-inner">

          <div className="mobile-logo-bar">
            <LogoMark color="dark" size={32} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)' }}>Luminary</span>
          </div>

          <div className="fade-up fade-up-1" style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.2, margin: '0 0 0.5rem' }}>
              Sign in
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--stone)', margin: 0 }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>Create one</Link>
            </p>
          </div>

          {errors.server && (
            <div style={{ background: '#fdf2f2', border: '1px solid #f5c6c6', color: '#922b21', borderRadius: 8, padding: '0.875rem 1rem', fontSize: '0.875rem', fontWeight: 500, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#e74c3c" /><path d="M8 4v4M8 10h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
              {errors.server}
            </div>
          )}

          {success && (
            <div className="toast-success fade-up">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill="#27ae60" /><path d="M4.5 8l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Welcome back! Redirecting you now…
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            <div className="field-group fade-up fade-up-4">
              <label className="field-label" htmlFor="email">Email address</label>
              <input id="email" type="email" className={`field-input${errors.email ? ' error' : ''}`} placeholder="you@example.com" value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined, server: undefined })) }} autoComplete="email" />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div className="field-group fade-up fade-up-5">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="password-wrapper">
                <input id="password" type={showPassword ? 'text' : 'password'} className={`field-input${errors.password ? ' error' : ''}`} placeholder="••••••••" value={password} onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined, server: undefined })) }} autoComplete="current-password" style={{ paddingRight: '2.75rem' }} />
                <button type="button" className="password-toggle" onClick={() => setShowPw(p => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <div className="fade-up fade-up-6" style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn-primary" disabled={loading || success}>
                {loading ? <span className="spinner" /> : success ? 'Signed in ✓' : 'Sign in'}
              </button>
            </div>
          </form>

        </div>
      </main>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.84 1.236 1.84 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.418-1.305.762-1.605-2.665-.305-5.467-1.334-5.467-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.52 11.52 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.807 5.625-5.48 5.922.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
