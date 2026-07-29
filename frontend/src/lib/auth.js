/**
 * auth.js — Clerk-powered auth layer for CineNexuz
 *
 * Wraps Clerk's useUser / useAuth hooks in the same API surface as the
 * old custom JWT context so ALL existing components work unchanged:
 *   const { user, loading, logout } = useAuth();
 *
 * Additionally exposes clerkUser for components that want Clerk-native data
 * (avatar, emailAddresses, etc.).
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth, useClerk } from '@clerk/clerk-react';
import axios from 'axios';

const AuthContext = createContext(null);

const BACKEND = process.env.REACT_APP_BACKEND_URL || '';

/**
 * Sync a Clerk user into our MongoDB via the backend.
 * Called once after sign-in / sign-up.
 */
async function syncUserToBackend(clerkUser, clerkToken) {
  if (!clerkUser || !clerkToken) return null;
  try {
    const res = await axios.post(
      `${BACKEND}/api/auth/clerk-sync`,
      {
        clerk_id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        avatar: clerkUser.imageUrl,
      },
      { headers: { Authorization: `Bearer ${clerkToken}` } }
    );
    return res.data?.user || null;
  } catch (e) {
    console.warn('[CineNexuz] Backend sync failed:', e.message);
    return null;
  }
}

export function AuthProvider({ children }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { getToken } = useClerkAuth();
  const { signOut } = useClerk();

  const [backendUser, setBackendUser] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Sync to backend whenever Clerk auth state changes
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !clerkUser) {
      setBackendUser(null);
      localStorage.removeItem('cinenexus_token');
      return;
    }

    let cancelled = false;
    setSyncing(true);
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          localStorage.setItem('cinenexus_token', token);
        }
        const dbUser = await syncUserToBackend(clerkUser, token);
        if (!cancelled) setBackendUser(dbUser);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, clerkUser, getToken]);

  /**
   * getAuthToken() — returns a fresh Clerk JWT for backend requests.
   * Attach as: Authorization: Bearer <token>
   */
  const getAuthToken = useCallback(() => getToken(), [getToken]);

  /**
   * logout() — signs out of Clerk (clears session cookies + local state).
   */
  const logout = useCallback(() => signOut(), [signOut]);

  /**
   * Compatibility shim — build a "user" object matching the old custom JWT shape
   * so existing components (ProfilePage, AdminPage, etc.) work without changes.
   */
  const user = isSignedIn
    ? {
        // from Clerk
        id: clerkUser?.id,
        name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim()
          || clerkUser?.username
          || clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0],
        email: clerkUser?.primaryEmailAddress?.emailAddress,
        avatar: clerkUser?.imageUrl,
        // from our backend (subscription info etc.)
        ...(backendUser || {}),
        // admin check — stored in Clerk public metadata or backend
        is_admin: backendUser?.is_admin
          || clerkUser?.publicMetadata?.is_admin
          || false,
      }
    : null;

  const loading = !isLoaded || syncing;

  // Legacy no-ops — kept so old code that calls login/signup doesn't crash.
  // Clerk handles login/signup via its own UI (<SignIn /> / <SignUp />).
  const login = async () => { console.warn('[CineNexuz] Use Clerk UI for login'); };
  const signup = async () => { console.warn('[CineNexuz] Use Clerk UI for signup'); };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        getAuthToken,
        // Expose raw Clerk user for components that need Clerk-native data
        clerkUser: isSignedIn ? clerkUser : null,
        isSignedIn: !!isSignedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
