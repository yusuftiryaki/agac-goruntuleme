'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Camera, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase/client';
import { signOut } from 'firebase/auth';

export function Header() {
  const { user } = useAuth();

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
              <path d="M12 22v-8"/><path d="M12 14l-4-4-2 2-2-2"/><path d="M12 14l4-4 2 2 2-2"/><path d="M12 14l-4 4"/><path d="M12 14l4 4"/><path d="M16 4.31a6 6 0 0 0-10 0"/>
            </svg>
            <span className="font-bold">PistachioTwin</span>
          </Link>
        </div>
        
        <nav className="hidden flex-1 items-center justify-end space-x-4 md:flex">
          {user ? (
            <Button onClick={handleSignOut} variant="ghost">
              <LogOut className="mr-2 h-4 w-4" />
              Çıkış Yap
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Giriş Yap
              </Link>
            </Button>
          )}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2 md:hidden">
          {user && (
            <Button asChild size="icon" variant="ghost">
              <Link href="/scan" aria-label="Yeni tarama">
                <Camera className="h-5 w-5" />
              </Link>
            </Button>
          )}
          {user ? (
             <Button onClick={handleSignOut} size="icon" variant="ghost">
                <LogOut className="h-5 w-5" />
             </Button>
          ) : (
            <Button asChild size="icon" variant="ghost">
              <Link href="/login" aria-label="Giriş Yap">
                <LogIn className="h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
