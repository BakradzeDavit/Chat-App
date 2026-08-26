const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

if (import.meta.env.PROD && !configuredApiUrl) {
  throw new Error("VITE_API_URL is required in production");
}

const rawApiUrl = configuredApiUrl || "http://localhost:3000";

export const API_URL = rawApiUrl.replace(/\/$/, "");
