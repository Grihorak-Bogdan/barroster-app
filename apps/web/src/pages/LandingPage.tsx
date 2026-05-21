import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Users,
  Calendar,
  Star,
  CheckCircle2,
  Zap,
  Shield,
} from 'lucide-react'

function AppPreview() {
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/80">
      {/* Browser chrome */}
      <div className="bg-gray-100 px-4 py-2.5 flex items-center gap-2 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded-md text-xs text-gray-400 px-3 py-0.5 text-center border border-gray-200">
          app.barroster.com/dashboard
        </div>
      </div>

      {/* App shell */}
      <div className="flex h-72">
        {/* Mini sidebar */}
        <div className="w-12 bg-[#0F172A] flex flex-col items-center py-3 gap-3">
          <div className="w-6 h-6 rounded bg-sky-500 flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">B</span>
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-5 h-1 rounded-full ${i === 0 ? 'bg-white' : 'bg-slate-600'}`}
            />
          ))}
        </div>

        {/* Mini content */}
        <div className="flex-1 bg-gray-50 p-3 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-32 bg-gray-300 rounded" />
            <div className="h-6 w-20 bg-slate-800 rounded" />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: '84%', sub: 'Shift Coverage', color: 'text-emerald-600' },
              { label: '342', sub: 'Covered Shifts', color: 'text-blue-600' },
              { label: '12', sub: 'Uncovered', color: 'text-red-500' },
            ].map((c) => (
              <div key={c.label} className="bg-white rounded-lg p-2 shadow-sm">
                <p className={`text-base font-bold ${c.color}`}>{c.label}</p>
                <p className="text-[9px] text-gray-400">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div className="bg-white rounded-lg p-2 shadow-sm mb-2">
            <div className="h-2 w-20 bg-gray-200 rounded mb-2" />
            <svg viewBox="0 0 200 40" className="w-full h-10">
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#14B8A6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 28 C 28 26, 28 22, 57 20 C 86 18, 86 24, 114 22 C 143 20, 143 14, 171 12 C 200 10, 200 16, 200 16 L 200 40 L 0 40 Z"
                fill="url(#g)"
              />
              <path
                d="M 0 28 C 28 26, 28 22, 57 20 C 86 18, 86 24, 114 22 C 143 20, 143 14, 171 12 C 200 10, 200 16, 200 16"
                fill="none"
                stroke="#14B8A6"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {['Downtown Lounge', 'Westside Pub'].map((b) => (
              <div key={b} className="bg-white rounded-lg p-2 shadow-sm flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-sky-500" />
                <div>
                  <p className="text-[9px] font-medium text-gray-700">{b}</p>
                  <p className="text-[8px] text-gray-400">Open until 2AM</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: Building2,
    title: 'Multi-Branch Control',
    desc: 'Manage multiple locations from a single dashboard. Share staff across venues, compare performance, and standardize operations.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Users,
    title: 'Employee Profiles',
    desc: 'Keep track of roles, certifications, availability, and performance. Automate onboarding and compliance tracking.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    desc: 'Drag-and-drop roster builder that warns you of conflicts, overtime, and availability issues before you publish.',
    color: 'bg-purple-100 text-purple-600',
  },
]

const LOGOS = [
  { char: '✦', label: 'VenueX' },
  { char: '❋', label: 'NightOwl' },
  { char: '⟐', label: 'BarFlow' },
  { char: '◈', label: 'TableTurn' },
  { char: '⊕', label: 'ShiftCo' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-slate-900 text-[15px]">
              BarRoster
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/login"
              className="text-sm bg-[#0F172A] text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Request Demo
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-700 text-xs font-medium px-3 py-1.5 rounded-full border border-sky-200 mb-6">
              <Zap className="w-3.5 h-3.5" />
              #1 PLATFORM FOR HOSPITALITY
            </div>

            <h1 className="text-5xl font-bold text-slate-900 leading-tight tracking-tight mb-5">
              Master Your{' '}
              <span className="block">
                Staff &{' '}
                <span className="text-sky-500">Shifts</span>
              </span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-md">
              A professional SaaS product for bar owners and managers to handle
              branches, employees, and shifts with zero friction.
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-6 py-3 rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                See How It Works
              </button>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['#f97316', '#0ea5e9', '#8b5cf6'].map((c, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: c }}
                  >
                    {['A', 'B', 'C'][i]}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                  +2k
                </div>
              </div>
              <div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Trusted by{' '}
                  <span className="text-sky-600 font-medium">top venues</span>
                </p>
              </div>
            </div>
          </div>

          {/* App preview */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-slate-100 rounded-3xl -rotate-2 scale-105" />
            <div className="relative">
              <AppPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Logos */}
      <section className="border-y border-gray-100 bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-medium text-gray-400 tracking-widest uppercase mb-6">
            Powering operations for industry leaders
          </p>
          <div className="flex justify-center items-center gap-10 flex-wrap">
            {LOGOS.map((l) => (
              <div
                key={l.label}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-2xl">{l.char}</span>
                <span className="text-sm font-medium">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Everything you need to run the house
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Built specifically for the chaotic, fast-paced environment of bars
            and restaurants. We handle the admin so you can handle the floor.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-[#0F172A] rounded-2xl px-10 py-14 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/10 text-sky-300 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <CheckCircle2 className="w-3.5 h-3.5" />
            No credit card required
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to tame the chaos?
          </h2>
          <p className="text-slate-400 mb-8">
            Join thousands of venues saving 15+ hours a week on scheduling and
            admin.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-sky-400 transition-colors"
            >
              Get Started for Free
            </Link>
            <button className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/5 transition-colors">
              <Shield className="w-4 h-4" />
              Talk to Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-sky-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">B</span>
            </div>
            <span className="font-semibold text-slate-800 text-sm">
              BarRoster
            </span>
          </div>
          <p className="text-xs text-gray-400">
            © 2026 BarRoster Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
