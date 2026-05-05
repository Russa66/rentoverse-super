'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Lock, Eye, EyeOff, CheckCircle2, Home, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { PlaceHolderImages } from '@/lib/placeholder-images'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()
  const logo = PlaceHolderImages.find(img => img.id === 'logo')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => { window.location.href = '/login' }, 2500)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white font-body">

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 px-6 pt-14 pb-20">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-20 -right-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-6 w-36 h-36 rounded-full bg-emerald-500/30" />

        <div className="relative flex items-center gap-3 mb-8">
          {logo ? (
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-white/30 bg-white/20">
              <Image src={logo.imageUrl} alt="RentoVerse" fill className="object-contain" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center border border-white/30">
              <Home className="text-white w-5 h-5" />
            </div>
          )}
          <div>
            <p className="text-white font-bold text-xl leading-none">RentoVerse</p>
            <p className="text-emerald-200 text-xs mt-0.5">Find Your Perfect Stay</p>
          </div>
        </div>

        <h1 className="relative text-3xl font-bold text-white mb-1">Set New Password</h1>
        <p className="relative text-emerald-100 text-sm">Choose a strong, secure password</p>
      </div>

      {/* Form Card */}
      <div className="flex-1 px-5 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-4 py-6"
            >
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">Password Updated!</p>
                <p className="text-sm text-slate-500 mt-1">Redirecting you to sign in...</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2.5 }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-800 text-sm"
                    required minLength={6}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex gap-1 mt-2 items-center">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${password.length >= i * 3 ? password.length >= 10 ? 'bg-emerald-500' : password.length >= 7 ? 'bg-yellow-400' : 'bg-red-400' : 'bg-slate-200'}`} />
                    ))}
                    <span className="text-xs text-slate-400 ml-1">{password.length < 6 ? 'Weak' : password.length < 10 ? 'Fair' : 'Strong'}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Retype your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-3.5 rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 transition-all text-slate-800 text-sm ${confirmPassword && confirmPassword !== password ? 'border-red-300 focus:ring-red-400' : confirmPassword && confirmPassword === password ? 'border-emerald-300 focus:ring-emerald-400' : 'border-slate-200 focus:ring-emerald-500'}`}
                    required
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                {confirmPassword && confirmPassword === password && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Passwords match</p>}
              </div>

              {error && <p className="text-red-500 text-sm font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-green-700 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Update Password <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="text-center text-slate-400 text-xs py-6">Your data is secured with end-to-end encryption</p>
    </div>
  )
}
