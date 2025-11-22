// hooks/useAdminTokenExpiration.ts
import { useEffect, useRef } from 'react';

export function useAdminTokenExpiration(
  onExpirationWarning: () => void,
  minutesBeforeExpiration: number = 2
) {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (hasTriggered.current) return;

    const checkAdminTokenExpiration = () => {
      const token = localStorage.getItem('auth-token');

      if (!token) {
        console.log('🛡️ Aucun token trouvé');
        return;
      }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;
        const warningThreshold = minutesBeforeExpiration * 60 * 1000;

        console.log(`🛡️ Token admin: ${Math.round(timeUntilExpiration / 60000)}min restantes`);

        if (timeUntilExpiration <= warningThreshold && timeUntilExpiration > 0) {
          console.log(`🚨 ALERTE: Token admin expire dans ${Math.round(timeUntilExpiration / 60000)}min`);
          hasTriggered.current = true;
          onExpirationWarning();
        }

      } catch (error) {
        console.error('🛡️ Erreur vérification token admin:', error);
      }
    };

    // Vérification immédiate + toutes les 30 secondes
    checkAdminTokenExpiration();
    const interval = setInterval(checkAdminTokenExpiration, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [onExpirationWarning, minutesBeforeExpiration]);
}

