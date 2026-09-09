import API_URL from "../config/api";
import { getToken, clearSession } from "./storage";

const REQUEST_TIMEOUT_MS = 15000;

// ==========================================
// FETCH WITH AUTH + TIMEOUT + 401 HANDLING
// ==========================================
export const fetchWithAuth = async (endpoint, options = {}) => {
  const token = await getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 401/403 — token expired atau invalid
    if (response.status === 401 || response.status === 403) {
      await clearSession();
      throw new Error("SESSION_EXPIRED");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request gagal (${response.status})`);
    }

    if (response.status === 204) return null;

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("Request timeout. Periksa koneksi internet Anda.");
    }

    throw error;
  }
};

// ==========================================
// HELPERS
// ==========================================
export const formatRupiah = (amount) => {
  if (!amount) return "Rp 0";
  const num = typeof amount === "string" ? parseInt(amount.replace(/\D/g, ""), 10) : amount;
  return `Rp ${num.toLocaleString("id-ID")}`;
};

export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",
  verify: "/verify",
  dashboard: "/dashboard",
  booking: "/booking",
  riwayat: "/riwayatservice",
};
