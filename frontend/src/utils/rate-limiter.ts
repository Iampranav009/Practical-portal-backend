/**
 * Rate Limiter Utility
 * Helps prevent excessive API calls and provides better error handling
 */

interface RateLimitConfig {
  maxCalls: number
  timeWindow: number // in milliseconds
}

class RateLimiter {
  private calls: Map<string, number[]> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig = { maxCalls: 10, timeWindow: 60000 }) {
    this.config = config
  }

  /**
   * Check if a call is allowed for the given key
   * @param key - Unique identifier for the rate limit (e.g., 'profile-check')
   * @returns true if call is allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const now = Date.now()
    const calls = this.calls.get(key) || []
    
    // Remove calls outside the time window
    const validCalls = calls.filter(timestamp => now - timestamp < this.config.timeWindow)
    
    // Check if we're under the limit
    if (validCalls.length >= this.config.maxCalls) {
      return false
    }
    
    // Add current call
    validCalls.push(now)
    this.calls.set(key, validCalls)
    
    return true
  }

  /**
   * Get time until next call is allowed
   * @param key - Unique identifier for the rate limit
   * @returns milliseconds until next call is allowed, 0 if allowed now
   */
  getTimeUntilNextCall(key: string): number {
    const calls = this.calls.get(key) || []
    if (calls.length < this.config.maxCalls) {
      return 0
    }
    
    const oldestCall = Math.min(...calls)
    const timeUntilOldestExpires = (oldestCall + this.config.timeWindow) - Date.now()
    
    return Math.max(0, timeUntilOldestExpires)
  }

  /**
   * Clear rate limit for a specific key
   * @param key - Unique identifier for the rate limit
   */
  clear(key: string): void {
    this.calls.delete(key)
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.calls.clear()
  }
}

// Create a global rate limiter instance for profile checks
export const profileRateLimiter = new RateLimiter({
  maxCalls: 5, // Maximum 5 calls
  timeWindow: 30000 // Per 30 seconds
})

// Create a general API rate limiter
export const apiRateLimiter = new RateLimiter({
  maxCalls: 20, // Maximum 20 calls
  timeWindow: 60000 // Per minute
})

export default RateLimiter
