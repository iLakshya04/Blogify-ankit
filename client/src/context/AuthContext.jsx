import { createContext, useCallback, useContext, useEffect, useState } from "react";
import client, {
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(getStoredToken()));

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token = getStoredToken();
      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const { data } = await client.get("/auth/me");
        if (active) setUser(data);
      } catch {
        clearStoredToken();
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    verifySession();

    const handleUnauthorized = () => {
      if (active) setUser(null);
    };
    window.addEventListener("blogify:unauthorized", handleUnauthorized);

    return () => {
      active = false;
      window.removeEventListener("blogify:unauthorized", handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await client.post("/auth/login", credentials);
    setStoredToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (payload) => {
    const { data } = await client.post("/auth/signup", payload);
    setStoredToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2]">
          <div
            className="h-6 w-6 rounded-full border-2 border-stone-300 border-t-[#121316] animate-spin"
            aria-label="Loading session"
          />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
