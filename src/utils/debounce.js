/**
 * Debounce utility function
 * Delays the execution of a function until after a specified delay has elapsed
 * since the last time it was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} delay - The delay in milliseconds
 * @param {boolean} immediate - Whether to execute immediately on the leading edge
 * @returns {Function} The debounced function
 */
export function debounce(func, delay, immediate = false) {
  let timeoutId = null
  let lastArgs = null
  let lastThis = null

  const debounced = function (...args) {
    lastArgs = args
    lastThis = this

    const callNow = immediate && !timeoutId

    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      timeoutId = null
      if (!immediate) {
        func.apply(lastThis, lastArgs)
      }
    }, delay)

    // Call immediately if specified
    if (callNow) {
      func.apply(lastThis, lastArgs)
    }
  }

  // Add cancel method to debounced function
  debounced.cancel = function () {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  // Add flush method to execute immediately
  debounced.flush = function () {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
      func.apply(lastThis, lastArgs)
    }
  }

  return debounced
}

/**
 * Throttle utility function
 * Ensures a function is called at most once per specified time period
 * 
 * @param {Function} func - The function to throttle
 * @param {number} delay - The delay in milliseconds
 * @returns {Function} The throttled function
 */
export function throttle(func, delay) {
  let lastCall = 0
  let timeoutId = null

  return function (...args) {
    const now = Date.now()
    const timeSinceLastCall = now - lastCall

    const callFunction = () => {
      lastCall = now
      func.apply(this, args)
    }

    if (timeSinceLastCall >= delay) {
      callFunction()
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      timeoutId = setTimeout(callFunction, delay - timeSinceLastCall)
    }
  }
}