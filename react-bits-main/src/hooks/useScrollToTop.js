import { useEffect } from 'react';

const useScrollToTop = () => {
  useEffect(() => {
    // Keep the body in a block statement: `window.scrollTo` may return a
    // Promise in newer browsers, and returning it from the effect would make
    // React call it as a cleanup function on unmount and crash.
    window.scrollTo(0, 0);
  }, []);
};

export default useScrollToTop;
