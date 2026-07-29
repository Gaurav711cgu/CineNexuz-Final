import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { otpAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Film, Mail, Lock, User, ArrowRight, KeyRound, RotateCcw, ChevronLeft } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';
const FALLBACK = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop';

/* ── Single scrolling column of posters ─────────────────────────── */
function PosterColumn({ posters, speed = 30, reverse = false }) {
  const colRef = useRef(null);

  useEffect(() => {
    const el = colRef.current;
    if (!el || posters.length === 0) return;
    let start = null;
    let animId;
    const dir = reverse ? -1 : 1;

    function step(ts) {
      if (!start) start = ts;
      const totalH = el.scrollHeight / 2;
      const elapsed = (ts - start) / 1000;
      const raw = (elapsed * speed) % totalH;
      const offset = dir > 0 ? raw : totalH - raw;
      el.style.transform = `translateY(-${offset}px)`;
      animId = requestAnimationFrame(step);
    }
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [posters, speed, reverse]);

  const doubled = [...posters, ...posters];

  return (
    <div className="relative overflow-hidden flex-1" style={{ height: '100vh' }}>
      <div ref={colRef} className="flex flex-col gap-2">
        {doubled.map((p, i) => (
          <div
            key={i}
            className="rounded-lg overflow-hidden flex-shrink-0 w-full"
            style={{ aspectRatio: '2/3' }}
          >
            <img
              src={p.poster_path ? `${TMDB_IMG}${p.poster_path}` : FALLBACK}
              alt={p.title || ''}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = FALLBACK; }}
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Movie Poster Wall (fetches real posters from ingested DB) ───── */
export function MoviePosterWall() {
  const [cols, setCols] = useState([[], [], []]);

  useEffect(() => {
    const base = process.env.REACT_APP_BACKEND_URL || '';
    fetch(`${base}/api/movies?limit=60&page=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const movies = (data?.movies || data?.results || []).filter(m => m.poster_path);
        if (movies.length < 6) return;
        const shuffled = [...movies].sort(() => Math.random() - 0.5);
        const third = Math.ceil(shuffled.length / 3);
        setCols([
          shuffled.slice(0, third),
          shuffled.slice(third, third * 2),
          shuffled.slice(third * 2),
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="absolute inset-0 bg-[#050507] overflow-hidden">
      {/* Scrolling columns */}
      <div className="flex gap-2 px-2 pt-2 h-full opacity-55">
        <PosterColumn posters={cols[0]} speed={28} />
        <PosterColumn posters={cols[1]} speed={22} reverse />
        <PosterColumn posters={cols[2]} speed={35} />
      </div>

      {/* Gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#050507]/30 to-[#050507]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050507]/80 via-transparent to-[#050507]/80" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 45% 52%, rgba(0,229,255,0.07) 0%, transparent 65%)',
      }} />

      {/* Brand overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center mx-auto mb-5 shadow-[0_0_40px_rgba(0,228,255,0.35)]">
            <Logo size={40} glow={true} />
          </div>
          <h2
            className="text-4xl font-black tracking-tight mb-3 text-white"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            CINE<span className="text-[#00E4FF]">NEXUZ</span>
          </h2>
          <p className="text-white/45 max-w-xs text-sm leading-relaxed">
            AI-powered cinema. 5,000+ films.<br />Personalised for you.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Login Page ──────────────────────────────────────────────────── */
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Live Movie Poster Wall — left half (desktop only) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <MoviePosterWall />
      </div>

      {/* Form — right half */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#07080f]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="glass-card border-white/10">
            <CardHeader className="text-center">
              <div className="lg:hidden w-12 h-12 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(0,228,255,0.25)]">
                <Logo size={30} glow={true} />
              </div>
              <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk' }}>Welcome back</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="password">
                <TabsList className="w-full bg-white/5 mb-4">
                  <TabsTrigger value="password" className="flex-1">Password</TabsTrigger>
                  <TabsTrigger value="otp" className="flex-1">Email OTP</TabsTrigger>
                </TabsList>

                <TabsContent value="password">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                      <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-white/5 border-white/10" required data-testid="login-email-input" />
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                      <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-white/5 border-white/10" required data-testid="login-password-input" />
                    </div>
                    <Button type="submit" className="w-full bg-[hsl(var(--primary))] hover:brightness-110 gap-2" disabled={loading} data-testid="login-submit-button">
                      {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
                    </Button>
                  </form>
                  <Link to="/auth/reset" className="block text-center text-xs text-[hsl(var(--muted-foreground))] mt-3 hover:text-[hsl(var(--primary))]">
                    Forgot password?
                  </Link>
                </TabsContent>

                <TabsContent value="otp">
                  <OTPLoginForm />
                </TabsContent>
              </Tabs>

              <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
                Don't have an account?{' '}
                <Link to="/auth/signup" className="text-[hsl(var(--primary))] hover:underline" data-testid="login-signup-link">
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
          <Link to="/" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mt-5 justify-center">
            <ChevronLeft size={14} /> Back to CineNexuz
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Signup Page ─────────────────────────────────────────────────── */
export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signup(email, password, name);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Live Movie Poster Wall */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <MoviePosterWall />
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-[#07080f]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="glass-card border-white/10">
            <CardHeader className="text-center">
              <div className="lg:hidden w-12 h-12 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(0,228,255,0.25)]">
                <Logo size={30} glow={true} />
              </div>
              <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk' }}>Create account</CardTitle>
              <CardDescription>Get started for free</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 bg-white/5 border-white/10" required data-testid="signup-name-input" />
                </div>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-white/5 border-white/10" required data-testid="signup-email-input" />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-white/5 border-white/10" required minLength={6} data-testid="signup-password-input" />
                </div>
                <Button type="submit" className="w-full bg-[hsl(var(--primary))] hover:brightness-110 gap-2" disabled={loading} data-testid="signup-submit-button">
                  {loading ? 'Creating...' : 'Create Account'}
                  <ArrowRight size={16} />
                </Button>
              </form>
              <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-[hsl(var(--primary))] hover:underline" data-testid="signup-login-link">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
          <Link to="/" className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mt-5 justify-center">
            <ChevronLeft size={14} /> Back to CineNexuz
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

/* ── OTP Login Sub-form ──────────────────────────────────────────── */
function OTPLoginForm() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await otpAPI.request({ email });
      toast.success('OTP sent to your email!');
      setStep('code');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await otpAPI.verify({ email, code });
      localStorage.setItem('auth_token', res.data.token);
      toast.success('Logged in!');
      window.location.href = '/';
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid OTP');
    }
    setLoading(false);
  };

  if (step === 'code') {
    return (
      <form onSubmit={verifyOTP} className="space-y-4">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Enter the 6-digit code sent to <strong>{email}</strong></p>
        <div className="relative">
          <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <Input placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-center text-lg tracking-[0.5em]" maxLength={6} required data-testid="otp-code-input" />
        </div>
        <Button type="submit" className="w-full bg-[hsl(var(--primary))] hover:brightness-110 gap-2" disabled={loading} data-testid="otp-verify-button">
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </Button>
        <button type="button" className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]" onClick={() => setStep('email')}>
          Change email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestOTP} className="space-y-4">
      <div className="relative">
        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-white/5 border-white/10" required data-testid="otp-email-input" />
      </div>
      <Button type="submit" className="w-full bg-[hsl(var(--primary))] hover:brightness-110 gap-2" disabled={loading} data-testid="otp-request-button">
        {loading ? 'Sending...' : 'Send OTP'} <Mail size={16} />
      </Button>
    </form>
  );
}

/* ── Password Reset Page ─────────────────────────────────────────── */
export function PasswordResetPage() {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const requestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await otpAPI.resetRequest({ email });
      toast.success('Reset code sent!');
      setStep('code');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
    setLoading(false);
  };

  const confirmReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await otpAPI.resetConfirm({ email, code, new_password: newPassword });
      toast.success('Password reset! Please sign in.');
      navigate('/auth/login');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#07080f]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="glass-card border-white/10">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-xl bg-[#00E4FF] flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(0,228,255,0.6)]">
              <RotateCcw size={24} className="text-white" />
            </div>
            <CardTitle className="text-2xl" style={{ fontFamily: 'Space Grotesk' }}>Reset Password</CardTitle>
            <CardDescription>{step === 'email' ? 'Enter your email to receive a reset code' : 'Enter the code and your new password'}</CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={requestReset} className="space-y-4">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-white/5 border-white/10" required data-testid="reset-email-input" />
                </div>
                <Button type="submit" className="w-full bg-[hsl(var(--primary))] hover:brightness-110" disabled={loading} data-testid="reset-request-button">
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </Button>
              </form>
            ) : (
              <form onSubmit={confirmReset} className="space-y-4">
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <Input placeholder="000000" value={code} onChange={(e) => setCode(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-center text-lg tracking-[0.5em]" maxLength={6} required data-testid="reset-code-input" />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  <Input type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 bg-white/5 border-white/10" required minLength={6} data-testid="reset-new-password-input" />
                </div>
                <Button type="submit" className="w-full bg-[hsl(var(--primary))] hover:brightness-110" disabled={loading} data-testid="reset-confirm-button">
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}
            <Link to="/auth/login" className="block text-center text-sm text-[hsl(var(--muted-foreground))] mt-4 hover:text-[hsl(var(--primary))]">
              Back to Sign In
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
