/**
 * Environment configuration and validation
 * Ensures required environment variables are set
 */

const requiredVars = ['REACT_APP_BACKEND_URL'];

export const validateEnv = () => {
  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
};

export const config = {
  apiUrl: process.env.REACT_APP_BACKEND_URL,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export default config;
