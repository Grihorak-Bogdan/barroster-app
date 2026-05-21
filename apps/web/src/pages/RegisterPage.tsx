import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const PERKS = [
  'Manage unlimited branches',
  'Real-time shift coverage tracking',
  'Employee directory & scheduling',
  'Smart conflict detection',
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const errs: Record<string, string> = {}
    if (!email) errs.email = 'Email is required'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      return
    }

    setLoading(true)
    try {
      await register({
        email,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('email') && msg.includes('already')) {
        setFieldErrors({ email: 'An account with this email already exists.' })
      } else if (msg.includes('400')) {
        setError('Please check your details and try again.')
      } else {
        setError('Connection error — make sure the API server is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (field: string) =>
    `w-full border rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-60 ${
      fieldErrors[field]
        ? 'border-red-400 focus:ring-red-400'
        : 'border-gray-300 focus:ring-sky-500'
    }`

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-slate-900 text-[15px]">BarRoster</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Already have an account?</span>
            <Link
              to="/login"
              className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden w-full max-w-3xl flex">
          {/* Form side */}
          <div className="flex-1 p-8 lg:p-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Create your account
            </h1>
            <p className="text-sm text-gray-500 mb-7">
              Get started for free — no credit card required.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    First Name
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    autoComplete="given-name"
                    disabled={loading}
                    className={inputCls('firstName')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Last Name
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Smith"
                    autoComplete="family-name"
                    disabled={loading}
                    className={inputCls('lastName')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@venue.com"
                  autoComplete="email"
                  disabled={loading}
                  className={inputCls('email')}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    disabled={loading}
                    className={inputCls('password') + ' pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                )}
                {password && password.length >= 8 && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Strong password
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0F172A] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-gray-400">
              By signing up, you agree to our{' '}
              <button className="underline hover:text-gray-600">Terms of Service</button>{' '}
              and{' '}
              <button className="underline hover:text-gray-600">Privacy Policy</button>.
            </p>

            <p className="mt-3 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-sky-600 font-medium hover:text-sky-700">
                Sign in
              </Link>
            </p>
          </div>

          {/* Perks side */}
          <div className="hidden lg:flex w-64 bg-gradient-to-br from-slate-800 to-slate-950 flex-col justify-center p-8">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center mb-5">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <h3 className="text-white font-semibold text-base mb-2">
              Everything you need
            </h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Join thousands of hospitality venues saving hours every week.
            </p>
            <div className="space-y-3">
              {PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-sky-400" />
                  </div>
                  <span className="text-slate-300 text-xs">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-4">
        <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
          <Lock className="w-3 h-3 text-emerald-500" />
          <span className="uppercase tracking-wider font-medium text-emerald-600">
            AES-256 Encrypted Session
          </span>
        </div>
      </footer>
    </div>
  )
}
