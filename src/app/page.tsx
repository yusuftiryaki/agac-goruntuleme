'use client';

import { Header } from '@/components/layout/Header';
import { TreeList, TreeListSkeleton } from '@/components/dashboard/TreeList';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
       <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Ağaç Paneli</h1>
        <Suspense fallback={<TreeListSkeleton />}>
          <TreeList />
        </Suspense>
      </main>
      <div className="fixed bottom-6 right-6 z-40">
        <Button asChild size="lg" className="rounded-full w-16 h-16 shadow-lg">
          <Link href="/scan" aria-label="Yeni tarama başlat">
            <Plus className="h-8 w-8" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
