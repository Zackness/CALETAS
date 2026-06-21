"use client";

import { useEffect } from "react";

const FIVE_MINUTES = 5 * 60 * 1000;

export function CalendarReminderHeartbeat() {
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await fetch("/api/user/calendar-reminders/poll", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
      } catch {
        // silencioso: es un chequeo en background
      }
    };

    void run();
    const timer = window.setInterval(() => {
      if (cancelled || document.hidden) return;
      void run();
    }, FIVE_MINUTES);

    const onVisible = () => {
      if (!document.hidden) void run();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
