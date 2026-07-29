import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { paymentsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Check, Crown, Zap, Star, AlertTriangle } from 'lucide-react';

const PLAN_ICONS = {
  basic: Zap,
  standard: Star,
  premium: Crown,
};

const POSTERS = [
  "https://image.tmdb.org/t/p/w300/qJ2tW6jUORIpkiJ22rhi415Kyey.jpg",
  "https://image.tmdb.org/t/p/w300/vZ7w9jLyOerapctrmYgJmqO2aKg.jpg",
  "https://image.tmdb.org/t/p/w300/r2514Ta2jCqfVbV84nSwjLGZIB7.jpg",
  "https://image.tmdb.org/t/p/w300/gEU2QvH353eRPvN1vj67nbec400.jpg",
  "https://image.tmdb.org/t/p/w300/lfRkRtR6d1STUD1g6jXIrbm7167.jpg",
  "https://image.tmdb.org/t/p/w300/8Gxv2wS0EHvSqn2P8d32VKst9N5.jpg",
  "https://image.tmdb.org/t/p/w300/iiX042tr0IQ7vxbrWgWgH58a90c.jpg",
  "https://image.tmdb.org/t/p/w300/oF8wJyBiV96gh5j21nH1Tt4t303.jpg",
  "https://image.tmdb.org/t/p/w300/d5i25Cc15jIL78440Nn6i121gNn.jpg",
  "https://image.tmdb.org/t/p/w300/pB8BM76v6g0zZ7X6W1si4r716p5.jpg",
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(false);
  const [stripeReady, setStripeReady] = useState(true);

  useEffect(() => {
    paymentsAPI.plans().then(res => setPlans(res.data.plans || {})).catch(() => {});
    paymentsAPI.config().then(res => {
      setStripeReady(!!res.data.publishable_key);
    }).catch(() => setStripeReady(false));
  }, []);

  const handleSubscribe = async (planKey) => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }
    if (!stripeReady) {
      toast.info('Payments are not yet enabled. Check back soon!');
      return;
    }
    setLoading(true);
    try {
      const res = await paymentsAPI.subscribe({
        plan: planKey,
        origin_url: window.location.origin,
      });
      window.location.href = res.data.url;
    } catch (err) {
      const status = err.response?.status;
      if (status === 503) {
        toast.info('Payments are coming soon — Stripe not yet configured.');
        setStripeReady(false);
      } else {
        toast.error(err.response?.data?.detail || 'Failed to start checkout');
      }
    }
    setLoading(false);
  };

  const planEntries = Object.entries(plans);

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Cinematic scrolling backdrop wall */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none opacity-[0.12] filter blur-[2px]">
        {/* Track 1: Scroll Left */}
        <div className="flex gap-4 w-[200%] animate-[scrollLeft_30s_infinite_linear] mb-4">
          {[...POSTERS, ...POSTERS].map((p, idx) => (
            <img key={`track1-${idx}`} src={p} alt="" className="w-40 h-60 object-cover rounded-lg shadow-md" />
          ))}
        </div>
        {/* Track 2: Scroll Right */}
        <div className="flex gap-4 w-[200%] animate-[scrollRight_35s_infinite_linear]">
          {[...POSTERS, ...POSTERS].map((p, idx) => (
            <img key={`track2-${idx}`} src={p} alt="" className="w-40 h-60 object-cover rounded-lg shadow-md" />
          ))}
        </div>
        {/* Fade Out Edge overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-transparent to-[hsl(var(--background))]" />
        <div className="absolute inset-0 bg-radial-glow opacity-30" />
      </div>

      <div className="relative z-10 max-w-[1200px] w-full mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-white to-violet-300 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk' }}>
              Choose Your Plan
            </h1>
            <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto text-base">
              Unlock unlimited streaming, theatre discounts, and premium AI features
            </p>
          </div>

          {!stripeReady && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 max-w-lg mx-auto backdrop-blur-md">
              <AlertTriangle size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Payments coming soon</p>
                <p className="text-xs text-amber-400/70 mt-1">
                  Stripe is not yet configured. You can browse plans, but checkout is disabled for now.
                </p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8">
            {planEntries.map(([key, plan], i) => {
              const Icon = PLAN_ICONS[key] || Zap;
              const isPopular = key === 'standard';
              const isCurrentPlan = user?.subscription?.plan === key && user?.subscription?.status === 'active';

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Card className={`glass-card border-white/10 relative overflow-hidden backdrop-blur-lg hover:border-white/20 transition-all duration-300 ${
                    isPopular ? 'ring-2 ring-violet-500 shadow-[0_0_30px_rgba(168,85,247,0.25)]' : ''
                  }`}>
                    {isPopular && (
                      <div className="absolute top-0 right-0">
                        <Badge className="rounded-none rounded-bl-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs px-3 py-1 font-semibold border-none">
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                        isPopular ? 'bg-violet-500/20 shadow-inner' : 'bg-white/5'
                      }`}>
                        <Icon size={28} className={isPopular ? 'text-violet-400' : 'text-[hsl(var(--muted-foreground))]'} />
                      </div>
                      <CardTitle className="text-2xl font-bold capitalize" style={{ fontFamily: 'Space Grotesk' }}>{plan.name}</CardTitle>
                      <div className="mt-2">
                        <span className="text-4xl font-extrabold tabular-nums">${plan.price_monthly?.toFixed(2)}</span>
                        <span className="text-sm text-[hsl(var(--muted-foreground))] font-medium">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ul className="space-y-4 mb-8">
                        {plan.features?.map((f, j) => (
                          <li key={j} className="flex items-center gap-3 text-sm text-white/80">
                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                              <Check size={12} className="text-green-400" />
                            </div>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      {isCurrentPlan ? (
                        <Button className="w-full" variant="outline" disabled data-testid={`plan-${key}-current`}>
                          Current Plan
                        </Button>
                      ) : (
                        <Button
                          className={`w-full text-sm font-semibold h-11 ${
                            isPopular
                              ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 shadow-lg shadow-violet-600/20'
                              : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                          }`}
                          onClick={() => handleSubscribe(key)}
                          disabled={loading}
                          data-testid={`plan-${key}-subscribe`}
                        >
                          {loading ? 'Processing...' : 'Subscribe'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {!user && (
            <div className="text-center pt-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 font-medium">
                Sign in to customize your plan & continue
              </p>
              <Link to="/auth/login">
                <Button variant="outline" className="glass-card px-6 h-10 text-sm font-semibold hover:bg-white/5" data-testid="subscription-login-button">Sign In</Button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
