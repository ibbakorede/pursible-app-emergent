/**
 * App Parameters - Simplified version for Emergent platform
 */

const isNode = typeof window === 'undefined';

const getAppParams = () => {
  return {
    appId: 'pursible',
    apiBaseUrl: import.meta.env.VITE_BACKEND_URL || '',
    fromUrl: isNode ? '' : window.location.href,
  }
}

export const appParams = {
  ...getAppParams()
}
