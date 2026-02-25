'use client';

import { useTrees } from '@/hooks/use-trees';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Trees } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { TreeStatus } from '@/types';

export function TreeListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-1" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TreeList() {
  const { trees, loading, error } = useTrees();

  if (loading) {
    return <TreeListSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Hata</AlertTitle>
        <AlertDescription>
          Ağaç verileri yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.
        </AlertDescription>
      </Alert>
    );
  }

  if (trees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg bg-card">
        <Trees className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold">Henüz Taranan Ağaç Yok</h2>
        <p className="text-muted-foreground mt-2">
          İlk dijital ikizinizi oluşturmak için yeni bir tarama başlatın.
        </p>
      </div>
    );
  }
  
  const getStatusVariant = (status: TreeStatus) => {
    switch (status) {
      case 'Tamamlandı':
        return 'default';
      case 'İşleniyor':
        return 'secondary';
      case 'Bekliyor':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trees.map((tree) => (
        <Link href={`/tree/${tree.id}`} key={tree.id} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg">
          <Card className="hover:border-primary transition-colors h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="truncate pr-2">Ağaç {tree.id.substring(0, 6)}</CardTitle>
                <Badge variant={getStatusVariant(tree.status)} className="flex-shrink-0">{tree.status}</Badge>
              </div>
              <CardDescription>
                {tree.timestamp ? format(tree.timestamp.toDate(), "d MMMM yyyy, HH:mm", { locale: tr }) : 'Tarih yok'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {tree.tags && tree.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tree.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
