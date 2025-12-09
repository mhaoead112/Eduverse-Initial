// API Configuration
// Uses environment variables with production fallback for Vercel deployments

const isProduction = import.meta.env.PROD;
const productionAPI = 'https://eduverse-initial.onrender.com';
const productionWS = 'wss://eduverse-initial.onrender.com';

export const API_URL = import.meta.env.VITE_API_URL || (isProduction ? productionAPI : 'http://localhost:3001');
export const WS_URL = import.meta.env.VITE_WS_URL || (isProduction ? productionWS : 'ws://localhost:3001');

// Helper function to build API endpoints
export const apiEndpoint = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};

// Helper function to build full URLs for resources
export const assetUrl = (path: string): string => {
  if (!path) return '';
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};
