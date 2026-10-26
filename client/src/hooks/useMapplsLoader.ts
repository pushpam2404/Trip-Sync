import { useState, useEffect } from 'react';

const SDK_URL = 'https://sdk.mappls.com/map/sdk/web';

/** Loads the Mappls web map SDK once, on the screens that draw a map. */
export function useMapplsLoader() {
  const [isLoaded, setIsLoaded] = useState(() => !!window.mappls);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    if (window.mappls) {
      setIsLoaded(true);
      return;
    }

    const sdkKey = import.meta.env.VITE_MAPPLS_MAP_SDK_KEY;
    if (!sdkKey) {
      setLoadError(new Error('The map key is missing. Set VITE_MAPPLS_MAP_SDK_KEY and rebuild.'));
      return;
    }

    const onLoad = () => setIsLoaded(true);
    const onError = () => setLoadError(new Error('The map failed to load. Check your connection and the SDK key.'));

    let script = document.querySelector<HTMLScriptElement>(`script[src^="${SDK_URL}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = `${SDK_URL}?v=3.0&access_token=${sdkKey}`;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    return () => {
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
    };
  }, []);

  return { isLoaded, loadError };
}
