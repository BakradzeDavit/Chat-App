const rawApiUrl = import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000";

export const API_URL = rawApiUrl.replace(/\/$/, "");
