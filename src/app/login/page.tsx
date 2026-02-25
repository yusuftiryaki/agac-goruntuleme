'use client';

import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      return;
    }
    const checkRedirect = async () => {
      try {
        setLoading(true);
        await getRedirectResult(auth);
      } catch (error) {
        console.error('Error getting redirect result:', error);
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Firebase Yapılandırılmamış',
        description: 'Uygulama henüz Firebase\'e bağlı değil.',
      });
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
    }
  };
  
  if (authLoading) {
    return (
       <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    redirect('/');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Giriş Yap
          </h1>
          <p className="text-sm text-muted-foreground">
            Devam etmek için Google hesabınızla giriş yapın.
          </p>
        </div>
        <Button onClick={handleGoogleSignIn} variant="outline" type="button" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Google ile Giriş Yap
        </Button>
      </div>
    </div>
  );
}
