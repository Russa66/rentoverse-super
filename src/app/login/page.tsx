'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Phone, Lock, ArrowRight, Mail, User, Eye, EyeOff, Home, ChevronLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { PlaceHolderImages } from '@/lib/placeholder-images'

type Mode = 'login' | 'signup' | 'forgot'

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const logo = PlaceHolderImages.find(img => img.id === 'logo')

  const resetFields = () => { setError(null); setSuccess(null) }
  const switchMode = (m: Mode) => { resetFields(); setOtpSent(false); setMode(m) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null)

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      })
      if (error) setError(error.message)
      else setSuccess('Reset link sent! Check your email inbox.')
      setLoading(false); return
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '')}`

    if (mode === 'signup') {
      if (otpSent) {
        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'signup'
        })
        if (error) { 
          setError(error.message) 
        } else if (data?.session?.user) {
          const user = data.session.user;
          const nameToSave = fullName.trim() || user.user_metadata?.name || 'New User';
          const phoneToSave = formattedPhone || user.user_metadata?.phone_number || '';
          
          const userData = {
            auth_id: user.id,
            name: nameToSave,
            email: email,
            phone_number: phoneToSave,
            is_verified: true,
            updated_at: new Date().toISOString()
          };
  
          const { createClient: createClientJS } = await import('@supabase/supabase-js');
          const tempSupabase = createClientJS(
            process.env.NEXT_PUBLIC_SUPABASE_URL || "https://menazayzyfjimgfcwqnp.supabase.co",
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lbmF6YXl6eWZqaW1nZmN3cW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDYwMjAsImV4cCI6MjA5MDk4MjAyMH0.27UFkc_enyAbVelrMVJwsIhxAWb7FdOk3xonnC16nkY",
            { global: { headers: { Authorization: `Bearer ${data.session.access_token}` } } }
          );

          const { data: existingUser, error: existingErr } = await tempSupabase.from("users").select("id").eq("email", email).maybeSingle();
          if (existingErr) {
            setError(`Database Error: ${existingErr.message}`);
            setLoading(false); return;
          }
          
          let dbError;
          let rowsAffected = 0;
  
          if (existingUser) {
             const { data: updatedRows, error } = await tempSupabase.from("users").update(userData).eq("id", existingUser.id).select();
             dbError = error;
             rowsAffected = updatedRows?.length || 0;
          } else {
             const { data: insertedRows, error } = await tempSupabase.from("users").insert([{ id: user.id, ...userData }]).select();
             dbError = error;
             rowsAffected = insertedRows?.length || 0;
          }
  
          if (dbError || rowsAffected === 0) {
            const errorMsg = dbError?.message || 'Rows updated: 0. Missing RLS policy.';
            setError(`Profile save failed: ${errorMsg}`);
            setLoading(false);
            return;
          }
          
          window.location.href = '/profile'
        }
        setLoading(false); return
      } else {
        if (!fullName.trim()) { setError('Please enter your full name.'); setLoading(false); return }
        if (!email) { setError('Email is required for account recovery.'); setLoading(false); return }
        if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); setLoading(false); return }
    
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { name: fullName.trim(), phone_number: formattedPhone } },
        })
        if (error) { setError(error.message) } else {
          setSuccess('Verification code sent to your email!')
          setOtpSent(true)
        }
        setLoading(false); return
      }
    }

    if (mode === 'login') {
      const { data: userData, error: lookupError } = await supabase
        .from('users').select('email').eq('phone_number', formattedPhone).maybeSingle()
      if (lookupError || !userData?.email) {
        setError('No account found with this phone number. Please sign up first.')
        setLoading(false); return
      }
      const { error } = await supabase.auth.signInWithPassword({ email: userData.email, password })
      if (error) setError(error.message)
      else window.location.href = '/profile'
      setLoading(false); return
    }
  }

  const handleResendOtp = async () => {
    setLoading(true); setError(null); setSuccess(null)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('A new verification code has been sent to your email!')
    }
    setLoading(false)
  }

  const titles = {
    login: { h: 'Welcome Back', sub: 'Sign in with your phone number' },
    signup: { h: 'Create Account', sub: 'Join RentoVerse for free' },
    forgot: { h: 'Forgot Password?', sub: "We'll send a recovery link to your email" },
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-600 via-green-700 to-teal-800 p-4 relative overflow-hidden">

      {/* Background decorative blobs */}
      <div className="absolute top-[-80px] right-[-80px] w-72 h-72 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-[-60px] left-[-60px] w-64 h-64 bg-emerald-900/30 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-[-40px] w-40 h-40 bg-teal-400/10 rounded-full blur-2xl" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Card Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-green-600 px-6 pt-7 pb-6 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10" />
          <div className="absolute bottom-0 right-8 w-16 h-16 rounded-full bg-white/5" />

          {mode !== 'login' && (
            <button
              onClick={() => switchMode('login')}
              className="relative flex items-center gap-1 text-white/70 text-xs mb-4 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back to Sign In
            </button>
          )}

          <div className="relative flex items-center gap-2.5 mb-4">
            {logo ? (
              <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white/20 border border-white/30 shrink-0">
                <Image src={logo.imageUrl} alt="RentoVerse" fill className="object-contain p-1" />
              </div>
            ) : (
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                <Home className="text-white w-4.5 h-4.5" />
              </div>
            )}
            <div>
              <p className="text-white font-bold text-base leading-none">RentoVerse</p>
              <p className="text-emerald-100 text-[10px] mt-0.5">Find Your Perfect Stay</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
              className="relative"
            >
              <h1 className="text-white font-bold text-xl leading-tight">{titles[mode].h}</h1>
              <p className="text-emerald-100 text-xs mt-0.5">{titles[mode].sub}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Form Body */}
        <div className="px-6 py-5">
          {/* Tabs */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex bg-slate-100 rounded-xl p-1 mb-5">
              {(['login', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 ${mode === m ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.16 }}
              onSubmit={handleSubmit}
              className="flex flex-col gap-3"
            >
              {/* Full Name — signup only */}
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <input type="text" placeholder="Full Name" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} required disabled={otpSent}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 text-sm transition-all ${otpSent ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
              )}

              {/* Email — signup & forgot */}
              {(mode === 'signup' || mode === 'forgot') && (
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <input type="email" placeholder={mode === 'forgot' ? 'Your Email Address' : 'Email (for recovery)'} value={email}
                    onChange={(e) => setEmail(e.target.value)} required disabled={otpSent}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 text-sm transition-all ${otpSent ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
              )}

              {/* Phone — login & signup */}
              {(mode === 'login' || mode === 'signup') && (
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center gap-1.5 text-slate-500 text-xs font-medium select-none">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="border-r border-slate-300 pr-2">+91</span>
                  </div>
                  <input type="tel" placeholder="10-digit Mobile Number" value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required maxLength={10} inputMode="numeric" disabled={otpSent}
                    className={`w-full pl-[4.2rem] pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 text-sm transition-all ${otpSent ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
              )}

              {/* Password */}
              {(mode === 'login' || mode === 'signup') && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={otpSent}
                    className={`w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 text-sm transition-all ${otpSent ? 'opacity-60 cursor-not-allowed' : ''}`} />
                  <button type="button" onClick={() => !otpSent && setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* Confirm Password — signup only */}
              {mode === 'signup' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm Password" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} disabled={otpSent}
                    className={`w-full pl-9 pr-9 py-2.5 rounded-xl border bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 text-slate-800 text-sm transition-all ${otpSent ? 'opacity-60 cursor-not-allowed' : confirmPassword && confirmPassword !== password ? 'border-red-300 focus:ring-red-300' :
                      confirmPassword && confirmPassword === password ? 'border-emerald-300 focus:ring-emerald-400' :
                        'border-slate-200 focus:ring-emerald-400'}`} />
                  <button type="button" onClick={() => !otpSent && setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {/* OTP - signup only when otpSent */}
              {mode === 'signup' && otpSent && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative text-center space-y-2 mt-2">
                  <p className="text-xs text-slate-500 mb-2">Code sent to: <span className="font-bold text-emerald-600">{email}</span></p>
                  <input type="text" placeholder="123456" value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required maxLength={6}
                    className="w-full text-center tracking-[0.5em] font-bold text-xl py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-slate-800 transition-all" />
                  <button type="button" onClick={handleResendOtp} disabled={loading}
                    className="text-xs text-emerald-600 hover:underline font-medium transition-colors mt-2 disabled:opacity-50">
                    Didn't receive the code? Resend
                  </button>
                </motion.div>
              )}

              {/* Forgot link */}
              {mode === 'login' && (
                <div className="text-right -mt-1">
                  <button type="button" onClick={() => switchMode('forgot')}
                    className="text-xs text-emerald-600 hover:underline font-medium">Forgot Password?</button>
                </div>
              )}

              {/* Error / Success */}
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-xs font-medium bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    {error}
                  </motion.p>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 text-emerald-700 text-xs font-medium bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />{success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-500/25 hover:from-emerald-600 hover:to-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-60">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>{mode === 'login' ? 'Sign In' : mode === 'signup' ? (otpSent ? 'Submit' : 'Get OTP') : 'Send Reset Link'} <ArrowRight className="w-3.5 h-3.5" /></>
                }
              </button>
            </motion.form>
          </AnimatePresence>

          {/* Footer note */}
          <div className="flex items-center gap-1.5 mt-4 text-slate-400">
            <ShieldCheck className="w-3 h-3 shrink-0 text-emerald-400" />
            <p className="text-[10px]">End-to-end encrypted</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}