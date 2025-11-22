'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoaderCircleIcon } from 'lucide-react';
import { getSignupSchema, SignupSchemaType } from '../forms/signup-schema';

export default function Page() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] =
    useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean | null>(false);

  const form = useForm<SignupSchemaType>({
    resolver: zodResolver(getSignupSchema()),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirmation: '',
      referralCode: '',
      accept: false,
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await form.trigger();
    if (!result) return;

    try {
      const values = form.getValues();

      setIsProcessing(true);
      setError(null);

      // Séparer le nom en first_name et last_name
      const nameParts = values.name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // Préparer le body avec les champs de base
      const bodyData: any = {
        email: values.email,
        password: values.password,
        first_name: first_name,
        last_name: last_name,
      };

      // Ajouter le code promo si fourni
      if (values.referralCode && values.referralCode.trim() !== '') {
        bodyData.referral_code = values.referralCode.trim();
      }

      const result = await apiFetch('/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyData),
      });

      if (result.response?.ok && result.data.success) {
        setSuccess(true);
        // Rediriger vers la page de vérification OTP après 3 secondes
        setTimeout(() => {
          router.push('/verify-email?email=' + encodeURIComponent(values.email));
        }, 3000);
      } else {
        const errorMessage =
          (result.data as any)?.message ||
          (result.data as any)?.error ||
          'Une erreur est survenue lors de l\'inscription.';
        setError(errorMessage);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <Alert onClose={() => setSuccess(false)}>
        <AlertIcon>
          <Check />
        </AlertIcon>
        <AlertTitle>
          Inscription réussie ! Un code de vérification a été envoyé à votre
          email. Veuillez vérifier votre compte puis{' '}
          <Link
            href="/signin"
            className="text-primary hover:text-primary-darker"
          >
            vous connecter
          </Link>
          .
        </AlertTitle>
      </Alert>
    );
  }

  return (
    <Suspense>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="block w-full space-y-5">
          <div className="space-y-1.5 pb-3">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Créer un compte
            </h1>
          </div>

          {error && (
            <Alert variant="destructive" onClose={() => setError(null)}>
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Votre nom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Votre email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <div className="relative">
                  <Input
                    placeholder="Votre mot de passe"
                    type={passwordVisible ? 'text' : 'password'}
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    mode="icon"
                    size="sm"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute end-0 top-1/2 -translate-y-1/2 h-7 w-7 me-1.5 bg-transparent!"
                    aria-label={
                      passwordVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                    }
                  >
                    {passwordVisible ? (
                      <EyeOff className="text-muted-foreground" />
                    ) : (
                      <Eye className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passwordConfirmation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <div className="relative">
                  <Input
                    type={passwordConfirmationVisible ? 'text' : 'password'}
                    {...field}
                    placeholder="Confirmer votre mot de passe"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    mode="icon"
                    size="sm"
                    onClick={() =>
                      setPasswordConfirmationVisible(
                        !passwordConfirmationVisible,
                      )
                    }
                    className="absolute end-0 top-1/2 -translate-y-1/2 h-7 w-7 me-1.5 bg-transparent!"
                    aria-label={
                      passwordConfirmationVisible
                        ? 'Masquer la confirmation'
                        : 'Afficher la confirmation'
                    }
                  >
                    {passwordConfirmationVisible ? (
                      <EyeOff className="text-muted-foreground" />
                    ) : (
                      <Eye className="text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referralCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code de parrainage (optionnel)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Entrez un code si vous en avez un" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center space-x-2">
            <FormField
              control={form.control}
              name="accept"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex items-center gap-2.5">
                      <Checkbox
                        id="accept"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                      <label
                        htmlFor="accept"
                        className="text-sm leading-none text-muted-foreground"
                      >
                        J&apos;accepte la
                      </label>
                      <Link
                        href="/privacy-policy"
                        target="_blank"
                        className="-ms-0.5 text-sm font-semibold text-foreground hover:text-primary"
                      >
                        Politique de confidentialité
                      </Link>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : null}
              Continuer
            </Button>
          </div>

          <div className="text-sm text-muted-foreground text-center">
            Vous avez déjà un compte ?{' '}
            <Link
              href="/signin"
              className="text-sm text-sm font-semibold text-foreground hover:text-primary"
            >
              Se connecter
            </Link>
          </div>
        </form>
      </Form>
    </Suspense>
  );
}
