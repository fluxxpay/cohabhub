import { z } from 'zod';
import { getPasswordSchema } from './password-schema';

export const getChangePasswordSchema = () => {
  return z
    .object({
      newPassword: getPasswordSchema(),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Les mots de passe ne correspondent pas.',
      path: ['confirmPassword'],
    });
};

export type ChangePasswordSchemaType = z.infer<
  ReturnType<typeof getChangePasswordSchema>
>;

export const getChangePasswordApiSchema = () => {
  return z.object({
    token: z.string().nonempty({
      message: 'Un token valide est requis pour changer le mot de passe.',
    }),
    newPassword: getPasswordSchema(),
  });
};

export type ChangePasswordApiSchemaType = z.infer<
  ReturnType<typeof getChangePasswordApiSchema>
>;
