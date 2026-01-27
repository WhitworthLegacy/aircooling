'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase';
import { Button, Input, Card } from '@/components/ui';
import { Mail, Lock, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Email ou mot de passe incorrect.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-airDark p-4">
      {/* Background gradient accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-airPrimary/20 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-gradient-to-t from-airAccent/10 to-transparent blur-3xl" />
      </div>

      <Card className="relative w-full max-w-md" padding="lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <span className="text-2xl font-bold text-airPrimary tracking-tight">
            Aircooling
          </span>
        </div>

        {/* Title with accent underline */}
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-airDark mb-2">
            <span className="accent-underline">Espace Admin</span>
          </h1>
          <p className="text-airMuted mt-4">
            Connectez-vous pour accéder au tableau de bord.
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<Mail className="w-5 h-5" />}
          />

          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            icon={<Lock className="w-5 h-5" />}
          />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={<LogIn className="w-5 h-5" />}
            className="w-full mt-2"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-airBorder text-center">
          <p className="text-sm text-airMuted">
            Accès réservé au personnel Aircooling
          </p>
        </div>
      </Card>
    </div>
  );
}
