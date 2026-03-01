'use client';

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

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Ruler, Trash2, X, MousePointer2, Maximize, Minimize, Circle } from 'lucide-react';
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
  const viewerWrapperRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [activeMode, setActiveMode] = useState<'none' | 'distance' | 'circle'>('none');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mesafe Ölçümü State
  const [measurePoints, setMeasurePoints] = useState<Array<[number, number, number]>>([]);
  const [screenPoints, setScreenPoints] = useState<Array<{x: number, y: number}>>([]);
  const [distance, setDistance] = useState<number | null>(null);

  // Daire Ölçümü State
  const [circleCenter, setCircleCenter] = useState<[number, number, number] | null>(null);
  const [circleRadiusPoint, setCircleRadiusPoint] = useState<[number, number, number] | null>(null);
  const [circleRadius, setCircleRadius] = useState<number | null>(null);
  const [screenCirclePoints, setScreenCirclePoints] = useState<{center: {x:number, y:number}, radius: {x:number, y:number}} | null>(null);

  // Görsel Efekt State
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [lastClickPos, setLastClickPos] = useState({ x: 0, y: 0, active: false });

  // Refs for stable event listeners
  const stateRef = useRef({ activeMode, circleCenter, circleRadiusPoint });
  useEffect(() => {
    stateRef.current = { activeMode, circleCenter, circleRadiusPoint };
  }, [activeMode, circleCenter, circleRadiusPoint]);

  // Ölçüm noktalarını ekrana yansıtmak için animasyon döngüsü
  useEffect(() => {
    let animationFrameId: number;
    const updateScreenPoints = () => {
      const viewer = viewerRef.current;
      if (!viewer || !viewer.camera || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const camera = viewer.camera;
      
      // Mesafe noktaları
      const newScreenPoints = measurePoints.map(pt => {
        const vector = new THREE.Vector3(pt[0], pt[1], pt[2]);
        vector.project(camera);
        return {
          x: (vector.x + 1) / 2 * rect.width,
          y: (-vector.y + 1) / 2 * rect.height
        };
      });
      setScreenPoints(newScreenPoints);

      // Daire noktaları
      if (circleCenter) {
        const centerVec = new THREE.Vector3(circleCenter[0], circleCenter[1], circleCenter[2]);
        centerVec.project(camera);
        const center = {
          x: (centerVec.x + 1) / 2 * rect.width,
          y: (-centerVec.y + 1) / 2 * rect.height
        };

        let radiusPos = center;
        if (circleRadiusPoint) {
          const radVec = new THREE.Vector3(circleRadiusPoint[0], circleRadiusPoint[1], circleRadiusPoint[2]);
          radVec.project(camera);
          radiusPos = {
            x: (radVec.x + 1) / 2 * rect.width,
            y: (-radVec.y + 1) / 2 * rect.height
          };
        } else {
          radiusPos = mousePos;
        }
        setScreenCirclePoints({ center, radius: radiusPos });
      } else {
        setScreenCirclePoints(null);
      }

      animationFrameId = requestAnimationFrame(updateScreenPoints);
    };

    updateScreenPoints();
    return () => cancelAnimationFrame(animationFrameId);
  }, [measurePoints, circleCenter, circleRadiusPoint, mousePos]);

  // Viewer Başlatma
  useEffect(() => {
    if (!containerRef.current || !src) return;
    let isMounted = true;
    const viewerContainer = document.createElement('div');
    viewerContainer.style.cssText = 'width:100%; height:100%; position:absolute; top:0; left:0;';
    containerRef.current.appendChild(viewerContainer);

    const initViewer = async () => {
      try {
        setIsLoading(true);
        const viewer = new GaussianSplats3D.Viewer({
          rootElement: viewerContainer,
          cameraUp: [0, -1, 0],
          initialCameraPosition: [0, -2, 5],
          initialCameraLookAt: [0, 0, 0],
          selfDrivenMode: true,
          useBuiltInControls: true,
        });
        viewerRef.current = viewer;

        let splatSrc = src;
        if (!src.toLowerCase().endsWith('.splat') && !src.toLowerCase().endsWith('.ksplat')) {
          splatSrc += '#.splat';
        }

        await viewer.addSplatScene(splatSrc, {
          splatAlphaRemovalThreshold: 5,
          showLoadingUI: false,
          position: [0, 1, 0],
          rotation: [0, 0, 0, 1],
          scale: [1.5, 1.5, 1.5],
          streamView: true
        });

        if (isMounted) {
          viewer.start();
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error(err);
          setError(err.message || "Yükleme Hatası");
          setIsLoading(false);
        }
      }
    };

    initViewer();
    return () => {
      isMounted = false;
      if (viewerRef.current) viewerRef.current.dispose();
      if (viewerContainer.parentNode) viewerContainer.parentNode.removeChild(viewerContainer);
    };
  }, [src]);

  // Event Handlers
  const handleToggleMode = useCallback((mode: 'distance' | 'circle') => {
    setActiveMode(prev => {
      const next = prev === mode ? 'none' : mode;
      if (viewerRef.current?.controls) viewerRef.current.controls.enabled = next === 'none';
      return next;
    });
  }, []);

  const handleClearMeasurements = useCallback(() => {
    setMeasurePoints([]);
    setDistance(null);
    setCircleCenter(null);
    setCircleRadiusPoint(null);
    setCircleRadius(null);
  }, []);

  const handleSceneClick = useCallback((clientX: number, clientY: number) => {
    const { activeMode: currentMode, circleCenter: currentCenter } = stateRef.current;
    if (currentMode === 'none' || !viewerRef.current) return;

    const viewer = viewerRef.current;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;
    const mousePosition = new THREE.Vector2(x, y);
    let intersectPoint = null;

    setLastClickPos({ x: clientX - rect.left, y: clientY - rect.top, active: true });
    setTimeout(() => setLastClickPos(prev => ({ ...prev, active: false })), 400);

    try {
      if (typeof viewer.getSplatSceneIntersection === 'function') {
        const hit = viewer.getSplatSceneIntersection(mousePosition);
        if (hit) intersectPoint = hit.origin || hit.position || hit.point;
      }
      if (!intersectPoint && viewer.camera) {
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mousePosition, viewer.camera);
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1); 
        const target = new THREE.Vector3();
        if (raycaster.ray.intersectPlane(groundPlane, target)) {
          if (target.distanceTo(viewer.camera.position) < 50) intersectPoint = target;
        }
      }
    } catch (e) { console.warn(e); }

    if (intersectPoint) {
      const point: [number, number, number] = [intersectPoint.x, intersectPoint.y, intersectPoint.z];
      if (currentMode === 'circle') {
        if (!currentCenter) {
          setCircleCenter(point);
          setCircleRadiusPoint(null);
          setCircleRadius(null);
        } else {
          setCircleRadiusPoint(point);
          const dx = currentCenter[0] - point[0];
          const dy = currentCenter[1] - point[1];
          const dz = currentCenter[2] - point[2];
          setCircleRadius(Math.sqrt(dx * dx + dy * dy + dz * dz));
        }
      } else {
        setMeasurePoints(prev => {
          const next = [...prev, point].slice(-2);
          if (next.length === 2) {
            const dx = next[0][0] - next[1][0];
            const dy = next[0][1] - next[1][1];
            const dz = next[0][2] - next[1][2];
            setDistance(Math.sqrt(dx * dx + dy * dy + dz * dz));
          }
          return next;
        });
      }
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeMode === 'none') return;

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };
    const onUp = (e: PointerEvent) => {
      if (e.button === 0) {
        e.stopImmediatePropagation();
        handleSceneClick(e.clientX, e.clientY);
      }
    };
    container.addEventListener('pointermove', onMove);
    container.addEventListener('pointerdown', (e) => e.button === 0 && e.stopImmediatePropagation(), true);
    container.addEventListener('pointerup', onUp, true);
    return () => {
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerdown', (e) => e.stopImmediatePropagation(), true);
      container.removeEventListener('pointerup', onUp, true);
    };
  }, [activeMode, handleSceneClick]);

  const handleResetView = () => {
    if (viewerRef.current?.controls) viewerRef.current.controls.reset();
  };

  const handleToggleFullscreen = () => {
    if (!viewerWrapperRef.current) return;
    if (!document.fullscreenElement) {
      viewerWrapperRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const cb = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', cb);
    return () => document.removeEventListener('fullscreenchange', cb);
  }, []);

  return (
    <div ref={viewerWrapperRef} className={cn(
      "relative w-full overflow-hidden group shadow-2xl border border-white/10 transition-all duration-300",
      isFullscreen ? "h-screen w-screen bg-black rounded-none" : "h-full min-h-[500px] bg-slate-950 rounded-xl"
    )}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      
      {/* Taktiksel İmleç ve Tıklama Efekti */}
      {activeMode !== 'none' && (
        <>
          {lastClickPos.active && (
            <div className="absolute pointer-events-none z-[110] w-12 h-12 border-2 border-red-500 rounded-full animate-ping"
                 style={{ left: lastClickPos.x, top: lastClickPos.y, transform: 'translate(-50%, -50%)' }} />
          )}
          <div className="absolute pointer-events-none z-[100] flex items-center justify-center"
               style={{ left: mousePos.x, top: mousePos.y, transform: 'translate(-50%, -50%)' }}>
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 border border-blue-400/30 rounded-full animate-ping opacity-20" />
              <div className="absolute inset-0 border-2 border-blue-500/50 rounded-full scale-75" />
              <div className="absolute w-[1px] h-full bg-blue-500/50" />
              <div className="absolute h-[1px] w-full bg-blue-500/50" />
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full shadow-[0_0_8px_red]" />
            </div>
          </div>
        </>
      )}

      {/* Overlay (Çizgiler ve Veriler) */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <svg className="w-full h-full">
          {/* Mesafe Çizgisi */}
          {activeMode !== 'circle' && screenPoints.length === 2 && (
            <line x1={screenPoints[0].x} y1={screenPoints[0].y} x2={screenPoints[1].x} y2={screenPoints[1].y}
                  stroke="white" strokeWidth="2" strokeDasharray="4 2" className="drop-shadow-lg" />
          )}
          {activeMode !== 'circle' && screenPoints.map((pt, idx) => (
            <circle key={idx} cx={pt.x} cy={pt.y} r="6" fill="#3b82f6" stroke="white" strokeWidth="2" />
          ))}

          {/* Daire Çizimi */}
          {screenCirclePoints && (
            <g>
              <circle cx={screenCirclePoints.center.x} cy={screenCirclePoints.center.y} r="6" fill="#ec4899" stroke="white" strokeWidth="2" />
              <line x1={screenCirclePoints.center.x} y1={screenCirclePoints.center.y} 
                    x2={screenCirclePoints.radius.x} y2={screenCirclePoints.radius.y}
                    stroke="#ec4899" strokeWidth="2" strokeDasharray="4 2" />
              <circle cx={screenCirclePoints.center.x} cy={screenCirclePoints.center.y} 
                      r={Math.sqrt(Math.pow(screenCirclePoints.center.x - screenCirclePoints.radius.x, 2) + Math.pow(screenCirclePoints.center.y - screenCirclePoints.radius.y, 2))}
                      fill="rgba(236, 72, 153, 0.1)" stroke="#ec4899" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Mesafe Etiketi */}
        {distance && screenPoints.length === 2 && (
          <div className="absolute bg-black/70 backdrop-blur-md text-white px-2 py-1 rounded text-xs font-mono border border-white/20"
               style={{ left: (screenPoints[0].x + screenPoints[1].x) / 2, top: (screenPoints[0].y + screenPoints[1].y) / 2, transform: 'translate(-50%, -100%) translateY(-10px)' }}>
            {distance.toFixed(3)} m
          </div>
        )}

        {/* Daire Etiketi */}
        {circleRadius && screenCirclePoints && (
          <div className="absolute bg-pink-600/80 backdrop-blur-md text-white p-3 rounded-xl text-[10px] font-mono border border-white/20 min-w-[140px]"
               style={{ left: screenCirclePoints.center.x, top: screenCirclePoints.center.y, transform: 'translate(-50%, 20px)' }}>
            <div className="font-bold border-b border-white/20 mb-1 pb-1 flex items-center gap-2"><Circle className="w-3 h-3" /> Daire</div>
            <div className="flex justify-between"><span>Yarıçap:</span><b>{circleRadius.toFixed(3)} m</b></div>
            <div className="flex justify-between"><span>Çevre:</span><b>{(2*Math.PI*circleRadius).toFixed(3)} m</b></div>
            <div className="flex justify-between"><span>Alan:</span><b>{(Math.PI*circleRadius**2).toFixed(3)} m²</b></div>
          </div>
        )}
      </div>

      {/* Modern Toolbox */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
        <TooltipProvider>
          <Card className="flex items-center gap-1 p-1.5 bg-black/60 backdrop-blur-xl border-white/20 shadow-2xl rounded-2xl border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant={activeMode === 'distance' ? 'default' : 'ghost'} 
                  className={cn(
                    "w-10 h-10 rounded-xl transition-all duration-300", 
                    activeMode === 'distance' ? "bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "text-white/70 hover:text-white hover:bg-white/10"
                  )} 
                  onClick={() => handleToggleMode('distance')}
                >
                  <Ruler className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-white/10 text-white"><p>Mesafe Ölç</p></TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant={activeMode === 'circle' ? 'default' : 'ghost'} 
                  className={cn(
                    "w-10 h-10 rounded-xl transition-all duration-300", 
                    activeMode === 'circle' ? "bg-pink-600 shadow-[0_0_15px_rgba(236,72,153,0.4)]" : "text-white/70 hover:text-white hover:bg-white/10"
                  )} 
                  onClick={() => handleToggleMode('circle')}
                >
                  <Circle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-white/10 text-white"><p>Daire Ölç</p></TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-white/20 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="w-10 h-10 rounded-xl text-white/70 hover:text-red-400 hover:bg-red-400/10 transition-all" 
                  onClick={handleClearMeasurements}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-white/10 text-white"><p>Temizle</p></TooltipContent>
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
              <TooltipContent className="bg-slate-900 border-white/10 text-white"><p>Sıfırla</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="w-10 h-10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all" 
                  onClick={handleToggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-900 border-white/10 text-white"><p>Tam Ekran</p></TooltipContent>
            </Tooltip>
          </Card>
        </TooltipProvider>
      </div>

      {/* States */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-50 backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="mt-4 text-white/70 font-medium">Model Yükleniyor...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-50 p-6 text-center">
          <div className="text-red-400 font-bold">Hata: {error}</div>
        </div>
      )}
      {activeMode !== 'none' && (
        <div className="absolute top-6 right-6 z-10">
          <div className={cn("px-4 py-2 rounded-full backdrop-blur-md border text-xs font-bold", activeMode === 'circle' ? "bg-pink-600/20 border-pink-500/50 text-pink-400" : "bg-blue-600/20 border-blue-500/50 text-blue-400")}>
            {activeMode === 'circle' ? 'Daire Modu: Merkez ve Kenar seçin' : 'Mesafe Modu: İki nokta seçin'}
          </div>
        </div>
      )}
    </div>
  );
}

