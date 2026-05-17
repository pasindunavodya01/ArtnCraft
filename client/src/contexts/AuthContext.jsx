import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebaseConfig.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import api, { setAuthToken } from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('ecommerce-api-token');
    if (savedToken) {
      setAuthToken(savedToken);
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const storedRole = localStorage.getItem(`role:${currentUser.email}`) || 'customer';
        setUser({ uid: currentUser.uid, email: currentUser.email, name: currentUser.displayName || 'Guest' });
        setRole(storedRole);
      } else {
        setUser(null);
        setRole('customer');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async ({ name, email, password, role: selectedRole }) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    localStorage.setItem(`role:${email}`, selectedRole);
    setRole(selectedRole);
    setUser({ uid: result.user.uid, email: result.user.email, name });

    const response = await api.post('/auth/register', { name, email, password, role: selectedRole });
    localStorage.setItem('ecommerce-api-token', response.data.token);
    setAuthToken(response.data.token);

    return result.user;
  };

  const login = async ({ email, password }) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const storedRole = localStorage.getItem(`role:${email}`) || 'customer';
    setRole(storedRole);
    setUser({ uid: result.user.uid, email: result.user.email, name: result.user.displayName || 'Guest' });

    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('ecommerce-api-token', response.data.token);
    setAuthToken(response.data.token);

    return result.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setRole('customer');
    localStorage.removeItem('ecommerce-api-token');
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
