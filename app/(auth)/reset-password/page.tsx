'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { RecaptchaPopover } from '@/components/common/recaptcha-popover';

export default function Page() {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [showRecaptcha, setShowRecaptcha] = useState(false);

  const formSchema = z.object({
    email: z.string().email({ message: 'Veuillez entrer une adresse email valide.' }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = await form.trigger();
    if (!result) return;

    setShowRecaptcha(true);
  };

  const handleVerifiedSubmit = async (token: string) => {
    try {
      const values = form.getValues();

      setIsProcessing(true);
      setError(null);
      setSuccess(null);
      setShowRecaptcha(false);

      const result = await apiFetch('/api/auth/password_reset_request/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-recaptcha-token': token,
        },
        body: JSON.stringify({ email: values.email }),
      });

      // apiFetch retourne { response, data }
      if (typeof result.data === 'string') {
        setError('Erreur serveur. Veuillez réessayer.');
        return;
      }

      const { response, data } = result;

      if (response?.ok && data.success) {
        setSuccess(data.message || 'Email de réinitialisation envoyé si le compte existe.');
        form.reset();
      } else {
        setError(data.message || data.error || 'Une erreur est survenue.');
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

  return (
    <Suspense>
      <Form {...form}>
        <form onSubmit={handleSubmit} className="block w-full space-y-5">
          <div className="text-center space-y-1 pb-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              Réinitialiser le mot de passe
            </h1>
            <p className="text-sm text-muted-foreground">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" onClose={() => setError(null)}>
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          )}

          {success && (
            <Alert onClose={() => setSuccess(null)}>
              <AlertIcon>
                <Check />
              </AlertIcon>
              <AlertTitle>{success}</AlertTitle>
            </Alert>
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Entrez votre adresse email"
                    disabled={!!success || isProcessing}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <RecaptchaPopover
            open={showRecaptcha}
            onOpenChange={(open) => {
              if (!open) {
                setShowRecaptcha(false);
              }
            }}
            onVerify={handleVerifiedSubmit}
            trigger={
              <Button
                type="submit"
                disabled={!!success || isProcessing}
                className="w-full"
              >
                {isProcessing ? <LoaderCircleIcon className="animate-spin" /> : null}
                Envoyer
              </Button>
            }
          />

          <div className="space-y-3">
            <Button type="button" variant="outline" className="w-full" asChild>
              <Link href="/signin">
                <ArrowLeft className="size-3.5" /> Retour
              </Link>
            </Button>
          </div>
        </form>
      </Form>
    </Suspense>
  );
}
