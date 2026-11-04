import { createContext, useContext, useEffect, useState } from "react";
import { fetchMe, getStoredUser, isAuthenticated, logout as apiLogout } from "../services/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }
      try {
        const me = await fetchMe();
        setUser(me);
        localStorage.setItem("user", JSON.stringify(me));
      } catch {
        apiLogout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    boot();
  }, []);

  const loginUser = (userData) => setUser(userData);

  const logoutUser = () => {
    apiLogout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const me = await fetchMe();
      setUser(me);
      localStorage.setItem("user", JSON.stringify(me));
      return me;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logoutUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};