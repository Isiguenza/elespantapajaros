"use client";

import { useEffect, useCallback } from "react";
import { useEmployee } from "@/lib/contexts/EmployeeContext";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useInactivity() {
  const { refreshActivity, isSessionValid, logout } = useEmployee();

  const handleActivity = useCallback(() => {
    if (isSessionValid()) {
      refreshActivity();
    }
  }, [isSessionValid, refreshActivity]);

  useEffect(() => {
    // Events that count as activity
    const events = ["mousedown", "keydown", "touchstart", "scroll"];

    // Add listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Check session validity periodically
    const interval = setInterval(() => {
      if (!isSessionValid()) {
        logout();
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(interval);
    };
  }, [handleActivity, isSessionValid, logout]);
}
