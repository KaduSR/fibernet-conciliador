'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isSignUp, setIsSignUp] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setError('Conta criada! Verifique seu email para confirmar.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        window.location.href = '/'
      }
    }
    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4 lg:p-0">
      <div className="flex w-full max-w-6xl min-h-[750px] overflow-hidden rounded-3xl bg-white shadow-xl flex-col lg:flex-row">

        {/* ── Left Side – Form ── */}
        <section className="flex w-full lg:w-1/2 flex-col justify-between p-12 lg:p-20 bg-white">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="h-6 w-3 rounded-sm" style={{ backgroundColor: '#7c3aed' }} />
            <span className="text-xl font-bold text-gray-900">Fibernet</span>
          </div>

          {/* Heading */}
          <div className="mt-10">
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              {isSignUp ? <>Criar<br />Conta</> : <>Olá,<br />Bem-vindo(a) de novo</>}
            </h1>
            <p className="mt-4 text-lg text-gray-500">
              {isSignUp
                ? 'Crie sua conta para começar'
                : 'Hey, bem-vindo de volta ao seu lugar especial'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="stanley@gmail.com"
              className="w-full rounded-xl border border-gray-200 px-4 py-4 text-gray-700 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-xl border border-gray-200 px-4 py-4 text-gray-700 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />

            {!isSignUp && (
              <div className="flex items-center justify-between py-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-600">
                  <input
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 cursor-pointer accent-purple-600"
                  />
                  Remember me
                </label>
                <Link
                  href="#"
                  className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-48 rounded-xl py-4 font-bold text-white transition-colors disabled:opacity-50 hover:brightness-110"
              style={{
                backgroundColor: '#7c3aed',
                boxShadow: '0 10px 25px -5px rgba(124,58,237,0.35)',
              }}
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-16 text-sm text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
              className="font-bold hover:underline"
              style={{ color: '#7c3aed' }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </section>

        {/* ── Right Side – Illustration ── */}
        <section className="relative hidden lg:block lg:w-1/2">
          <Image
            src="/fundo.webp"
            alt="Login illustration"
            fill
            className="object-cover object-right-center"
            priority
          />
        </section>

      </div>
    </main>
  )
}