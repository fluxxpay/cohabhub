'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiErrorWarningFill } from '@remixicon/react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
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
import { useAuth } from '@/providers/auth-provider';
import { getSigninSchema, SigninSchemaType } from '../forms/signin-schema';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<SigninSchemaType>({
    resolver: zodResolver(getSigninSchema()),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  async function onSubmit(values: SigninSchemaType) {
    setIsProcessing(true);
    setError(null);

    try {
      const result = await login(values.email, values.password);

      if (result.success) {
        // Attendre un court instant pour que l'utilisateur soit stocké dans le localStorage
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Récupérer le rôle depuis le localStorage (plus fiable que result.role)
        const savedUser = localStorage.getItem('auth-user');
        let userRole = result.role || 'user';
        
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            userRole = userData.role || userRole;
            console.log('🔐 Rôle utilisateur détecté:', userRole);
          } catch (e) {
            console.warn('Erreur lors de la lecture du rôle utilisateur:', e);
          }
        }
        
        // Rediriger selon le rôle de l'utilisateur
        const redirectParam = searchParams.get('redirect');
        let redirectTo = redirectParam || '/dashboard';
        
        // Si l'utilisateur est admin et qu'il n'y a pas de redirection spécifique, aller vers /admin
        if (userRole === 'admin' && !redirectParam) {
          redirectTo = '/admin';
          console.log('🔐 Redirection vers /admin pour l\'administrateur');
        }
        
        router.push(redirectTo);
      } else {
        setError(result.message);
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
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="block w-full space-y-5"
      >
        <div className="space-y-1.5 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            Connexion
          </h1>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertIcon>
              <AlertCircle />
            </AlertIcon>
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}

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
              <div className="flex justify-between items-center gap-2.5">
                <FormLabel>Mot de passe</FormLabel>
                <Link
                  href="/reset-password"
                  className="text-sm font-semibold text-foreground hover:text-primary"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input
                  placeholder="Votre mot de passe"
                  type={passwordVisible ? 'text' : 'password'} // Toggle input type
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  size="sm"
                  onClick={() => setPasswordVisible(!passwordVisible)} // Toggle visibility
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

        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <>
                <Checkbox
                  id="remember-me"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(!!checked)}
                />
                <label
                  htmlFor="remember-me"
                  className="text-sm leading-none text-muted-foreground"
                >
                  Se souvenir de moi
                </label>
              </>
            )}
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
            Continuer
          </Button>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Vous n&apos;avez pas de compte ?{' '}
          <Link
            href="/signup"
            className="text-sm font-semibold text-foreground hover:text-primary"
          >
            S&apos;inscrire
          </Link>
        </p>
      </form>
    </Form>
  );
}
