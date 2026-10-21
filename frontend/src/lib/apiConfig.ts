/**
 * API configuration for AVSAR frontend.
 * Resolves the backend base URL cleanly:
 * - Uses VITE_API_URL if configured (e.g. Render production URL: https://avsar-backend.onrender.com)
 * - In local development, falls back to 127.0.0.1:5000 if VITE_API_URL is unset
 * - In production without VITE_API_URL, uses relative / API path if hosted behind a proxy
 */
const rawUrl =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://127.0.0.1:5000' : '');

export const API_BASE_URL = rawUrl
  .toString()
  .trim()
  .replace(/['"]/g, '')
  .replace(/\/+$/, '');
