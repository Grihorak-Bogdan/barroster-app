import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const TESTIMONIALS = [
  {
    quote:
      "Since switching to BarRoster, we've cut our scheduling time in half. The multi-branch control is exactly what we needed to scale our operations without losing our minds.",
    name: 'Sarah Jenkins',
    title: 'Operations Director | The Alchemist Group',
  },
  {
    quote:
      'BarRoster transformed how we handle our team across five venues. The real-time alerts alone have saved us countless headaches during peak hours.',
    name: 'Marcus Reid',
    title: 'General Manager | Night Owl Hospitality',
  },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const from = (location.state as { from?: string })?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('401') || msg.toLowerCase().includes('no active account')) {
        setError('Invalid email or password.')
      } else {
        setError('Connection error — make sure the API server is running.')
      }
    } finally {
      setLoading(false)
    }
  }

  const t = TESTIMONIALS[testimonialIdx]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-slate-900 text-[15px]">
              BarRoster
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Don't have an account?</span>
            <Link
              to="/register"
              className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Start Free Trial
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
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 mb-7">
              Please enter your details to sign in.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-sky-500"
                  />
                  <span className="text-sm text-gray-600">
                    Remember for 30 days
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-sky-600 hover:text-sky-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0F172A] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#00A4EF">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                </svg>
                Microsoft
              </button>
            </div>

            <p className="mt-5 text-center text-sm text-gray-500">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-sky-600 font-medium hover:text-sky-700"
              >
                Sign up for free
              </Link>
            </p>
          </div>

          {/* Testimonial side */}
          <div className="hidden lg:flex w-64 relative flex-col overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'url("https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div className="relative flex-1" />
            <div className="relative bg-black/40 backdrop-blur-sm p-5 m-3 rounded-xl">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p className="text-white text-xs leading-relaxed mb-3">"{t.quote}"</p>
              <p className="text-white text-xs font-semibold">{t.name}</p>
              <p className="text-slate-400 text-[11px]">{t.title}</p>
              <div className="flex gap-2 mt-3">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setTestimonialIdx(i)}
                    className={`w-5 h-5 rounded-full border border-white/30 flex items-center justify-center text-white/70 hover:bg-white/20 transition-colors text-xs ${i === testimonialIdx ? 'bg-white/20' : ''}`}
                  >
                    {i === 0 ? '←' : '→'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4">
        <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
          <Lock className="w-3 h-3 text-emerald-500" />
          <span className="uppercase tracking-wider font-medium text-emerald-600">
            AES-256 Encrypted Session
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Protected by enterprise-grade security.{' '}
          <button className="underline hover:text-gray-600">Privacy Policy</button>
        </p>
      </footer>
    </div>
  )
}
