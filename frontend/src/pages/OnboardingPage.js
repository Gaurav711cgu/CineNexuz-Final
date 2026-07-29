import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { onboardingAPI, moviesAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { Film, Heart, Sparkles, User, Check, ArrowRight, ArrowLeft, Smile, Activity, Brain, Skull, Frown, Compass } from 'lucide-react';

const GENRE_OPTIONS = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
  'Mystery', 'Romance', 'Science Fiction', 'TV Movie', 'Thriller', 'War', 'Western'
];

const MOOD_OPTIONS = [
  { id: 'happy', label: 'Happy & Uplifting', icon: Smile },
  { id: 'excited', label: 'Excited & Thrilling', icon: Activity },
  { id: 'romantic', label: 'Romantic', icon: Heart },
  { id: 'thoughtful', label: 'Thoughtful & Deep', icon: Brain },
  { id: 'scared', label: 'Scary & Suspenseful', icon: Skull },
  { id: 'sad', label: 'Emotional & Tearful', icon: Frown },
  { id: 'nostalgic', label: 'Nostalgic', icon: Sparkles },
  { id: 'adventurous', label: 'Adventurous', icon: Compass },
];

const FREQUENCY_OPTIONS = [
  { id: 'daily', label: 'Daily', desc: 'I watch movies almost every day' },
  { id: 'weekly', label: 'Weekly', desc: 'A few times a week' },
  { id: 'monthly', label: 'Monthly', desc: 'Once or twice a month' },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedActors, setSelectedActors] = useState([]);
  const [watchFrequency, setWatchFrequency] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [popularActors, setPopularActors] = useState([]);
  const navigate = useNavigate();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  useEffect(() => {
    loadPopularActors();
  }, []);

  async function loadPopularActors() {
    try {
      // Get trending movies to extract popular actors
      const res = await moviesAPI.trending(20);
      const actorSet = new Set();
      res.data.movies.forEach(m => {
        (m.cast_names || []).slice(0, 3).forEach(name => actorSet.add(name));
      });
      setPopularActors([...actorSet].slice(0, 16));
    } catch (err) {
      console.error('Failed to load actors:', err);
    }
  }

  const toggleGenre = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleMood = (moodId) => {
    setSelectedMoods(prev =>
      prev.includes(moodId)
        ? prev.filter(m => m !== moodId)
        : [...prev, moodId]
    );
  };

  const toggleActor = (actor) => {
    setSelectedActors(prev =>
      prev.includes(actor)
        ? prev.filter(a => a !== actor)
        : [...prev, actor]
    );
  };

  const handleNext = () => {
    if (step === 1 && selectedGenres.length === 0) {
      toast.error('Please select at least one genre');
      return;
    }
    if (step === 2 && selectedMoods.length === 0) {
      toast.error('Please select at least one mood');
      return;
    }
    setStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (selectedGenres.length === 0 || selectedMoods.length === 0) {
      toast.error('Please complete all required steps');
      return;
    }

    setLoading(true);
    try {
      await onboardingAPI.submit({
        favorite_genres: selectedGenres,
        favorite_moods: selectedMoods,
        favorite_actors: selectedActors,
        watch_frequency: watchFrequency,
        preferred_language: 'en',
      });
      toast.success('Welcome to CineNexus! Your Taste DNA has been created.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Onboarding failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0B0F1A]">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(900px circle at 20% 10%, rgba(124,58,237,0.22), transparent 55%), radial-gradient(800px circle at 80% 20%, rgba(59,130,246,0.18), transparent 55%)' }} />
        <div className="noise-overlay" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-3xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#00E4FF] flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(0,228,255,0.6)]">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Build Your Taste DNA
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
            Help us understand your preferences to create personalized recommendations
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progress} className="h-2" data-testid="onboarding-progress" />
          <div className="flex justify-between mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Steps */}
        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 1 && <><Film size={20} /> Favorite Genres</>}
              {step === 2 && <><Heart size={20} /> Preferred Moods</>}
              {step === 3 && <><User size={20} /> Favorite Actors</>}
              {step === 4 && <><Sparkles size={20} /> Watch Frequency</>}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Select the genres you enjoy most (choose at least 3)'}
              {step === 2 && 'What kind of mood do you prefer when watching movies?'}
              {step === 3 && 'Pick some actors you love (optional)'}
              {step === 4 && 'How often do you watch movies?'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {/* Step 1: Genres */}
              {step === 1 && (
                <motion.div
                  key="genres"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-h-[300px]"
                  data-testid="onboarding-step-genres"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {GENRE_OPTIONS.map((genre) => {
                      const isSelected = selectedGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          onClick={() => toggleGenre(genre)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-[hsl(var(--primary))]/15 border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-[hsl(var(--foreground))]'
                          }`}
                          data-testid={`genre-option-${genre.toLowerCase().replace(' ', '-')}`}
                        >
                          {isSelected && <Check size={14} className="inline mr-1" />}
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-4">
                    Selected: {selectedGenres.length}
                  </p>
                </motion.div>
              )}

              {/* Step 2: Moods */}
              {step === 2 && (
                <motion.div
                  key="moods"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-h-[300px]"
                  data-testid="onboarding-step-moods"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MOOD_OPTIONS.map((mood) => {
                      const isSelected = selectedMoods.includes(mood.id);
                      const MoodIcon = mood.icon;
                      return (
                        <button
                          key={mood.id}
                          onClick={() => toggleMood(mood.id)}
                          className={`p-4 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-[hsl(var(--primary))]/15 border-[hsl(var(--primary))]'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                          data-testid={`mood-option-${mood.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl text-[hsl(var(--primary))]"><MoodIcon size={24} /></span>
                            <div className="flex-1">
                              <p className="font-medium">{mood.label}</p>
                            </div>
                            {isSelected && <Check size={18} className="text-[hsl(var(--primary))]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-4">
                    Selected: {selectedMoods.length}
                  </p>
                </motion.div>
              )}

              {/* Step 3: Actors */}
              {step === 3 && (
                <motion.div
                  key="actors"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-h-[300px]"
                  data-testid="onboarding-step-actors"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {popularActors.map((actor) => {
                      const isSelected = selectedActors.includes(actor);
                      return (
                        <button
                          key={actor}
                          onClick={() => toggleActor(actor)}
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-[hsl(var(--primary))]/15 border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                              : 'bg-white/5 border-white/10 hover:border-white/20 text-[hsl(var(--foreground))]'
                          }`}
                          data-testid={`actor-option-${actor.toLowerCase().replace(' ', '-')}`}
                        >
                          {isSelected && <Check size={14} className="inline mr-1" />}
                          <span className="truncate">{actor}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-4">
                    Selected: {selectedActors.length} (optional)
                  </p>
                </motion.div>
              )}

              {/* Step 4: Watch Frequency */}
              {step === 4 && (
                <motion.div
                  key="frequency"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="min-h-[300px]"
                  data-testid="onboarding-step-frequency"
                >
                  <div className="space-y-3">
                    {FREQUENCY_OPTIONS.map((freq) => {
                      const isSelected = watchFrequency === freq.id;
                      return (
                        <button
                          key={freq.id}
                          onClick={() => setWatchFrequency(freq.id)}
                          className={`w-full p-4 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'bg-[hsl(var(--primary))]/15 border-[hsl(var(--primary))]'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                          data-testid={`frequency-option-${freq.id}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{freq.label}</p>
                              <p className="text-sm text-[hsl(var(--muted-foreground))]">{freq.desc}</p>
                            </div>
                            {isSelected && <Check size={20} className="text-[hsl(var(--primary))]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-sm font-semibold mb-2">Your Taste DNA Summary:</p>
                    <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                      <div>
                        <strong>Favorite Genres:</strong> {selectedGenres.slice(0, 5).join(', ')}
                        {selectedGenres.length > 5 && ` +${selectedGenres.length - 5} more`}
                      </div>
                      <div>
                        <strong>Preferred Moods:</strong> {selectedMoods.map(id => MOOD_OPTIONS.find(m => m.id === id)?.label).join(', ')}
                      </div>
                      {selectedActors.length > 0 && (
                        <div>
                          <strong>Favorite Actors:</strong> {selectedActors.slice(0, 3).join(', ')}
                          {selectedActors.length > 3 && ` +${selectedActors.length - 3} more`}
                        </div>
                      )}
                      <div>
                        <strong>Watch Frequency:</strong> {FREQUENCY_OPTIONS.find(f => f.id === watchFrequency)?.label}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={step === 1}
                className="gap-2"
                data-testid="onboarding-back-button"
              >
                <ArrowLeft size={16} /> Back
              </Button>

              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="bg-[hsl(var(--primary))] hover:brightness-110 gap-2"
                  data-testid="onboarding-next-button"
                >
                  Next <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-[hsl(var(--primary))] hover:brightness-110 gap-2"
                  data-testid="onboarding-submit-button"
                >
                  {loading ? 'Creating...' : 'Complete Setup'} <Check size={16} />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip option */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
            data-testid="onboarding-skip-button"
          >
            Skip for now
          </button>
        </div>
      </motion.div>
    </div>
  );
}
