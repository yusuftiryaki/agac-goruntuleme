'use client';

import { Header } from '@/components/layout/Header';
import { TreeList, TreeListSkeleton } from '@/components/dashboard/TreeList';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';

export default function Home() {
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
