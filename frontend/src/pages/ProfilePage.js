import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { profileAPI, tasteDNAAPI, onboardingAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { User, Crown, ShoppingBag, Calendar, CreditCard, Dna, Sparkles, Film } from 'lucide-react';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w200';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tasteDNA, setTasteDNA] = useState(null);
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) { setLoading(false); return; }
      try {
        const [profileRes, dnaRes, onboardingRes] = await Promise.all([
          profileAPI.get(),
          tasteDNAAPI.get(),
          onboardingAPI.status(),
        ]);
        setProfile(profileRes.data);
        setTasteDNA(dnaRes.data);
        setOnboardingStatus(onboardingRes.data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (!user) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-12 text-center">
        <User size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
        <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Sign in to view your profile</h2>
        <Link to="/auth/login">
          <Button className="bg-[hsl(var(--primary))] hover:brightness-110 mt-4" data-testid="profile-login-button">Sign In</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const userData = profile?.user || user;
  const purchases = profile?.purchases || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1200px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-semibold tracking-tight mb-6" style={{ fontFamily: 'Space Grotesk' }}>Profile</h1>

        {/* User Info */}
        <Card className="glass-card border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#00E4FF] flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_25px_rgba(0,228,255,0.5)]">
                {userData.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{userData.name}</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{userData.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{userData.role}</Badge>
                  {userData.subscription?.status === 'active' && (
                    <Badge className="text-xs bg-[hsl(var(--primary))]/15 text-[hsl(var(--primary))]">
                      <Crown size={10} className="mr-1" /> {userData.subscription.plan} Plan
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taste DNA Section */}
        {onboardingStatus && !onboardingStatus.completed ? (
          <Card className="glass-card border-white/10 mb-6">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary))]/15 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-[hsl(var(--primary))]" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Space Grotesk' }}>Build Your Taste DNA</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                Complete our quick quiz to get personalized recommendations tailored to your preferences
              </p>
              <Link to="/onboarding">
                <Button className="bg-[hsl(var(--primary))] hover:brightness-110 gap-2" data-testid="start-onboarding-button">
                  <Dna size={16} /> Start Quiz
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : tasteDNA?.initialized ? (
          <Card className="glass-card border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Dna size={18} /> Your Taste DNA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Genre Distribution */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Film size={14} /> Top Genres
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={tasteDNA.taste_profile.top_genres} layout="horizontal">
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="genre" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`${value}%`, 'Preference']}
                      />
                      <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                        {tasteDNA.taste_profile.top_genres.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${252 - index * 20}, 83%, 58%)`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Mood Radar */}
                {tasteDNA.taste_profile.top_moods.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Sparkles size={14} /> Mood Preferences
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <RadarChart data={tasteDNA.taste_profile.top_moods}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis
                          dataKey="mood"
                          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                        />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                        <Radar
                          name="Preference"
                          dataKey="weight"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'hsl(var(--card))',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          formatter={(value) => [`${value}%`, 'Preference']}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--primary))]">{tasteDNA.stats.total_watched}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Movies Watched</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--primary))]">{tasteDNA.taste_profile.top_genres.length}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Favorite Genres</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[hsl(var(--primary))]">{tasteDNA.taste_profile.favorite_actors.length}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Favorite Actors</p>
                </div>
                <div className="text-center capitalize">
                  <p className="text-2xl font-bold text-[hsl(var(--primary))]">{tasteDNA.taste_profile.watch_frequency}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Watch Frequency</p>
                </div>
              </div>

              {/* Favorite Actors */}
              {tasteDNA.taste_profile.favorite_actors.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-3">Favorite Actors</h4>
                  <div className="flex flex-wrap gap-2">
                    {tasteDNA.taste_profile.favorite_actors.map((actor, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {actor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Subscription */}
        <Card className="glass-card border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard size={18} /> Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userData.subscription?.status === 'active' ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">Plan</span>
                  <span className="text-sm font-medium capitalize">{userData.subscription.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">Status</span>
                  <Badge className="bg-green-500/15 text-green-400">Active</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">No active subscription</p>
                <Link to="/subscription">
                  <Button size="sm" className="bg-[hsl(var(--primary))] hover:brightness-110" data-testid="profile-subscribe-button">
                    View Plans
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchases */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag size={18} /> Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-4">No purchases yet</p>
            ) : (
              <div className="space-y-3">
                {purchases.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    {p.movie_poster && (
                      <img 
                        src={`${TMDB_IMG}${p.movie_poster}`} 
                        alt="" 
                        className="w-10 h-14 rounded object-cover" 
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=100&h=140&fit=crop';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.movie_title || 'Unknown Movie'}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] capitalize">{p.purchase_type}</Badge>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">${p.amount?.toFixed(2)}</span>
                      </div>
                    </div>
                    {p.expires_at && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                        <Calendar size={10} /> {new Date(p.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
