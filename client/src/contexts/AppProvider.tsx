import type { ReactNode } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { AuthProvider } from './AuthContext';
import { TripProvider } from './TripContext';
import { NavigationProvider } from './NavigationContext';
import { UIProvider } from './UIContext';

/** Nests the app's state providers. Motion respects the OS reduced-motion setting. */
export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
      <AuthProvider>
        <TripProvider>
          <NavigationProvider>
            <UIProvider>{children}</UIProvider>
          </NavigationProvider>
        </TripProvider>
      </AuthProvider>
      </LazyMotion>
    </MotionConfig>
  );
}
