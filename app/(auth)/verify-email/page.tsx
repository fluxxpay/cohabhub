'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Check } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoaderCircleIcon } from 'lucide-react';

export default function Page() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const emailParam = searchParams?.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      setError('Email manquant. Veuillez recommencer l\'inscription.');
    }
  }, [searchParams]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasted)) return;
    const newOtp = pasted.split('');
    setOtp(newOtp);
    newOtp.forEach((digit, i) => {
      if (inputRefs.current[i]) {
        inputRefs.current[i]!.value = digit;
      }
    });
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async () => {
    if (!email) {
      setError('Email manquant.');
      return;
    }

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Veuillez entrer le code OTP complet (6 chiffres).');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await apiFetch('/api/auth/verify_otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });

      // apiFetch retourne { response, data }
      if (typeof result.data === 'string') {
        setError('Erreur serveur. Veuillez réessayer.');
        return;
      }

      const { response, data } = result;

      if (response?.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        setError(data.message || data.error || 'Échec de la vérification.');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!email) {
    return (
      <Suspense>
        <div className="w-full space-y-6">
          <h1 className="text-2xl font-semibold">Vérification OTP</h1>
          {error && (
            <>
              <Alert variant="destructive">
                <AlertIcon>
                  <AlertCircle />
                </AlertIcon>
                <AlertTitle>{error}</AlertTitle>
              </Alert>
              <Button asChild>
                <Link href="/signup">Retour à l'inscription</Link>
              </Button>
            </>
          )}
        </div>
      </Suspense>
    );
  }

  return (
    <Suspense>
      <div className="w-full space-y-6">
        <div className="text-center space-y-1 pb-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Vérification OTP
          </h1>
          <p className="text-sm text-muted-foreground">
            Un code de vérification à 6 chiffres a été envoyé à{' '}
            <span className="font-semibold">{email}</span>
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
          <Alert onClose={() => setSuccess(false)}>
            <AlertIcon>
              <Check />
            </AlertIcon>
            <AlertTitle>OTP vérifié avec succès, compte activé !</AlertTitle>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Code OTP (6 chiffres)
            </label>
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, i)}
                  onPaste={handlePaste}
                  maxLength={1}
                  className="w-12 h-12 text-xl text-center"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  disabled={isProcessing || success}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isProcessing || success}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <LoaderCircleIcon className="animate-spin mr-2" />
                Vérification...
              </>
            ) : (
              'Vérifier le code'
            )}
          </Button>

          <Button type="button" variant="outline" className="w-full" asChild>
            <Link href="/signin">Retour à la connexion</Link>
          </Button>
        </div>
      </div>
    </Suspense>
  );
}
