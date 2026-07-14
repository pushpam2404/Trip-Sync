import { useState, useEffect } from 'react';

/**
 * useMapplsLoader — Custom hook to dynamically load the Mappls (MapmyIndia)
 * Web Map SDK script tag into the document body, returning the loading state.
 */
export function useMapplsLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // If window.mappls is already loaded, update status immediately
    if ((window as any).mappls) {
      setIsLoaded(true);
      return;
    }

    const sdkKey = import.meta.env.VITE_MAPPLS_MAP_SDK_KEY;
    if (!sdkKey) {
      setLoadError(new Error('Mappls Map SDK Key is missing in environment variables.'));
      return;
    }

    const scriptUrl = `https://sdk.mappls.com/map/sdk/web?v=3.0&access_token=${sdkKey}`;
    
    // Check if script tag already exists in document
    const existingScript = document.querySelector(`script[src*="sdk.mappls.com/map/sdk/web"]`);
    
    if (existingScript) {
      const handleLoad = () => setIsLoaded(true);
      const handleError = (e: Event) => setLoadError(new Error('Failed to load Mappls SDK script.'));

      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', handleError);

      return () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    script.defer = true;

    const handleScriptLoad = () => {
      setIsLoaded(true);
    };

    const handleScriptError = () => {
      setLoadError(new Error('Failed to load Mappls SDK script. Please check your internet connection and SDK key.'));
    };

    script.addEventListener('load', handleScriptLoad);
    script.addEventListener('error', handleScriptError);

    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleScriptLoad);
      script.removeEventListener('error', handleScriptError);
    };
  }, []);

  return { isLoaded, loadError };
}
export default useMapplsLoader;
