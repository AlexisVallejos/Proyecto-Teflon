/**
 * Simple navigation utility for SPA routing without hashes.
 * @param {string} path - The path to navigate to (e.g., '/admin')
 */
export const navigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('navigate'));
    window.scrollTo(0, 0);
};
