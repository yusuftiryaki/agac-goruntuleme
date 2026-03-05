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
      <main className="flex-1 container py-6 space-y-6 max-w-5xl mx-auto">
        {/* ── Ağaç Bilgi Başlığı ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div>
                <CardTitle className="text-xl">Ağaç {tree.id.substring(0, 6)}</CardTitle>
                <CardDescription className="mt-1">
                  {tree.timestamp ? format(tree.timestamp.toDate(), "d MMMM yyyy, HH:mm", { locale: tr }) : 'Bilinmiyor'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {tree.qr_code && (
                  <Badge variant={tree.qr_code === 'unknown' ? 'destructive' : 'outline'} className="gap-1">
                    <QrCode className="h-3 w-3" />
                    {tree.qr_code}
                  </Badge>
                )}
                <Badge variant={getStatusVariant(tree.status)}>{tree.status}</Badge>
              </div>
            </div>
          </CardHeader>
          {tree.tags && tree.tags.length > 0 && (
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-1.5">
                {tree.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* ── Video ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Video Kaydı</CardTitle>
          </CardHeader>
            <CardContent>
              {tree.video_url ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black max-w-3xl mx-auto">
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
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <p className="text-destructive mb-2">Video yüklenemedi.</p>
                      <Button variant="outline" size="sm" onClick={() => { setVideoError(false); window.location.reload(); }}>
                        Yeniden Dene
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-muted/50 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Video bulunamadı</p>
                </div>
              )}
            </CardContent>
        </Card>

        {/* ── 3D Model ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">3D Model</CardTitle>
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
          <CardContent>
            <div className="rounded-lg overflow-hidden" style={{ height: '70vh', minHeight: '500px' }}>
              {tree.status === 'completed' && tree.model_url ? (
                <ModelViewer src={tree.model_url} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded-lg text-center p-4">
                  <Hourglass className="w-10 h-10 text-primary mb-3 animate-pulse" />
                  <p className="font-medium">Model oluşturuluyor...</p>
                  <p className="text-muted-foreground text-xs mt-1">Bu işlem biraz zaman alabilir.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Ölçüm Kartları ── */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Ölçüm Sonuçları */}
          {tree.measurements && tree.status === 'completed' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Ruler className="h-4 w-4" />
                  Ölçüm Sonuçları
                </CardTitle>
                <CardDescription className="text-xs">3D nokta bulutundan hesaplanan metrikler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {tree.measurements.height_m != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <TreePine className="h-4 w-4 text-green-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ağaç Boyu</p>
                        <p className="font-semibold text-sm">{tree.measurements.height_m} m</p>
                      </div>
                    </div>
                  )}
                  {tree.measurements.diameter_cm != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <CircleDot className="h-4 w-4 text-amber-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gövde Çapı</p>
                        <p className="font-semibold text-sm">{tree.measurements.diameter_cm} cm</p>
                      </div>
                    </div>
                  )}
                  {tree.measurements.volume_m3 != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <Layers className="h-4 w-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Taç Hacmi</p>
                        <p className="font-semibold text-sm">{tree.measurements.volume_m3} m³</p>
                      </div>
                    </div>
                  )}
                  {tree.measurements.crown_diameter_m != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <Move className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Taç Çapı</p>
                        <p className="font-semibold text-sm">{tree.measurements.crown_diameter_m} m</p>
                      </div>
                    </div>
                  )}
                  {tree.measurements.crown_surface_area_m2 != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <Layers className="h-4 w-4 text-teal-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Taç Yüzey Alanı</p>
                        <p className="font-semibold text-sm">{tree.measurements.crown_surface_area_m2} m²</p>
                      </div>
                    </div>
                  )}
                  {tree.measurements.crown_base_height_m != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <ArrowUpFromDot className="h-4 w-4 text-orange-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Taç Tabanı Yüks.</p>
                        <p className="font-semibold text-sm">{tree.measurements.crown_base_height_m} m</p>
                      </div>
                    </div>
                  )}
                  {tree.measurements.trunk_lean_deg != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <Move className="h-4 w-4 text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Gövde Eğikliği</p>
                        <p className="font-semibold text-sm">{tree.measurements.trunk_lean_deg}°</p>
                      </div>
                    </div>
                  )}
                  {tree.measurements.crown_asymmetry_index != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <CircleDot className="h-4 w-4 text-purple-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Taç Asimetrisi</p>
                        <p className="font-semibold text-sm">{tree.measurements.crown_asymmetry_index}</p>
                      </div>
                    </div>
                  )}
                  {tree.measurements.fractal_score != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <Layers className="h-4 w-4 text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Fraktal Skoru</p>
                        <p className="font-semibold text-sm">{tree.measurements.fractal_score}</p>
                      </div>
                    </div>
                  )}
                  {tree.measurements.crown_density_pts_m3 != null && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                      <Layers className="h-4 w-4 text-cyan-600 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Taç Yoğunluğu</p>
                        <p className="font-semibold text-sm">{tree.measurements.crown_density_pts_m3.toLocaleString('tr-TR')} n/m³</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Renk Analizi */}
          {tree.color_analysis && tree.status === 'completed' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Palette className="h-4 w-4" />
                  Renk Analizi
                </CardTitle>
                <CardDescription className="text-xs">Video karelerinden ({tree.color_analysis.analyzed_frames} kare)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Sağlık Skoru */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Heart className={`h-6 w-6 shrink-0 ${
                    tree.color_analysis.health_score >= 70 ? 'text-green-600' :
                    tree.color_analysis.health_score >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Sağlık Skoru</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold">{tree.color_analysis.health_score}<span className="text-xs font-normal text-muted-foreground">/100</span></p>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
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

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <Leaf className="h-4 w-4 text-green-600 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Yeşil Oran</p>
                      <p className="font-semibold text-sm">{(tree.color_analysis.green_fraction * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <Leaf className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Yeşillik İndeksi</p>
                      <p className="font-semibold text-sm">{tree.color_analysis.greenness_index.toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <AlertTriangle className={`h-4 w-4 shrink-0 ${
                      tree.color_analysis.stress_ratio > 0.3 ? 'text-red-500' : 'text-yellow-500'
                    }`} />
                    <div>
                      <p className="text-xs text-muted-foreground">Stres Oranı</p>
                      <p className="font-semibold text-sm">{(tree.color_analysis.stress_ratio * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <Eye className="h-4 w-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Renk Homojenliği</p>
                      <p className="font-semibold text-sm">{tree.color_analysis.color_homogeneity.toFixed(3)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                    <TreePine className="h-4 w-4 text-amber-700 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Gövde/Yaprak Oranı</p>
                      <p className="font-semibold text-sm">{tree.color_analysis.trunk_leaf_ratio.toFixed(2)}</p>
                    </div>
                  </div>
                  {tree.color_analysis.dominant_color_rgb && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
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

        {/* ── Dal Analizi (tam genişlik) ── */}
        {tree.branch_analysis && tree.advanced_measurements === 'completed' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4" />
                Dal Analizi (Kış Dönemi)
              </CardTitle>
              <CardDescription className="text-xs">Yapraklardan arındırılmış 3D modelden hesaplanan dal metrikleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                  <GitBranch className="h-4 w-4 text-green-600 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ana Dal Sayısı</p>
                    <p className="font-semibold text-sm">{tree.branch_analysis.branch_count}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                  <Compass className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ort. Dal Açısı</p>
                    <p className="font-semibold text-sm">{tree.branch_analysis.avg_branch_angle_deg}°</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                  <Compass className="h-4 w-4 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Min / Max Açı</p>
                    <p className="font-semibold text-sm">{tree.branch_analysis.min_branch_angle_deg}° / {tree.branch_analysis.max_branch_angle_deg}°</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                  <Ruler className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Ort. Dal Uzunluğu</p>
                    <p className="font-semibold text-sm">{tree.branch_analysis.avg_branch_length_m} m</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                  <CircleDot className="h-4 w-4 text-purple-600 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dal Simetrisi</p>
                    <p className="font-semibold text-sm">{tree.branch_analysis.branch_symmetry_index}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
                  <Layers className="h-4 w-4 text-cyan-600 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dallanma Yoğunluğu</p>
                    <p className="font-semibold text-sm">{tree.branch_analysis.branching_density_per_m} dal/m</p>
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

              {/* Polar Diyagram ve Skeleton View Görselleri */}
              {(tree.branch_analysis.polar_diagram_url || tree.branch_analysis.skeleton_view_url) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {tree.branch_analysis.polar_diagram_url && (
                    <div className="rounded-lg overflow-hidden border">
                      <p className="text-xs text-muted-foreground px-3 pt-2 pb-1 bg-muted/30">Polar Diyagram (Dal Dağılımı)</p>
                      <img
                        src={tree.branch_analysis.polar_diagram_url}
                        alt="Dal dağılımı polar diyagramı"
                        className="w-full h-auto"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
                  {tree.branch_analysis.skeleton_view_url && (
                    <div className="rounded-lg overflow-hidden border">
                      <p className="text-xs text-muted-foreground px-3 pt-2 pb-1 bg-muted/30">Dallanma Şeması (2D Skeleton)</p>
                      <img
                        src={tree.branch_analysis.skeleton_view_url}
                        alt="Dallanma şeması 2D görünüm"
                        className="w-full h-auto"
                        crossOrigin="anonymous"
                      />
                    </div>
                  )}
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
      </main>
    </div>
  );
}
