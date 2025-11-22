import { z } from 'zod';

export const getPasswordSchema = (minLength = 8) => {
  return z
    .string()
    .min(minLength, {
      message: `Le mot de passe doit contenir au moins ${minLength} caractères.`,
    })
    .regex(/[A-Z]/, {
      message: 'Le mot de passe doit contenir au moins une lettre majuscule.',
    })
    .regex(/[a-z]/, {
      message: 'Le mot de passe doit contenir au moins une lettre minuscule.',
    })
    .regex(/\d/, {
      message: 'Le mot de passe doit contenir au moins un chiffre.',
    })
    .regex(/[!@#$%^&*(),.?":{}|<>]/, {
      message: 'Le mot de passe doit contenir au moins un caractère spécial.',
    });
};
