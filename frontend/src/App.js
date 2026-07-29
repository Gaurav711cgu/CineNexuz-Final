import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { ClerkProvider, SignIn, SignUp, useUser } from '@clerk/clerk-react';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './lib/auth';
import { ThemeProvider } from './lib/theme';
import { SoundProvider } from './lib/sound';
import SplashScreen from './components/SplashScreen';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import MovieDetailPage from './pages/MovieDetailPage';
import SearchPage from './pages/SearchPage';
import ChatPage from './pages/ChatPage';
import TheatrePage from './pages/TheatrePage';
import SubscriptionPage from './pages/SubscriptionPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import ActorPage from './pages/ActorPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import WatchPartyPage from './pages/WatchPartyPage';
import OnboardingPage from './pages/OnboardingPage';
import LanguagePage from './pages/LanguagePage';
import AllLanguagesPage from './pages/AllLanguagesPage';
import AllGenresPage from './pages/AllGenresPage';
import GenrePage from './pages/GenrePage';
import { PasswordResetPage } from './pages/AuthPages';
import AILabPage from './pages/AILabPage';
import FranchisesPage from './pages/FranchisesPage';
import FranchiseDetailPage from './pages/FranchiseDetailPage';
import InfoPage from './pages/InfoPage';
import StudioPage from './pages/StudioPage';
import { BackendWakeupProvider } from './components/BackendWakeup';
import { MoviePosterWall } from './pages/AuthPages';
import { ProfileProvider, useProfile } from './lib/profileContext';
import { useAuth } from './lib/auth';
import { useLocation } from 'react-router-dom';
import ProfilePickerPage from './pages/ProfilePickerPage';
import ProfileUnlockPage from './pages/ProfileUnlockPage';
import ProfileEditPage from './pages/ProfileEditPage';
import './App.css';

const CLERK_PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

/* ── Clerk Sign-In page — same movie poster wall, Clerk form ─────── */
function ClerkSignInPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <MoviePosterWall />
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-[#07080f]">
        <div className="w-full max-w-md">
          <SignIn
            routing="path"
            path="/auth/login"
            afterSignInUrl="/"
            afterSignUpUrl="/"
            appearance={{
              variables: {
                colorPrimary: '#00E4FF',
                colorBackground: '#0d0d12',
                colorText: '#ffffff',
                colorTextSecondary: 'rgba(255,255,255,0.5)',
                colorInputBackground: 'rgba(255,255,255,0.05)',
                colorInputText: '#ffffff',
                borderRadius: '0.75rem',
                fontFamily: 'Space Grotesk, sans-serif',
              },
              elements: {
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-white font-bold',
                formButtonPrimary: 'bg-[#00E4FF] hover:brightness-110 text-black font-semibold',
                footerActionLink: 'text-[#00E4FF] hover:underline',
                formFieldInput: 'bg-white/5 border border-white/10 text-white',
                dividerLine: 'bg-white/10',
                dividerText: 'text-white/30',
                socialButtonsIconButton: 'bg-white/5 border border-white/10 hover:bg-white/10',
              },
            }}
          />
          <a href="/" className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 mt-5 justify-center transition-colors">
            ← Back to CineNexuz
          </a>
        </div>
      </div>
    </div>
  );
}

function ProfileGuard({ children }) {
  const { isSignedIn, loading: authLoading } = useAuth();
  const { activeProfile, loadingProfiles } = useProfile();
  const location = useLocation();

  if (authLoading || loadingProfiles) {
    return (
      <div className="min-h-screen bg-[#07080f] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  if (isSignedIn && !activeProfile) {
    const isProfilePage = location.pathname.startsWith('/profiles') || location.pathname === '/onboarding';
    if (!isProfilePage) {
      return <Navigate to="/profiles" replace />;
    }
  }

  return children;
}

/* ── Clerk Sign-Up page ──────────────────────────────────────────── */
function ClerkSignUpPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <MoviePosterWall />
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-[#07080f]">
        <div className="w-full max-w-md">
          <SignUp
            routing="path"
            path="/auth/signup"
            afterSignUpUrl="/"
            afterSignInUrl="/"
            appearance={{
              variables: {
                colorPrimary: '#00E4FF',
                colorBackground: '#0d0d12',
                colorText: '#ffffff',
                colorTextSecondary: 'rgba(255,255,255,0.5)',
                colorInputBackground: 'rgba(255,255,255,0.05)',
                colorInputText: '#ffffff',
                borderRadius: '0.75rem',
                fontFamily: 'Space Grotesk, sans-serif',
              },
              elements: {
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-white font-bold',
                formButtonPrimary: 'bg-[#00E4FF] hover:brightness-110 text-black font-semibold',
                footerActionLink: 'text-[#00E4FF] hover:underline',
                formFieldInput: 'bg-white/5 border border-white/10 text-white',
                dividerLine: 'bg-white/10',
                dividerText: 'text-white/30',
                socialButtonsIconButton: 'bg-white/5 border border-white/10 hover:bg-white/10',
              },
            }}
          />
          <a href="/" className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 mt-5 justify-center transition-colors">
            ← Back to CineNexuz
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [splashComplete, setSplashComplete] = useState(false);

  // If no Clerk key configured, show a helpful warning in dev
  if (!CLERK_PUBLISHABLE_KEY) {
    console.warn('[CineNexuz] REACT_APP_CLERK_PUBLISHABLE_KEY not set — auth will not work');
  }

  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY || 'pk_test_placeholder'}
      navigate={(to) => window.location.assign(to)}
    >
      <BackendWakeupProvider>
        <BrowserRouter>
          <ThemeProvider>
            <SoundProvider>
              <AuthProvider>
                <ProfileProvider>
                  {!splashComplete && <SplashScreen onComplete={() => setSplashComplete(true)} />}

                  <Routes>
                    {/* ── Clerk auth routes ── */}
                    <Route path="/auth/login/*" element={<ClerkSignInPage />} />
                    <Route path="/auth/signup/*" element={<ClerkSignUpPage />} />
                    <Route path="/auth/reset" element={<PasswordResetPage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />

                    {/* ── Profile selection routes ── */}
                    <Route path="/profiles" element={<ProfilePickerPage />} />
                    <Route path="/profiles/unlock" element={<ProfileUnlockPage />} />
                    <Route path="/profiles/edit" element={<ProfileEditPage />} />

                    {/* ── App routes with sidebar ── */}
                    <Route element={<ProfileGuard><AppLayout /></ProfileGuard>}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/discover" element={<DiscoverPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/movie/:id" element={<MovieDetailPage />} />
                    <Route path="/actor/:id" element={<ActorPage />} />
                    <Route path="/language/:code" element={<LanguagePage />} />
                    <Route path="/languages" element={<AllLanguagesPage />} />
                    <Route path="/genre/:genre" element={<GenrePage />} />
                    <Route path="/genres" element={<AllGenresPage />} />
                    <Route path="/chat" element={<ChatPage />} />
                    <Route path="/theatre" element={<TheatrePage />} />
                    <Route path="/watchparty" element={<WatchPartyPage />} />
                    <Route path="/subscription" element={<SubscriptionPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/ai-lab" element={<AILabPage />} />
                    <Route path="/franchises" element={<FranchisesPage />} />
                    <Route path="/franchise/:id" element={<FranchiseDetailPage />} />
                    <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                    {/* Info pages */}
                    <Route path="/about" element={<InfoPage />} />
                    <Route path="/careers" element={<InfoPage />} />
                    <Route path="/press" element={<InfoPage />} />
                    <Route path="/blog" element={<InfoPage />} />
                    <Route path="/help" element={<InfoPage />} />
                    <Route path="/feedback" element={<InfoPage />} />
                    <Route path="/terms" element={<InfoPage />} />
                    <Route path="/privacy" element={<InfoPage />} />
                    <Route path="/faq" element={<InfoPage />} />
                    <Route path="/studio/:id" element={<StudioPage />} />
                    <Route path="*" element={<InfoPage />} />
                  </Route>
                </Routes>
                <Toaster position="bottom-right" richColors />
                </ProfileProvider>
              </AuthProvider>
            </SoundProvider>
          </ThemeProvider>
        </BrowserRouter>
      </BackendWakeupProvider>
    </ClerkProvider>
  );
}

export default App;
