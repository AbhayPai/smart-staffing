'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthPanel, { LogoMark } from '@/components/AuthPanel'
import { signUp } from '@/lib/auth'
import type { SignUpFormData, UserDepartment, UserRole } from '@/types/user'

const DEPARTMENTS: UserDepartment[] = [
  'Engineering', 'Design', 'Product', 'Marketing',
  'Sales', 'Finance', 'Human Resources', 'Operations', 'Legal', 'Other',
]

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin',     label: 'Administrator' },
  { value: 'manager',   label: 'Manager' },
  { value: 'engineer',  label: 'Engineer' },
  { value: 'designer',  label: 'Designer' },
  { value: 'analyst',   label: 'Analyst' },
  { value: 'hr',        label: 'HR Specialist' },
  { value: 'finance',   label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'other',     label: 'Other' },
]

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { score: 1, label: 'Weak',   color: '#e74c3c' },
    { score: 2, label: 'Fair',   color: '#e67e22' },
    { score: 3, label: 'Good',   color: '#f39c12' },
    { score: 4, label: 'Strong', color: '#27ae60' },
  ]
  return map[score - 1] ?? { score: 0, label: '', color: '' }
}

type FormErrors = Partial<Record<keyof SignUpFormData | 'server', string>>

const EMPTY: SignUpFormData = {
  email: '', password: '', confirm: '',
  first_name: '', middle_name: '', last_name: '',
  department: '', role: '', agreed: false,
}

export default function SignUpPage() {
  const router = useRouter()
  const [form, setForm] = useState<SignUpFormData>(EMPTY)
  const [showPw, setShowPw]   = useState(false)
  const [errors, setErrors]   = useState<FormErrors>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const strength = getPasswordStrength(form.password)

  function setField<K extends keyof SignUpFormData>(field: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm(p => ({ ...p, [field]: value }))
      setErrors(p => ({ ...p, [field]: undefined, server: undefined }))
    }
  }

  function validate(): FormErrors {
    const e: FormErrors = {}
    if (!form.first_name.trim())  e.first_name  = 'First name is required.'
    if (!form.last_name.trim())   e.last_name   = 'Last name is required.'
    if (!form.email)              e.email       = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                  e.email       = 'Enter a valid email address.'
    if (!form.department)         e.department  = 'Please select a department.'
    if (!form.role)               e.role        = 'Please select a role.'
    if (!form.password)           e.password    = 'Password is required.'
    else if (form.password.length < 8)
                                  e.password    = 'Must be at least 8 characters.'
    if (form.confirm !== form.password)
                                  e.confirm     = 'Passwords do not match.'
    if (!form.agreed)             e.agreed      = 'You must accept the terms to continue.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    const { error } = await signUp(form)
    setLoading(false)
    if (error) { setErrors({ server: error }); return }
    setSuccess(true)
    setTimeout(() => router.push('/login'), 3000)
  }

  return (
    <div className="auth-root">
      <AuthPanel mode="signup" />

      <main className="auth-form-container">
        <div className="auth-form-inner">

          <div className="mobile-logo-bar">
            <LogoMark color="dark" size={32} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--ink)' }}>Luminary</span>
          </div>

          <div className="fade-up fade-up-1" style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2rem)', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.2, margin: '0 0 0.5rem' }}>
              Create account
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--stone)', margin: 0 }}>
              Already have one?{' '}
              <Link href="/login" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>Sign in</Link>
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
              Account created! Check your email to verify. Redirecting…
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* First + Last */}
            <div className="fade-up fade-up-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="field-label" htmlFor="first_name">First name <Req /></label>
                <input id="first_name" type="text" className={`field-input${errors.first_name ? ' error' : ''}`} placeholder="Jane" value={form.first_name} onChange={setField('first_name')} autoComplete="given-name" />
                {errors.first_name && <p className="field-error">{errors.first_name}</p>}
              </div>
              <div>
                <label className="field-label" htmlFor="last_name">Last name <Req /></label>
                <input id="last_name" type="text" className={`field-input${errors.last_name ? ' error' : ''}`} placeholder="Smith" value={form.last_name} onChange={setField('last_name')} autoComplete="family-name" />
                {errors.last_name && <p className="field-error">{errors.last_name}</p>}
              </div>
            </div>

            {/* Middle name */}
            <div className="field-group fade-up fade-up-2">
              <label className="field-label" htmlFor="middle_name">
                Middle name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.7rem' }}>(optional)</span>
              </label>
              <input id="middle_name" type="text" className="field-input" placeholder="Marie" value={form.middle_name} onChange={setField('middle_name')} autoComplete="additional-name" />
            </div>

            {/* Email */}
            <div className="field-group fade-up fade-up-3">
              <label className="field-label" htmlFor="email">Email address <Req /></label>
              <input id="email" type="email" className={`field-input${errors.email ? ' error' : ''}`} placeholder="you@example.com" value={form.email} onChange={setField('email')} autoComplete="email" />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            {/* Department + Role */}
            <div className="fade-up fade-up-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div>
                <label className="field-label" htmlFor="department">Department <Req /></label>
                <select id="department" className={`field-input field-select${errors.department ? ' error' : ''}`} value={form.department} onChange={setField('department')}>
                  <option value="">Select…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p className="field-error">{errors.department}</p>}
              </div>
              <div>
                <label className="field-label" htmlFor="role">Role <Req /></label>
                <select id="role" className={`field-input field-select${errors.role ? ' error' : ''}`} value={form.role} onChange={setField('role')}>
                  <option value="">Select…</option>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {errors.role && <p className="field-error">{errors.role}</p>}
              </div>
            </div>

            {/* Password */}
            <div className="field-group fade-up fade-up-5">
              <label className="field-label" htmlFor="password">Password <Req /></label>
              <div className="password-wrapper">
                <input id="password" type={showPw ? 'text' : 'password'} className={`field-input${errors.password ? ' error' : ''}`} placeholder="Min. 8 characters" value={form.password} onChange={setField('password')} autoComplete="new-password" style={{ paddingRight: '2.75rem' }} />
                <button type="button" className="password-toggle" onClick={() => setShowPw(p => !p)} aria-label="Toggle password">
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
              {form.password && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: '0.25rem' }}>
                    {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= strength.score ? strength.color : 'var(--border)', transition: 'background 0.3s' }} />)}
                  </div>
                  <p style={{ fontSize: '0.72rem', color: strength.color, margin: 0, fontWeight: 500 }}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div className="field-group fade-up fade-up-6">
              <label className="field-label" htmlFor="confirm">Confirm password <Req /></label>
              <input id="confirm" type={showPw ? 'text' : 'password'} className={`field-input${errors.confirm ? ' error' : ''}`} placeholder="Re-enter your password" value={form.confirm} onChange={setField('confirm')} autoComplete="new-password" />
              {errors.confirm && <p className="field-error">{errors.confirm}</p>}
            </div>

            {/* Terms Acceptance */}
            <div className="field-group fade-up fade-up-6" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <input id="agreed" type="checkbox" checked={form.agreed} onChange={setField('agreed')} style={{ marginTop: '0.375rem', cursor: 'pointer' }} />
              <label htmlFor="agreed" style={{ fontSize: '0.875rem', color: 'var(--stone)', cursor: 'pointer', margin: 0 }}>
                I agree to the <a href="#" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</a> <Req />
              </label>
              {errors.agreed && <p className="field-error">{errors.agreed}</p>}
            </div>

            <div className="fade-up fade-up-7">
              <button type="submit" className="btn-primary" disabled={loading || success}>
                {loading ? <span className="spinner" /> : success ? 'Account created ✓' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

function Req() {
  return <span style={{ color: '#c9a84c', marginLeft: 1 }}>*</span>
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
