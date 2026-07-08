import { useEffect } from 'react';
import { trackPageView } from './metaPixel';

const RouteAnalytics = () => {
  useEffect(() => {
    const handleRouteChange = () => {
      trackPageView();
    };

    // Track initial page load
    handleRouteChange();

    // Listen for changes in the URL
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return null;
};

export default RouteAnalytics;