/**
 * App Parameters - Simplified version for Emergent platform
 */

const isNode = typeof window === 'undefined';

const getAppParams = () => {
  return {
    appId: 'paysible',
    apiBaseUrl: process.env.REACT_APP_BACKEND_URL || '',
    fromUrl: isNode ? '' : window.location.href,
  }
}

export const appParams = {
  ...getAppParams()
}
