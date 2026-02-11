import { useState, useEffect } from 'react';

export function useAutoHideHeaderOnScroll(threshold: number = 10) {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Only hide/show if we've scrolled past the threshold
      if (Math.abs(currentScrollY - lastScrollY) < threshold) {
        return;
      }

      // Scrolling down (hide header)
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsHeaderHidden(true);
      } 
      // Scrolling up (show header)
      else if (currentScrollY < lastScrollY) {
        setIsHeaderHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, threshold]);

  return isHeaderHidden;
}
