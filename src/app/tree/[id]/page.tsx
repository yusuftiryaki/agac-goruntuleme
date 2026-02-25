import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { notFound } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { ModelViewer } from '@/components/tree/ModelViewer';
import type { Tree, TreeStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hourglass } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export const revalidate = 30; // Revalidate every 30 seconds

async function getTreeData(id: string): Promise<Tree | null> {
  try {
    const docRef = doc(db, 'trees', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }
    return { id: docSnap.id, ...docSnap.data() } as Tree;
  } catch (error) {
    console.error("Error fetching tree data:", error);
    return null;
  }
}

const getStatusVariant = (status: TreeStatus) => {
  switch (status) {
    case 'Tamamlandı': return 'default';
    case 'İşleniyor': return 'secondary';
    case 'Bekliyor': return 'outline';
    default: return 'outline';
  }
};


export default async function TreeDetailPage({ params }: { params: { id: string } }) {
  const tree = await getTreeData(params.id);

  if (!tree) {
    notFound();
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Ağaç {tree.id.substring(0, 6)}</CardTitle>
                  <Badge variant={getStatusVariant(tree.status)}>{tree.status}</Badge>
                </div>
                <CardDescription>
                  Kayıt Tarihi: {tree.timestamp ? format(tree.timestamp.toDate(), "d MMMM yyyy, HH:mm", { locale: tr }) : 'Bilinmiyor'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {tree.tags && tree.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Analiz Etiketleri</h3>
                    <div className="flex flex-wrap gap-2">
                      {tree.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                 <div className="text-sm text-muted-foreground">
                    <h3 className="font-semibold mb-2 text-foreground">Video Kaynağı</h3>
                    <a href={tree.video_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                      {tree.video_url}
                    </a>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>3D Model</CardTitle>
              </CardHeader>
              <CardContent className="aspect-square">
                {tree.status === 'Tamamlandı' && tree.model_url ? (
                  <ModelViewer src={tree.model_url} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded-lg text-center p-4">
                    <Hourglass className="w-12 h-12 text-primary mb-4 animate-pulse" />
                    <p className="text-lg font-medium">Model bulutta oluşturuluyor...</p>
                    <p className="text-muted-foreground mt-1 text-sm">Bu işlem biraz zaman alabilir. Sayfa kısa aralıklarla güncellenmektedir.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
