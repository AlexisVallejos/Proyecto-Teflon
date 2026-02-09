/**
 * Simple navigation utility for SPA routing without hashes.
 * @param {string} path - The path to navigate to (e.g., '/admin')
 */
export const navigate = (path) => {
    const nextPath = path.startsWith('#') ? `${window.location.pathname}${path}` : path;
    window.history.pushState({}, '', nextPath);
    window.dispatchEvent(new Event('navigate'));

    const hashIndex = nextPath.indexOf('#');
    if (hashIndex !== -1) {
        const hash = nextPath.slice(hashIndex + 1);
        if (hash) {
            const scrollToHash = (attempts = 0) => {
                const target = document.getElementById(hash);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    return;
                }
                if (attempts < 20) {
                    window.requestAnimationFrame(() => scrollToHash(attempts + 1));
                } else {
                    window.scrollTo(0, 0);
                }
            };
            scrollToHash();
            return;
        }
    }

    window.scrollTo(0, 0);
};
