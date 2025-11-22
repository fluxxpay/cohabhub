import { z } from 'zod';

export const getSigninSchema = () => {
  return z.object({
    email: z
      .string()
      .email({ message: 'Veuillez entrer une adresse email valide.' })
      .min(1, { message: 'L\'email est requis.' }),
    password: z
      .string()
      .min(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.' })
      .min(1, { message: 'Le mot de passe est requis.' }),
    rememberMe: z.boolean().optional(),
  });
};

export type SigninSchemaType = z.infer<ReturnType<typeof getSigninSchema>>;
