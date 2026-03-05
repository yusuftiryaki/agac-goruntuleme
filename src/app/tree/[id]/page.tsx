'use client';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Header } from '@/components/layout/Header';
import { ModelViewer } from '@/components/tree/ModelViewer';
import type { Tree, TreeStatus, TreeMeasurements, BranchAnalysis, ColorAnalysis } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Hourglass, Loader2, Download, QrCode, Ruler, TreePine, CircleDot, Move, Layers, ArrowUpFromDot, GitBranch, Compass, AlertTriangle, Palette, Heart, Leaf, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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
    case 'completed': return 'default';
    case 'processing': return 'secondary';
    case 'pending': return 'outline';
    default: return 'outline';
  }
};


export default function TreeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [tree, setTree] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    if (id) {
      getTreeData(id).then(treeData => {
        if (!treeData) {
          setTree(null);
        } else {
          setTree(treeData);
        }
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
       <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 container py-8 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </main>
      </div>
    )
  }
  
  if (!tree) {
     return (
       <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex-1 container py-8 text-center">
            <h1 className="text-2xl font-bold">Ağaç Bulunamadı</h1>
            <p className="text-muted-foreground">Aradığınız ağaç mevcut değil.</p>
        </main>
      </div>
    )
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
                {tree.qr_code && (
                  <div className="flex items-center gap-2 mt-2">
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">QR Kod: </span>
                    <Badge variant={tree.qr_code === 'unknown' ? 'destructive' : 'outline'}>{tree.qr_code}</Badge>
                  </div>
                )}
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
                    <h3 className="font-semibold mb-2 text-foreground">Video Kaydı</h3>
                    {tree.video_url && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                         {!videoError ? (
                           <video 
                              key={tree.video_url}
                              controls 
                              className="w-full h-full"
                              playsInline
                              webkit-playsinline="true"
                              preload="auto"
                              crossOrigin="anonymous"
                              onError={() => setVideoError(true)}
                           >
                              <source src={tree.video_url} type="video/mp4" />
                              <source src={tree.video_url} type="video/webm" />
                              Tarayıcınız video oynatmayı desteklemiyor.
                           </video>
                         ) : (
                           <div className="text-center p-4">
                             <p className="text-destructive mb-2">Video yüklenemedi.</p>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               onClick={() => {
                                 setVideoError(false);
                                 window.location.reload();
                               }}
                             >
                               Yeniden Dene
                             </Button>
                           </div>
                         )}
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>

            {/* Ölçüm Sonuçları Kartı */}
            {tree.measurements && tree.status === 'completed' && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    Ölçüm Sonuçları
                  </CardTitle>
                  <CardDescription>3D nokta bulutundan hesaplanan metrikler</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {tree.measurements.height_m != null && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <TreePine className="h-4 w-4 text-green-600 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Ağaç Boyu</p>
                          <p className="font-semibold">{tree.measurements.height_m} m</p>
                        </div>
                      </div>
                    )}
                    {tree.measurements.diameter_cm != null && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <CircleDot className="h-4 w-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Gövde Çapı</p>
                          <p className="font-semibold">{tree.measurements.diameter_cm} cm</p>
                        </div>
                      </div>
                    )}
                    {tree.measurements.volume_m3 != null && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Layers className="h-4 w-4 text-blue-600 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Taç Hacmi</p>
                          <p className="font-semibold">{tree.measurements.volume_m3} m³</p>
                        </div>
                      </div>
                    )}
                    {tree.measurements.crown_diameter_m != null && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Move className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Taç Çapı</p>
                          <p className="font-semibold">{tree.measurements.crown_diameter_m} m</p>
                        </div>
                      </div>
                    )}
                    {tree.measurements.crown_surface_area_m2 != null && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Layers className="h-4 w-4 text-teal-600 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Taç Yüzey Alanı</p>
                          <p className="font-semibold">{tree.measurements.crown_surface_area_m2} m²</p>
                        </div>
                      </div>
                    )}
                    {tree.measurements.crown_base_height_m != null && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <ArrowUpFromDot className="h-4 w-4 text-orange-600 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Taç Tabanı Yüks.</p>
                          <p className="font-semibold">{tree.measurements.crown_base_height_m} m</p>
                        </div>
                      </div>
                    )}
                    {tree.measurements.trunk_lean_deg != null && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Move className="h-4 w-4 text-red-500 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Gövde Eğikliği</p>
                          <p className="font-semibold">{tree.measurements.trunk_lean_deg}°</p>
                        </div>
                      </div>
                    )}
                    {tree.measurements.crown_asymmetry_index != null && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <CircleDot className="h-4 w-4 text-purple-600 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Taç Asimetrisi</p>
                          <p className="font-semibold">{tree.measurements.crown_asymmetry_index}</p>
                        </div>
                      </div>
                    )}
                    {tree.measurements.fractal_score != null && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Layers className="h-4 w-4 text-indigo-600 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Fraktal Skoru</p>
                          <p className="font-semibold">{tree.measurements.fractal_score}</p>
                        </div>
                      </div>
                    )}
                    {tree.measurements.crown_density_pts_m3 != null && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Layers className="h-4 w-4 text-cyan-600 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Taç Yoğunluğu</p>
                          <p className="font-semibold">{tree.measurements.crown_density_pts_m3.toLocaleString('tr-TR')} n/m³</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Renk Analizi Kartı */}
            {tree.color_analysis && tree.status === 'completed' && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Renk Analizi
                  </CardTitle>
                  <CardDescription>Video karelerinden hesaplanan renk metrikleri ({tree.color_analysis.analyzed_frames} kare)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sağlık Skoru - Büyük gösterim */}
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <Heart className={`h-8 w-8 shrink-0 ${
                      tree.color_analysis.health_score >= 70 ? 'text-green-600' :
                      tree.color_analysis.health_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Sağlık Skoru</p>
                      <div className="flex items-center gap-3">
                        <p className="text-2xl font-bold">{tree.color_analysis.health_score}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              tree.color_analysis.health_score >= 70 ? 'bg-green-500' :
                              tree.color_analysis.health_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${tree.color_analysis.health_score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Leaf className="h-4 w-4 text-green-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Yeşil Oran</p>
                        <p className="font-semibold">{(tree.color_analysis.green_fraction * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Leaf className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Yeşillik İndeksi</p>
                        <p className="font-semibold">{tree.color_analysis.greenness_index.toFixed(4)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <AlertTriangle className={`h-4 w-4 shrink-0 ${
                        tree.color_analysis.stress_ratio > 0.3 ? 'text-red-500' : 'text-yellow-500'
                      }`} />
                      <div>
                        <p className="text-xs text-muted-foreground">Stres Oranı</p>
                        <p className="font-semibold">{(tree.color_analysis.stress_ratio * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Eye className="h-4 w-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Renk Homojenliği</p>
                        <p className="font-semibold">{tree.color_analysis.color_homogeneity.toFixed(3)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <TreePine className="h-4 w-4 text-amber-700 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gövde/Yaprak Oranı</p>
                        <p className="font-semibold">{tree.color_analysis.trunk_leaf_ratio.toFixed(2)}</p>
                      </div>
                    </div>
                    {tree.color_analysis.dominant_color_rgb && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <div
                          className="h-4 w-4 rounded-full shrink-0 border"
                          style={{
                            backgroundColor: `rgb(${tree.color_analysis.dominant_color_rgb[0]}, ${tree.color_analysis.dominant_color_rgb[1]}, ${tree.color_analysis.dominant_color_rgb[2]})`
                          }}
                        />
                        <div>
                          <p className="text-xs text-muted-foreground">Baskın Renk</p>
                          <p className="font-semibold text-xs">RGB({tree.color_analysis.dominant_color_rgb.map(c => Math.round(c)).join(', ')})</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          <div>
            {/* Dal Analizi Kartı */}
            {tree.branch_analysis && tree.advanced_measurements === 'completed' && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Dal Analizi (Kış Dönemi)
                  </CardTitle>
                  <CardDescription>Yapraklardan arındırılmış 3D modelden hesaplanan dal metrikleri</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <GitBranch className="h-4 w-4 text-green-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ana Dal Sayısı</p>
                        <p className="font-semibold">{tree.branch_analysis.branch_count}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Compass className="h-4 w-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ort. Dal Açısı</p>
                        <p className="font-semibold">{tree.branch_analysis.avg_branch_angle_deg}°</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Compass className="h-4 w-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Min / Max Açı</p>
                        <p className="font-semibold">{tree.branch_analysis.min_branch_angle_deg}° / {tree.branch_analysis.max_branch_angle_deg}°</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Ruler className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ort. Dal Uzunluğu</p>
                        <p className="font-semibold">{tree.branch_analysis.avg_branch_length_m} m</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <CircleDot className="h-4 w-4 text-purple-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Dal Simetrisi</p>
                        <p className="font-semibold">{tree.branch_analysis.branch_symmetry_index}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                      <Layers className="h-4 w-4 text-cyan-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Dallanma Yoğunluğu</p>
                        <p className="font-semibold">{tree.branch_analysis.branching_density_per_m} dal/m</p>
                      </div>
                    </div>
                  </div>

                  {/* Kadran Dağılımı */}
                  {tree.branch_analysis.quadrant_distribution && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2">Kadran Dağılımı</p>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Kuzey</p>
                          <p className="font-semibold">{tree.branch_analysis.quadrant_distribution.N}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Doğu</p>
                          <p className="font-semibold">{tree.branch_analysis.quadrant_distribution.E}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Güney</p>
                          <p className="font-semibold">{tree.branch_analysis.quadrant_distribution.S}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Batı</p>
                          <p className="font-semibold">{tree.branch_analysis.quadrant_distribution.W}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sağlık Notları */}
                  {tree.branch_analysis.health_notes && tree.branch_analysis.health_notes.length > 0 && (
                    <div className="space-y-2">
                      {tree.branch_analysis.health_notes.map((note, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">{note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>3D Model</CardTitle>
                  {tree.ply_url && (
                    <a href={tree.ply_url} download target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        PLY İndir
                      </Button>
                    </a>
                  )}
                </div>
              </CardHeader>
              <CardContent className="aspect-square">
                {tree.status === 'completed' && tree.model_url ? (
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
