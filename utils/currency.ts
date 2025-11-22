// Taux de conversion EUR vers XOF (CFA)
const EUR_TO_XOF_RATE = 655.957;

/**
 * Convertit un montant en euros vers le CFA (XOF)
 * @param euros - Montant en euros
 * @returns Montant en CFA
 */
export const convertEurToXof = (euros: number): number => {
  return Math.round(euros * EUR_TO_XOF_RATE);
};

/**
 * Formate un montant en CFA avec le symbole XOF
 * @param amount - Montant en CFA
 * @returns Montant formaté avec le symbole XOF
 */
export const formatXof = (amount: number): string => {
  return `${amount.toLocaleString('fr-FR')} XOF`;
};

/**
 * Formate un montant en CFA avec le symbole XOF pour les petits montants
 * @param amount - Montant en CFA
 * @returns Montant formaté avec le symbole XOF
 */
export const formatXofCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M XOF`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}k XOF`;
  }
  return `${amount.toLocaleString('fr-FR')} XOF`;
};

/**
 * Convertit et formate un montant d'euros vers CFA
 * @param euros - Montant en euros
 * @returns Montant en CFA formaté
 */
export const convertAndFormatEurToXof = (euros: number): string => {
  const xofAmount = convertEurToXof(euros);
  return formatXof(xofAmount);
};

/**
 * Convertit et formate un montant d'euros vers CFA (format compact)
 * @param euros - Montant en euros
 * @returns Montant en CFA formaté (compact)
 */
export const convertAndFormatEurToXofCompact = (euros: number): string => {
  const xofAmount = convertEurToXof(euros);
  return formatXofCompact(xofAmount);
};

/**
 * Calcule le prix selon la durée et le type d'espace
 * @param space - Espace avec ses prix
 * @param duration - Durée en heures
 * @param options - Options supplémentaires (parking, etc.)
 * @returns Prix calculé en CFA
 */
export const calculateSpacePrice = (
  space: any, 
  duration: number, 
  options: { parking?: boolean } = {}
): number => {
  let basePrice = 0;
  
  // Calcul selon la durée
  if (duration <= 3 && space.price.hourly) {
    // Tarif horaire (1-3h)
    basePrice = space.price.hourly * duration;
  } else if (duration <= 8 && space.price.halfDay) {
    // Tarif demi-journée (4-8h)
    basePrice = space.price.halfDay;
  } else if (space.price.fullDay) {
    // Tarif journée complète (8h+)
    basePrice = space.price.fullDay;
  }
  
  // Options supplémentaires
  if (options.parking && space.options?.parking?.available) {
    basePrice += space.options.parking.price;
  }
  
  return basePrice;
};

/**
 * Formate le prix affiché selon le type d'espace
 * @param space - Espace
 * @param duration - Durée en heures
 * @returns Prix formaté avec période
 */
export const formatSpacePrice = (space: any, duration?: number): string => {
  if (space.type === 'hebergement') {
    // Pour les appartements, afficher le prix par nuit
    return `${formatXof(space.price.nightly || 0)}/nuit`;
  }
  
  if (duration) {
    const price = calculateSpacePrice(space, duration);
    return `${formatXof(price)}`;
  }
  
  // Prix par défaut (horaire)
  return `${formatXof(space.price.hourly || 0)}/h`;
};

