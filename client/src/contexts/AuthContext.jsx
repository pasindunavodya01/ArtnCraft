import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebaseConfig.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import api, { setAuthToken } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUserChange = async (currentUser) => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          localStorage.setItem('ecommerce-api-token', token);
          setAuthToken(token);
        } catch (err) {
          console.error('Failed to get Firebase ID token:', err);
        }

        const storedRole = localStorage.getItem(`role:${currentUser.email}`);
        let resolvedRole = storedRole || 'customer';

        if (!storedRole) {
          try {
            const response = await api.get('/auth/me');
            resolvedRole = response.data.user?.role || 'customer';
            localStorage.setItem(`role:${currentUser.email}`, resolvedRole);
          } catch (err) {
            console.warn('Unable to fetch role from /auth/me:', err);
            if (err.response?.status === 404) {
              await signOut(auth);
              setUser(null);
              setRole('customer');
              localStorage.removeItem('ecommerce-api-token');
              setAuthToken(null);
              setLoading(false);
              return;
            }
          }
        }

        setUser({ uid: currentUser.uid, email: currentUser.email, name: currentUser.displayName || 'Guest' });
        setRole(resolvedRole);
      } else {
        setUser(null);
        setRole('customer');
        localStorage.removeItem('ecommerce-api-token');
        setAuthToken(null);
      }
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      handleUserChange(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const register = async ({ name, email, password, mobile, role: selectedRole }) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });

    const token = await result.user.getIdToken();
    localStorage.setItem('ecommerce-api-token', token);
    setAuthToken(token);
    localStorage.setItem(`role:${email}`, selectedRole);
    setRole(selectedRole);
    setUser({ uid: result.user.uid, email: result.user.email, name });

    await api.post('/auth/register', { name, email, password, mobile, role: selectedRole });
    return result.user;
  };

  const login = async ({ email, password }) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const token = await result.user.getIdToken();
    localStorage.setItem('ecommerce-api-token', token);
    setAuthToken(token);

    let loginRole = 'customer';
    try {
      const response = await api.get('/auth/me');
      loginRole = response.data.user?.role || 'customer';
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          await api.post('/auth/register', {
            name: result.user.displayName || email.split('@')[0],
            email,
            password,
            mobile: result.user.phoneNumber || '+10000000000',
            role: 'customer'
          });
        } catch (regErr) {
          console.warn('Failed to sync missing user with database:', regErr);
        }
      } else {
        throw err;
      }
    }

    localStorage.setItem(`role:${email}`, loginRole);
    setRole(loginRole);
    setUser({ uid: result.user.uid, email: result.user.email, name: result.user.displayName || 'Guest' });

    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole('customer');
    localStorage.removeItem('ecommerce-api-token');
    setAuthToken(null);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, register, login, logout, updateUserProfile, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
