'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const ModelViewerComponent = dynamic(
  () => import('./ModelViewerComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full min-h-[300px] bg-slate-100 dark:bg-slate-900 rounded-lg">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Yükleniyor...</span>
      </div>
    )
  }
);

interface ModelViewerProps {
  src: string;
}

export function ModelViewer(props: ModelViewerProps) {
  return <ModelViewerComponent {...props} />;
}
