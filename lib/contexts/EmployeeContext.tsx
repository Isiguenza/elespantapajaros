"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: "admin" | "cashier" | "bartender";
  employeeCode: string | null;
}

interface EmployeeSession {
  employee: Employee | null;
  token: string | null;
  lastActivity: number;
}

interface EmployeeContextType {
  session: EmployeeSession | null;
  login: (identifier: string, pin: string) => Promise<boolean>;
  logout: () => void;
  refreshActivity: () => void;
  isSessionValid: () => boolean;
}

const EmployeeContext = createContext<EmployeeContextType | undefined>(undefined);

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export function EmployeeProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<EmployeeSession | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("employee_session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const isValid = Date.now() - parsed.lastActivity < SESSION_DURATION;
        if (isValid) {
          setSession(parsed);
        } else {
          localStorage.removeItem("employee_session");
        }
      } catch (error) {
        console.error("Error loading session:", error);
        localStorage.removeItem("employee_session");
      }
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem("employee_session", JSON.stringify(session));
    } else {
      localStorage.removeItem("employee_session");
    }
  }, [session]);

  const login = async (identifier: string, pin: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/employees/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, pin }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      const newSession: EmployeeSession = {
        employee: data.employee,
        token: data.token,
        lastActivity: Date.now(),
      };

      setSession(newSession);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem("employee_session");
  };

  const refreshActivity = () => {
    if (session) {
      setSession({
        ...session,
        lastActivity: Date.now(),
      });
    }
  };

  const isSessionValid = (): boolean => {
    if (!session) return false;
    const elapsed = Date.now() - session.lastActivity;
    return elapsed < SESSION_DURATION;
  };

  return (
    <EmployeeContext.Provider
      value={{ session, login, logout, refreshActivity, isSessionValid }}
    >
      {children}
    </EmployeeContext.Provider>
  );
}

export function useEmployee() {
  const context = useContext(EmployeeContext);
  if (context === undefined) {
    throw new Error("useEmployee must be used within an EmployeeProvider");
  }
  return context;
}
