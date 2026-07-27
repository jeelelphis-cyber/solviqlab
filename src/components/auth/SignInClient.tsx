'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export function SignInClient() {
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setLoading(true)
    await signIn('google', { callbackUrl: '/' })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-slate-900 dark:text-white" translate="no">
            SolviqLab
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sign in to save your progress
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 space-y-4 shadow-sm">

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 min-h-[44px]
                       border border-slate-200 dark:border-slate-700
                       bg-white dark:bg-slate-800
                       text-slate-800 dark:text-slate-200
                       text-sm font-semibold rounded-xl
                       hover:bg-slate-50 dark:hover:bg-slate-700
                       active:scale-[0.98] transition-all duration-150
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          <p className="text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            By continuing, you agree to our{' '}
            <a href="/en/terms" className="underline hover:text-slate-600">Terms</a>
            {' '}and{' '}
            <a href="/en/privacy" className="underline hover:text-slate-600">Privacy Policy</a>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Your data stays private. We never sell it.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
