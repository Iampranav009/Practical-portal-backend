/**
 * IntersectionObserver utility for scroll-based animations
 * Adds 'in-view' class when elements come into viewport
 * Uses 15% threshold for better user experience
 */

export const observeInView = (selector = '.js-animate', threshold = 0.15) => {
  // Check if IntersectionObserver is supported
  if (!('IntersectionObserver' in window)) {
    // Fallback: add class immediately if not supported
    document.querySelectorAll(selector).forEach(el => {
      el.classList.add('in-view');
    });
    return;
  }

  // Create observer with options
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          // Unobserve after animation to improve performance
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: threshold,
      rootMargin: '0px 0px -50px 0px' // Start animation slightly before element is fully visible
    }
  );

  // Observe all elements with the selector
  document.querySelectorAll(selector).forEach(el => {
    observer.observe(el);
  });

  return observer;
};

/**
 * Initialize animations on page load
 * Call this immediately for faster loading
 */
export const initScrollAnimations = () => {
  // Initialize immediately - no waiting for DOM ready
  // This ensures animations start as soon as possible
  observeInView();
};

/**
 * Re-initialize animations for dynamically added content
 * Useful for single-page applications
 */
export const reinitScrollAnimations = () => {
  observeInView();
};
