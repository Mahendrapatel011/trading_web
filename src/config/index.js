// src/config/index.js

const config = {
    // API Base URL - uses environment variable or fallback
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
    
    // App Name
    APP_NAME: import.meta.env.VITE_APP_NAME || 'Reservation System',
    
    // Environment checks
    IS_PRODUCTION: import.meta.env.PROD,
    IS_DEVELOPMENT: import.meta.env.DEV,
    
    // Mode (development/production)
    MODE: import.meta.env.MODE,
  }
  
  // Debug log in development only
  if (config.IS_DEVELOPMENT) {
    console.log('🔧 App Config:', {
      API_BASE_URL: config.API_BASE_URL,
      APP_NAME: config.APP_NAME,
      MODE: config.MODE
    })
  }
  
  export default config