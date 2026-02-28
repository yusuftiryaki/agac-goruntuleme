// Konsolda çıkan belirli hataları bastırmak için global error handler ekle
if (typeof window !== 'undefined') {
  const IGNORE_ERRORS = [
    "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
    'AbortedPromiseError: Scene disposed',
  ];
  window.addEventListener('error', function (event) {
    if (event && event.error && typeof event.error.message === 'string') {
      for (const msg of IGNORE_ERRORS) {
        if (event.error.message.includes(msg)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return false;
        }
      }
    }
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    if (event && event.reason && typeof event.reason.message === 'string') {
      for (const msg of IGNORE_ERRORS) {
        if (event.reason.message.includes(msg)) {
          event.preventDefault();
          return false;
        }
      }
    }
  });
}
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Ruler, Trash2, X, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import * as THREE from 'three';
// @ts-ignore
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

interface ModelViewerProps {
  src: string;
}

export default function ModelViewerComponent({ src }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<Array<[number, number, number]>>([]);
  const [screenPoints, setScreenPoints] = useState<Array<{x: number, y: number}>>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [lastClickPos, setLastClickPos] = useState({ x: 0, y: 0, active: false });
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<any>(null);

  // Ölçüm noktalarını ekrana yansıtmak için animasyon döngüsü
  useEffect(() => {
    if (measurePoints.length === 0 || !viewerRef.current) {
        setScreenPoints([]);
        return;
    }

    let animationFrameId: number;
    const updateScreenPoints = () => {
      const viewer = viewerRef.current;
      if (!viewer || !viewer.camera || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const camera = viewer.camera;
      
      const newScreenPoints = measurePoints.map(pt => {
        const vector = new THREE.Vector3(pt[0], pt[1], pt[2]);
        vector.project(camera);
        
        return {
          x: (vector.x + 1) / 2 * rect.width,
          y: (-vector.y + 1) / 2 * rect.height,
          z: vector.z // Z değeri derinlik kontrolü için kullanılabilir (kameranın önünde mi?)
        };
      });

      setScreenPoints(newScreenPoints);
      animationFrameId = requestAnimationFrame(updateScreenPoints);
    };

    updateScreenPoints();
    return () => cancelAnimationFrame(animationFrameId);
  }, [measurePoints, isMeasuring]);

  const renderMeasurementOverlay = () => {
    if (screenPoints.length === 0) return null;

    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <svg className="w-full h-full">
          {/* Çizgi */}
          {screenPoints.length === 2 && (
            <line
              x1={screenPoints[0].x}
              y1={screenPoints[0].y}
              x2={screenPoints[1].x}
              y2={screenPoints[1].y}
              stroke="white"
              strokeWidth="2"
              strokeDasharray="4 2"
              className="drop-shadow-lg"
            />
          )}
          
          {/* Noktalar */}
          {screenPoints.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r="6"
                fill="#3b82f6"
                stroke="white"
                strokeWidth="2"
                className="drop-shadow-md"
              />
              <text
                x={pt.x + 10}
                y={pt.y - 10}
                fill="white"
                className="text-[10px] font-bold select-none drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
              >
                {idx === 0 ? 'A' : 'B'}
              </text>
            </g>
          ))}
        </svg>

        {/* Mesafe Etiketi */}
        {screenPoints.length === 2 && distance !== null && (
          <div 
            className="absolute bg-black/70 backdrop-blur-md text-white px-2 py-1 rounded-md text-xs font-mono border border-white/20 shadow-xl pointer-events-none"
            style={{
              left: (screenPoints[0].x + screenPoints[1].x) / 2,
              top: (screenPoints[0].y + screenPoints[1].y) / 2,
              transform: 'translate(-50%, -100%) translateY(-10px)'
            }}
          >
            {distance.toFixed(3)} m
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!containerRef.current || !src) return;

    let isMounted = true;
    
    // Create a dedicated container element for the viewer to isolate DOM manipulations
    const viewerContainer = document.createElement('div');
    viewerContainer.style.width = '100%';
    viewerContainer.style.height = '100%';
    viewerContainer.style.position = 'absolute';
    viewerContainer.style.top = '0';
    viewerContainer.style.left = '0';
    
    // Append to the React-managed container
    containerRef.current.appendChild(viewerContainer);

    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize the viewer attached to our isolated container
        const viewer = new GaussianSplats3D.Viewer({
          'rootElement': viewerContainer,
          'cameraUp': [0, -1, 0],
          'initialCameraPosition': [0, -2, 5],
          'initialCameraLookAt': [0, 0, 0],
          'selfDrivenMode': true,
          'useBuiltInControls': true,
        });
        
        viewerRef.current = viewer;

        // Fix URL for splat detection
        let splatSrc = src;
        const lowerSrc = src.toLowerCase();
        if (!lowerSrc.endsWith('.splat') && !lowerSrc.endsWith('.ksplat')) {
            const urlWithoutQuery = lowerSrc.split('?')[0];
            if (urlWithoutQuery.endsWith('.splat')) {
                splatSrc = src + '#.splat'; 
            } else if (urlWithoutQuery.endsWith('.ksplat')) {
                splatSrc = src + '#.ksplat';
            }
        }

        if (!isMounted) return;

        // Load the scene
        await viewer.addSplatScene(splatSrc, {
          'splatAlphaRemovalThreshold': 5,
          'showLoadingUI': false,
          'position': [0, 1, 0],
          'rotation': [0, 0, 0, 1],
          'scale': [1.5, 1.5, 1.5],
          'streamView': true
        });

        if (isMounted) {
            viewer.start();
            setIsLoading(false);
        }

      } catch (err: any) {
        // If the error is "Scene disposed", it's a non-critical error that can happen
        // when the component unmounts during loading. We can safely ignore it.
        if (err.message && err.message.includes('Scene disposed')) {
          console.log('Splat viewer load cancelled during navigation.');
          return;
        }
        
        // For all other errors, log them and update the UI.
        console.error("Splat viewer init error:", err);
        if (isMounted) {
          let errorMessage = err.message || "Bilinmeyen hata";
          if (errorMessage.includes("File format not supported")) {
              errorMessage = "Dosya formatı desteklenmiyor (.splat veya .ksplat).";
          }
          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    initViewer();

    return () => {
      isMounted = false;
      // Cleanup: Dispose viewer
      if (viewerRef.current) {
         try {
             viewerRef.current.dispose();
         } catch(e) {
             console.warn("Viewer dispose error:", e);
         }
         viewerRef.current = null;
      }
      
      // Remove the isolated container from the DOM
      if (containerRef.current && viewerContainer && viewerContainer.parentNode === containerRef.current) {
        try {
          containerRef.current.removeChild(viewerContainer);
        } catch (e) {
          console.warn("Error removing viewer container:", e);
        }
      }
    };
  }, [src]);

  // Ölçüm modunu başlat/durdur
  const handleToggleMeasure = useCallback(() => {
    setIsMeasuring((v) => {
      const newState = !v;
      // Kamera kontrollerini doğrudan burada da yönetelim (Hızlı tepki için)
      if (viewerRef.current?.controls) {
        viewerRef.current.controls.enabled = !newState;
      }
      return newState;
    });
  }, []);

  const handleClearMeasurements = useCallback(() => {
    setMeasurePoints([]);
    setDistance(null);
    setScreenPoints([]);
  }, []);

  // Nokta seçme işlemi için yardımcı fonksiyon
  const handleSceneClick = (clientX: number, clientY: number) => {
    if (!viewerRef.current) return;
    const viewer = viewerRef.current;
    
    // Canvas koordinatlarını hesapla
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    const mousePosition = new THREE.Vector2(x, y);
    let intersectPoint = null;

    // Görsel geri bildirim (tıklama efekti)
    setLastClickPos({ x: clientX - rect.left, y: clientY - rect.top, active: true });
    setTimeout(() => setLastClickPos(prev => ({ ...prev, active: false })), 400);

    try {
      // 1. Yol: Kütüphanenin kendi kesişim testi (Yoğun splat'lar için)
      if (typeof viewer.getSplatSceneIntersection === 'function') {
        const hit = viewer.getSplatSceneIntersection(mousePosition);
        if (hit) {
          intersectPoint = hit.origin || hit.position || hit.point;
        }
      }
      
      // 2. Yol: Eğer splat bulunamazsa, sanal bir zemin düzlemi ile kesiştir
      // Bu sayede "boş" görünen ama aslında modelin tabanı olan yerler de seçilebilir.
      if (!intersectPoint && viewer.camera) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mousePosition, viewer.camera);
        
        // Modelin yerleştiği yaklaşık zemin düzlemi (Y = 1.0, başlangıç pozisyonuna göre)
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1); 
        const target = new THREE.Vector3();
        
        if (raycaster.ray.intersectPlane(groundPlane, target)) {
          // Eğer tıklama ufka doğru değilse ve makul bir mesafedeyse zemini kabul et
          const distToCamera = target.distanceTo(viewer.camera.position);
          if (distToCamera < 50) { 
            intersectPoint = target;
          }
        }
      }

      // 3. Yol: Fallback - Sahnede bulabildiğin en yakın nesneyi yakala
      if (!intersectPoint && viewer.camera && viewer.scene) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mousePosition, viewer.camera);
        raycaster.params.Points.threshold = 10.0; // Çok geniş bir tolerans
        const intersects = raycaster.intersectObjects(viewer.scene.children, true);
        if (intersects.length > 0) {
          intersectPoint = intersects[0].point;
        }
      }
    } catch (e) {
      console.warn("Seçim sırasında teknik hata:", e);
    }

    if (intersectPoint) {
      const point: [number, number, number] = [intersectPoint.x, intersectPoint.y, intersectPoint.z];
      setMeasurePoints((prev) => {
        const newPoints = [...prev, point];
        // Sadece son 2 noktayı tut ve mesafeyi hesapla
        const finalPoints = newPoints.length > 2 ? newPoints.slice(-2) : newPoints;
        if (finalPoints.length === 2) {
          const dx = finalPoints[0][0] - finalPoints[1][0];
          const dy = finalPoints[0][1] - finalPoints[1][1];
          const dz = finalPoints[0][2] - finalPoints[1][2];
          setDistance(Math.sqrt(dx * dx + dy * dy + dz * dz));
        }
        return finalPoints;
      });
    }
  };

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !containerRef.current) return;
    
    const container = containerRef.current;

    const updateMousePos = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    if (isMeasuring) {
      if (viewer.controls) viewer.controls.enabled = false;
      container.addEventListener('mousemove', updateMousePos);
    } else {
      if (viewer.controls) viewer.controls.enabled = true;
      container.removeEventListener('mousemove', updateMousePos);
      return;
    }

    // Tıklamaları kütüphaneden BAĞIMSIZ olarak container üzerinden yakala
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // Kütüphanenin bu olayı görmesini engelle (Capture modunda)
      e.stopImmediatePropagation();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.stopImmediatePropagation();
      handleSceneClick(e.clientX, e.clientY);
    };

    // Olayları 'true' (capture) fazında ekleyerek kütüphane kodundan önce çalışmasını sağlıyoruz
    container.addEventListener('pointerdown', onPointerDown, true);
    container.addEventListener('pointerup', onPointerUp, true);

    return () => {
      container.removeEventListener('pointerdown', onPointerDown, true);
      container.removeEventListener('pointerup', onPointerUp, true);
      container.removeEventListener('mousemove', updateMousePos);
      if (viewer.controls) viewer.controls.enabled = true;
    };
  }, [isMeasuring]);

  const renderCustomCursor = () => {
    if (!isMeasuring) return null;
    return (
      <div 
        className="fixed pointer-events-none z-[100] flex items-center justify-center transition-transform duration-75 ease-out"
        style={{ 
          left: mousePos.x, 
          top: mousePos.y, 
          transform: 'translate(-50%, -50%)',
          width: '40px',
          height: '40px'
        }}
      >
        {/* Dürbün/Hedef Göstergesi */}
        <div className="absolute w-full h-full border-2 border-blue-400/50 rounded-full animate-pulse" />
        <div className="absolute w-[2px] h-full bg-blue-400/80" />
        <div className="absolute h-[2px] w-full bg-blue-400/80" />
        <div className="absolute w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
        
        {/* Köşe Çizgileri */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white" />
      </div>
    );
  };

  const handleResetView = () => {
      if (viewerRef.current && viewerRef.current.controls) {
         try {
             viewerRef.current.controls.reset();
         } catch(e) {
             console.log("Reset view error", e);
             if (viewerRef.current.camera) {
                 viewerRef.current.camera.position.set(0, -2, 5);
                 viewerRef.current.camera.lookAt(0, 0, 0);
             }
         }
      } else if (viewerRef.current && viewerRef.current.camera) {
          viewerRef.current.camera.position.set(0, -2, 5);
          viewerRef.current.camera.lookAt(0, 0, 0);
      }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-slate-950 rounded-xl overflow-hidden group shadow-2xl border border-white/10">
      {/* Viewer Container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      
      {/* Custom Tactical Cursor */}
      {isMeasuring && (
        <>
          {/* Tıklama Efekti (Ripple) */}
          {lastClickPos.active && (
            <div 
              className="absolute pointer-events-none z-[110] w-12 h-12 border-2 border-red-500 rounded-full animate-ping shadow-[0_0_15px_red]"
              style={{ left: lastClickPos.x, top: lastClickPos.y, transform: 'translate(-50%, -50%)' }}
            />
          )}
          
          <div 
            className="absolute pointer-events-none z-[100] flex items-center justify-center"
            style={{ 
              left: mousePos.x, 
              top: mousePos.y, 
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Dürbün/Hedef Göstergesi */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 border border-blue-400/30 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-0 border-2 border-blue-500/50 rounded-full scale-75 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              <div className="absolute w-[1px] h-full bg-blue-500/50" />
              <div className="absolute h-[1px] w-full bg-blue-500/50" />
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_8px_red] ring-2 ring-red-400/20" />
              
              {/* Ekstra Detay: Mesafe Göstergesi Yanında Canlı Koordinat */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 bg-black/50 backdrop-blur-md rounded border border-white/10 text-[8px] text-white/70">
                Hedef Kilitlendi
              </div>
            </div>
          </div>
        </>
      )}

      {/* Overlay Visuals */}
      {renderMeasurementOverlay()}

      {/* Modern Toolbox */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
        <TooltipProvider>
          <Card className="flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant={isMeasuring ? 'default' : 'ghost'} 
                  className={cn(
                    "w-10 h-10 rounded-xl transition-all duration-300",
                    isMeasuring ? "bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                  onClick={handleToggleMeasure}
                >
                  <Ruler className={cn("h-5 w-5", isMeasuring && "animate-pulse")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-900 border-white/10 text-white">
                <p>{isMeasuring ? 'Ölçümü Durdur' : 'Mesafe Ölç'}</p>
              </TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-white/10 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  disabled={measurePoints.length === 0}
                  className="w-10 h-10 rounded-xl text-white/70 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30 transition-all"
                  onClick={handleClearMeasurements}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-900 border-white/10 text-white">
                <p>Temizle</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="w-10 h-10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  onClick={handleResetView}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-slate-900 border-white/10 text-white">
                <p>Bakış Açısını Sıfırla</p>
              </TooltipContent>
            </Tooltip>
          </Card>
        </TooltipProvider>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin" />
          </div>
          <p className="mt-4 text-white/70 font-medium animate-pulse">Model Yükleniyor...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-50 p-6">
          <Card className="max-w-md w-full p-6 bg-red-500/10 border-red-500/20 backdrop-blur-md text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Yükleme Hatası</h3>
            <p className="text-white/60 text-sm mb-6">{error}</p>
            <Button variant="destructive" className="w-full" onClick={() => window.location.reload()}>
              Yeniden Dene
            </Button>
          </Card>
        </div>
      )}
      
      {/* Helper Text */}
      <div className="absolute top-6 left-6 z-10 hidden md:block">
        <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/50 space-x-3">
          <span><span className="text-white/80 font-bold">Sol Tık</span> Döndür</span>
          <span><span className="text-white/80 font-bold">Sağ Tık</span> Taşı</span>
          <span><span className="text-white/80 font-bold">Tekerlek</span> Yakınlaş</span>
        </div>
      </div>

      {/* Measuring Status */}
      {isMeasuring && (
        <div className="absolute top-6 right-6 z-10 animate-in fade-in slide-in-from-top-4">
          <div className="px-4 py-2 rounded-full bg-blue-600/20 backdrop-blur-md border border-blue-500/50 text-xs text-blue-400 font-bold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Ölçüm Modu Aktif: Nokta seçin
          </div>
        </div>
      )}
    </div>
  );
}

