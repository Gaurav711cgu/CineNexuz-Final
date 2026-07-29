import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { paymentsAPI } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Home, Film, Ticket } from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w300';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    const pollStatus = async () => {
      try {
        const res = await paymentsAPI.status(sessionId);
        setStatus(res.data);
        if (res.data.payment_status === 'paid') {
          setLoading(false);
          return;
        }
        if (res.data.status === 'expired') {
          setLoading(false);
          return;
        }
        if (attempts < 10) {
          setTimeout(() => setAttempts(a => a + 1), 2000);
        } else {
          setLoading(false);
        }
      } catch {
        if (attempts < 10) {
          setTimeout(() => setAttempts(a => a + 1), 2000);
        } else {
          setLoading(false);
        }
      }
    };

    pollStatus();
  }, [sessionId, attempts]);

  const isPaid = status?.payment_status === 'paid';
  const isExpired = status?.status === 'expired';

  const metadata = status?.metadata || {};
  const isSubscription = metadata.type === 'subscription' || metadata.plan;
  const movieTitle = metadata.movie_title || 'Your Selected Movie';
  const moviePoster = metadata.movie_poster;

  return (
    <div className="flex items-center justify-center min-h-[90vh] px-4 py-12 relative overflow-hidden bg-[#0A0A0C]">
      {/* Background glow effects */}
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full max-w-md relative z-10"
      >
        <Card className="glass-card border-white/10 overflow-hidden relative backdrop-blur-xl">
          <CardContent className="p-8 text-center relative">
            {loading ? (
              <div className="py-12">
                <Loader2 size={48} className="animate-spin mx-auto mb-6 text-violet-500" />
                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-violet-300 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk' }}>
                  Confirming Payment
                </h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Please wait while we confirm your checkout session...</p>
              </div>
            ) : isPaid ? (
              <div className="space-y-6">
                <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 size={32} className="text-green-400" />
                </div>
                
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-green-300 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk' }}>
                  {isSubscription ? 'Welcome Aboard!' : 'Ticket Confirmed!'}
                </h2>

                <p className="text-sm text-white/70 max-w-xs mx-auto leading-relaxed">
                  {isSubscription 
                    ? 'Your premium CineNexuz membership is now fully active.' 
                    : `Your ticket to ${movieTitle} is ready!`}
                </p>

                {/* Cinema Ticket Receipt Mockup */}
                {!isSubscription && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="relative bg-gradient-to-br from-[#121216] to-[#181822] border border-white/5 rounded-2xl p-6 shadow-2xl text-left overflow-hidden"
                  >
                    {/* Ticket notch cutouts */}
                    <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-[#0A0A0C] border-r border-white/5 transform -translate-y-1/2 z-20" />
                    <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[#0A0A0C] border-l border-white/5 transform -translate-y-1/2 z-20" />

                    <div className="flex gap-4 items-start relative z-10">
                      {moviePoster && (
                        <img 
                          src={`${TMDB_IMG}${moviePoster}`} 
                          alt="" 
                          className="w-16 h-24 object-cover rounded-lg border border-white/10 shadow-lg"
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        <Badge className="bg-violet-500/20 text-violet-300 border-none text-[10px] uppercase font-mono px-2 py-0.5">
                          Admit One
                        </Badge>
                        <h4 className="font-bold text-white text-base leading-snug line-clamp-2" style={{ fontFamily: 'Space Grotesk' }}>
                          {movieTitle}
                        </h4>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-mono">
                          Format: Ultra HD / 4K
                        </p>
                      </div>
                    </div>

                    {/* Dotted Tear Line */}
                    <div className="border-t border-dashed border-white/10 my-4 relative z-10" />

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono relative z-10">
                      <div>
                        <span className="text-[9px] text-[hsl(var(--muted-foreground))] uppercase block">Receipt Amount</span>
                        <span className="font-semibold text-white">
                          {status?.amount_total 
                            ? `$${(status.amount_total / 100).toFixed(2)}`
                            : '$0.00'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[hsl(var(--muted-foreground))] uppercase block">License Tier</span>
                        <span className="font-semibold text-green-400 capitalize">
                          {metadata.type === 'buy' ? 'Lifetime Buy' : '48h Rental'}
                        </span>
                      </div>
                    </div>

                    {/* Visual Barcode */}
                    <div className="mt-4 pt-1 flex flex-col items-center gap-1.5 opacity-60">
                      <div className="w-full h-8 bg-white/5 flex gap-[2px] items-center px-2 rounded overflow-hidden">
                        {[4, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 4, 1, 2, 3, 4].map((width, i) => (
                          <div key={i} className="h-full bg-white/40 flex-grow" style={{ flexGrow: width }} />
                        ))}
                      </div>
                      <span className="text-[8px] font-mono text-[hsl(var(--muted-foreground))] tracking-[0.3em]">
                        CN-{sessionId?.substring(8, 20).toUpperCase()}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Subscriptions success badge details */}
                {isSubscription && status?.amount_total && (
                  <div className="py-2">
                    <Badge className="bg-green-500/15 text-green-400 text-sm px-3 py-1 font-semibold border-none rounded-full shadow-inner">
                      Amount Paid: ${(status.amount_total / 100).toFixed(2)} {status.currency?.toUpperCase()}
                    </Badge>
                  </div>
                )}

                <div className="flex gap-4 justify-center pt-2">
                  <Link to="/">
                    <Button variant="outline" className="gap-2 glass-card hover:bg-white/5 h-11 text-sm font-semibold" data-testid="checkout-home-button">
                      <Home size={16} /> Home
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 h-11 text-sm font-semibold shadow-lg shadow-violet-600/20" data-testid="checkout-profile-button">
                      <Film size={16} /> My Library
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                  <XCircle size={32} className="text-red-400" />
                </div>
                
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-red-400 bg-clip-text text-transparent" style={{ fontFamily: 'Space Grotesk' }}>
                  {isExpired ? 'Session Expired' : 'Payment Failed'}
                </h2>
                
                <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-xs mx-auto leading-relaxed">
                  {isExpired 
                    ? 'Your checkout session has expired. Please select the movie or plan and try again.' 
                    : 'We could not verify your Stripe payment status. Please try checking out again.'}
                </p>

                <div className="pt-2">
                  <Link to="/">
                    <Button className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:brightness-110 h-11 px-6 font-semibold" data-testid="checkout-retry-button">
                      <Home size={16} /> Go Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
