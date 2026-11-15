/**
 * KRISHIORBIT API Configuration
 * Supports environment variable VITE_API_BASE_URL with fallback to local development server.
 * Normalizes trailing slashes and handles both root and /api base URL formats.
 */

const rawUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').trim().replace(/\/+$/, '');

// Normalize: If VITE_API_BASE_URL was configured with a trailing /api, strip it so API_BASE_URL is always the origin root
export const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl.slice(0, -4) : rawUrl;

export default API_BASE_URL;
