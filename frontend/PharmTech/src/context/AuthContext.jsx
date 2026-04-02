import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    if (token && role && username) {
      setUser({ token, role, username });
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('username', userData.username);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    setUser(null);
  };

  const isAuthenticated = () => !!user;
  const isAdmin = () => user?.role === 'ADMIN';
  const isBiller = () => user?.role === 'BILLER';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated, isAdmin, isBiller }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
