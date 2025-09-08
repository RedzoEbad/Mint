/**
 * Token utility functions for handling JWT tokens
 */

/**
 * Validates if a token has the correct JWT format
 */
export function isValidJWTFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  const tokenParts = token.split('.')
  if (tokenParts.length !== 3) {
    return false
  }

  // Check if token parts are not empty
  if (tokenParts.some(part => part.length === 0)) {
    return false
  }

  return true
}

/**
 * Cleans up malformed tokens from localStorage
 */
export function cleanupMalformedTokens(): void {
  if (typeof window === 'undefined') return

  try {
    const token = localStorage.getItem('auth-token')
    if (token && !isValidJWTFormat(token)) {
      console.warn('Removing malformed token from localStorage')
      localStorage.removeItem('auth-token')
      
      // Also try to clear the httpOnly cookie
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax'
    }
  } catch (error) {
    console.warn('Error cleaning up malformed tokens:', error)
  }
}

/**
 * Gets a valid token from localStorage, cleaning up malformed ones
 */
export function getValidToken(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const token = localStorage.getItem('auth-token')
    if (!token) return null

    if (!isValidJWTFormat(token)) {
      console.warn('Invalid token format detected, cleaning up')
      localStorage.removeItem('auth-token')
      return null
    }

    return token
  } catch (error) {
    console.warn('Error getting valid token:', error)
    return null
  }
}

/**
 * Sets a token in localStorage with validation
 */
export function setValidToken(token: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    if (!isValidJWTFormat(token)) {
      console.warn('Attempted to set invalid token format')
      return false
    }

    localStorage.setItem('auth-token', token)
    return true
  } catch (error) {
    console.warn('Error setting token:', error)
    return false
  }
}
