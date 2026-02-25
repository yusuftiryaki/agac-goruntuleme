import { Header } from '@/components/layout/Header';
import { VideoRecorder } from '@/components/scan/VideoRecorder';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ScanPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="container flex-1 py-8 flex flex-col items-center">
          <div className="w-full max-w-lg mb-6">
            <Button asChild variant="ghost">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Panele Geri Dön
              </Link>
            </Button>
          </div>
          <div className="flex flex-col items-center w-full">
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-center">Yeni Tarama</h1>
              <p className="text-muted-foreground mb-6 text-center max-w-md">Ağacın etrafında yavaşça yürüyerek yaklaşık 30 saniyelik bir video kaydedin.</p>
              <VideoRecorder />
          </div>
      </main>
    </div>
  );
}
