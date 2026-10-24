import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  GoogleAuthProvider,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  checkIsAdmin,
  handleFirestoreError,
  OperationType,
  getCachedAccessToken,
  setCachedAccessToken,
} from '../firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  accessToken: string | null;
  isEmailVerified: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  checkEmailVerified: () => Promise<boolean>;
  connectGoogleDrive: () => Promise<string>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);

  const fetchOrCreateProfile = async (user: User): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', user.uid);
    const userEmail = user.email || '';
    const isAdminUser = checkIsAdmin(userEmail);

    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        // If user is designated admin, elevate role
        if (isAdminUser && data.role !== 'admin') {
          const updated: UserProfile = { ...data, role: 'admin' };
          await setDoc(userDocRef, { role: 'admin', updatedAt: new Date().toISOString() }, { merge: true });
          setUserProfile(updated);
          return updated;
        }
        setUserProfile(data);
        return data;
      } else {
        const defaultRole: UserRole = isAdminUser ? 'admin' : 'project_manager';
        const newProfile: UserProfile = {
          uid: user.uid,
          email: userEmail,
          displayName: user.displayName || userEmail.split('@')[0] || 'User',
          photoURL: user.photoURL || undefined,
          role: defaultRole,
          organization: 'Godongwane Progressive Projects',
          createdAt: new Date().toISOString(),
        };

        await setDoc(userDocRef, newProfile);

        // Also register in admins collection if designated admin
        if (isAdminUser) {
          try {
            await setDoc(doc(db, 'admins', user.uid), {
              email: userEmail,
              addedAt: new Date().toISOString(),
            });
          } catch (e) {
            console.warn('Could not auto-add admin doc', e);
          }
        }

        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsEmailVerified(user.emailVerified);
        try {
          await fetchOrCreateProfile(user);
        } catch (err: any) {
          console.error('Error fetching profile:', err);
          setError(err.message || 'Error loading profile');
        }
      } else {
        setUserProfile(null);
        setCachedAccessToken(null);
        setAccessToken(null);
        setIsEmailVerified(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
        setAccessToken(credential.accessToken);
      }
      setIsEmailVerified(result.user.emailVerified);
      await fetchOrCreateProfile(result.user);
    } catch (err: any) {
      console.error('Google Sign-in failed', err);
      setError(err.message || 'Google sign-in failed');
      throw err;
    }
  };

  const connectGoogleDrive = async (): Promise<string> => {
    setError(null);
    try {
      const current = getCachedAccessToken();
      if (current) {
        setAccessToken(current);
        return current;
      }
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Google Drive access token could not be obtained.');
      }
      setCachedAccessToken(credential.accessToken);
      setAccessToken(credential.accessToken);
      setIsEmailVerified(result.user.emailVerified);
      await fetchOrCreateProfile(result.user);
      return credential.accessToken;
    } catch (err: any) {
      console.error('Google Drive connection failed', err);
      setError(err.message || 'Google Drive connection failed');
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setIsEmailVerified(result.user.emailVerified);
      await fetchOrCreateProfile(result.user);
    } catch (err: any) {
      console.error('Email sign-in failed', err);
      setError(err.message || 'Email sign-in failed');
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await updateProfile(result.user, { displayName: name.trim() });
      }
      // Send Firebase Email Verification
      try {
        await sendEmailVerification(result.user);
      } catch (e) {
        console.warn('Could not send initial verification email:', e);
      }
      setIsEmailVerified(result.user.emailVerified);
      await fetchOrCreateProfile(result.user);
    } catch (err: any) {
      console.error('Registration failed', err);
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No user currently authenticated');
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err: any) {
      console.error('Failed to send verification email', err);
      setError(err.message || 'Failed to send verification email');
      throw err;
    }
  };

  const checkEmailVerified = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    try {
      await reload(auth.currentUser);
      const verified = auth.currentUser.emailVerified;
      setIsEmailVerified(verified);
      return verified;
    } catch (err: any) {
      console.error('Failed to reload user verification status', err);
      return false;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      console.error('Password reset failed', err);
      setError(err.message || 'Password reset failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCachedAccessToken(null);
      setAccessToken(null);
      setUserProfile(null);
      setCurrentUser(null);
      setIsEmailVerified(false);
    } catch (err: any) {
      console.error('Logout failed', err);
      setError(err.message || 'Logout failed');
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      await fetchOrCreateProfile(currentUser);
    }
  };

  const updateUserProfileData = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updated = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, updated, { merge: true });
      if (data.displayName) {
        try {
          await updateProfile(currentUser, { displayName: data.displayName });
        } catch (e) {
          console.warn('Could not update Firebase Auth profile displayName', e);
        }
      }
      setUserProfile((prev) => (prev ? { ...prev, ...updated } : (updated as UserProfile)));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const isAdmin = Boolean(
    (currentUser?.email && checkIsAdmin(currentUser.email)) ||
    userProfile?.role === 'admin'
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        error,
        accessToken,
        isEmailVerified,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        resetPassword,
        sendVerificationEmail,
        checkEmailVerified,
        connectGoogleDrive,
        logout,
        clearError: () => setError(null),
        refreshProfile,
        updateUserProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
