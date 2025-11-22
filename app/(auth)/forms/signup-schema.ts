import { z } from 'zod';
import { getPasswordSchema } from './password-schema';

export const getSignupSchema = () => {
  return z
    .object({
      name: z
        .string()
        .min(2, { message: 'Le nom doit contenir au moins 2 caractères.' })
        .min(1, { message: 'Le nom est requis.' }),
      email: z
        .string()
        .email({ message: 'Veuillez entrer une adresse email valide.' })
        .min(1, { message: 'L\'email est requis.' }),
      password: getPasswordSchema(), // Uses the updated password schema with direct messages
      passwordConfirmation: z.string().min(1, {
        message: 'La confirmation du mot de passe est requise.',
      }),
      accept: z.boolean().refine((val) => val === true, {
        message: 'Vous devez accepter les conditions générales.',
      }),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: 'Les mots de passe ne correspondent pas.',
      path: ['passwordConfirmation'],
    });
};

export type SignupSchemaType = z.infer<ReturnType<typeof getSignupSchema>>;
