export interface DailyUsage {
  date: string; // YYYY-MM-DD
  promptsUsed: number;
  tokensUsed: number;
  lastResetTimestamp: number;
}

const USAGE_STORAGE_KEY = "autognosis_daily_usage";

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getDailyUsage(): DailyUsage {
  if (typeof window === "undefined") {
    return {
      date: getTodayString(),
      promptsUsed: 0,
      tokensUsed: 0,
      lastResetTimestamp: Date.now(),
    };
  }

  const todayStr = getTodayString();
  const raw = localStorage.getItem(USAGE_STORAGE_KEY);

  if (!raw) {
    const initial: DailyUsage = {
      date: todayStr,
      promptsUsed: 0,
      tokensUsed: 0,
      lastResetTimestamp: Date.now(),
    };
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed: DailyUsage = JSON.parse(raw);

    // If date has rolled over past 00:00, reset tokens and prompts
    if (parsed.date !== todayStr) {
      const resetUsage: DailyUsage = {
        date: todayStr,
        promptsUsed: 0,
        tokensUsed: 0,
        lastResetTimestamp: Date.now(),
      };
      localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(resetUsage));
      window.dispatchEvent(new Event("autognosis_usage_updated"));
      return resetUsage;
    }

    return parsed;
  } catch (e) {
    const fallback: DailyUsage = {
      date: todayStr,
      promptsUsed: 0,
      tokensUsed: 0,
      lastResetTimestamp: Date.now(),
    };
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

export function recordPromptUsage(estimatedTokens: number = 180): DailyUsage {
  const current = getDailyUsage();
  const updated: DailyUsage = {
    ...current,
    promptsUsed: current.promptsUsed + 1,
    tokensUsed: current.tokensUsed + estimatedTokens,
  };

  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(updated));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("autognosis_usage_updated"));
  }
  return updated;
}

export function resetDailyUsageManual(): DailyUsage {
  const todayStr = getTodayString();
  const resetUsage: DailyUsage = {
    date: todayStr,
    promptsUsed: 0,
    tokensUsed: 0,
    lastResetTimestamp: Date.now(),
  };
  localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(resetUsage));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("autognosis_usage_updated"));
  }
  return resetUsage;
}

export function getTimeUntilMidnight(): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);

  const diffMs = tomorrow.getTime() - now.getTime();
  const totalSec = Math.max(0, Math.floor(diffMs / 1000));

  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { hours, minutes, seconds, formatted };
}

export function getPlanLimits(planName: string = "Starter") {
  const normalized = planName.toLowerCase();

  if (normalized.includes("pro")) {
    return {
      name: "Pro Fleet",
      promptLimit: "Unlimited",
      maxVehicles: 50,
      isUnlimited: true,
      badgeColor: "emerald",
    };
  }

  if (normalized.includes("enterprise")) {
    return {
      name: "Enterprise",
      promptLimit: "Unlimited",
      maxVehicles: "Unlimited",
      isUnlimited: true,
      badgeColor: "ion",
    };
  }

  return {
    name: "Starter",
    promptLimit: 100,
    maxVehicles: 5,
    isUnlimited: false,
    badgeColor: "plasma",
  };
}
