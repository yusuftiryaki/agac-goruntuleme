'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Ruler, Maximize, RotateCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import '@google/model-viewer';

interface ModelViewerProps {
  src: string;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Point2D {
  x: number;
  y: number;
}

export function ModelViewer({ src }: ModelViewerProps) {
  const modelViewerRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [measurementMode, setMeasurementMode] = useState(false);
  const [points, setPoints] = useState<Point3D[]>([]);
  const [screenPoints, setScreenPoints] = useState<(Point2D | null)[]>([]);
  const [distance, setDistance] = useState<number | null>(null);

  // Calculate distance between two 3D points
  const calculateDistance = (p1: Point3D, p2: Point3D) => {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2) +
      Math.pow(p2.z - p1.z, 2)
    );
  };

  // Update screen coordinates for drawing the line
  const updateScreenCoordinates = useCallback(() => {
    const modelViewer = modelViewerRef.current as any;
    if (!modelViewer || points.length === 0) {
      setScreenPoints([]);
      return;
    }

    const newScreenPoints = points.map(p => {
      // model-viewer's toScreenPosition returns coordinates relative to the element
      // It returns null if the point is behind the camera or off screen in some versions,
      // but mostly it returns {x, y}.
      const screenPos = modelViewer.toScreenPosition ? modelViewer.toScreenPosition(p) : null;
      return screenPos;
    });
    setScreenPoints(newScreenPoints);
  }, [points]);

  useEffect(() => {
    const modelViewer = modelViewerRef.current as any;
    if (!modelViewer) return;

    const handleClick = (event: MouseEvent) => {
      if (!measurementMode) return;
      
      // Prevent default to avoid conflicting with other interactions if necessary
      // event.preventDefault();

      const rect = modelViewer.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const hit = modelViewer.positionAndNormalFromPoint ? modelViewer.positionAndNormalFromPoint(x, y) : null;

      if (hit) {
        const newPoint = hit.position;
        setPoints((prev) => {
          if (prev.length >= 2) {
            // Reset if we already have 2 points and click again
            setDistance(null);
            return [newPoint];
          }
          const nextPoints = [...prev, newPoint];
          
          if (nextPoints.length === 2) {
            const dist = calculateDistance(nextPoints[0], nextPoints[1]);
            setDistance(dist * 100); // Convert to cm
          }
          
          return nextPoints;
        });
      }
    };

    modelViewer.addEventListener('click', handleClick);
    modelViewer.addEventListener('camera-change', updateScreenCoordinates);
    
    // Initial update
    updateScreenCoordinates();

    return () => {
      modelViewer.removeEventListener('click', handleClick);
      modelViewer.removeEventListener('camera-change', updateScreenCoordinates);
    };
  }, [measurementMode, points, updateScreenCoordinates]);

  // Update screen coordinates when points change
  useEffect(() => {
    updateScreenCoordinates();
  }, [points, updateScreenCoordinates]);

  const toggleMeasurementMode = () => {
    setMeasurementMode(!measurementMode);
    setPoints([]);
    setDistance(null);
    setScreenPoints([]);
  };

  const resetView = () => {
    const modelViewer = modelViewerRef.current as any;
    if (modelViewer) {
      modelViewer.cameraOrbit = '0deg 75deg 105%';
      modelViewer.fieldOfView = 'auto';
      // Don't reset points on view reset, just the camera
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full group bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden isolate">
      <model-viewer
        ref={modelViewerRef}
        src={src}
        alt="Fıstık ağacının 3D modeli"
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate={!measurementMode}
        disable-tap={measurementMode}
        style={{ width: '100%', height: '100%' }}
      >
        {points.map((p, i) => (
           <div
             key={i}
             slot={`hotspot-${i}`}
             data-position={`${p.x} ${p.y} ${p.z}`}
             data-normal="0 1 0"
             className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-md cursor-pointer pointer-events-none"
           ></div>
        ))}
      </model-viewer>

      {/* SVG Overlay for drawing lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ overflow: 'visible' }}>
        {points.length === 2 && screenPoints[0] && screenPoints[1] && (
          <>
            <line
              x1={screenPoints[0]!.x}
              y1={screenPoints[0]!.y}
              x2={screenPoints[1]!.x}
              y2={screenPoints[1]!.y}
              stroke="white"
              strokeWidth="2"
              strokeDasharray="4"
              className="drop-shadow-md"
            />
            <g transform={`translate(${(screenPoints[0]!.x + screenPoints[1]!.x) / 2}, ${(screenPoints[0]!.y + screenPoints[1]!.y) / 2})`}>
               <rect x="-30" y="-12" width="60" height="24" rx="4" fill="rgba(0,0,0,0.7)" />
               <text x="0" y="4" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                 {distance?.toFixed(1)} cm
               </text>
            </g>
          </>
        )}
      </svg>

      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
         <Button
            variant={measurementMode ? "destructive" : "secondary"}
            size="icon"
            onClick={toggleMeasurementMode}
            title={measurementMode ? "Ölçümü Bitir" : "Ölçüm Yap"}
            className="shadow-md"
          >
            {measurementMode ? <X className="h-4 w-4" /> : <Ruler className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="secondary"
            size="icon"
            onClick={resetView}
            title="Görünümü Sıfırla"
            className="shadow-md"
          >
             <RotateCw className="h-4 w-4" />
          </Button>
      </div>

      {measurementMode && (
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border max-w-[200px] z-20">
          <p className="text-sm font-medium mb-1">Ölçüm Modu</p>
          <p className="text-xs text-muted-foreground mb-2">
            {points.length === 0 && "Başlangıç noktasına tıklayın"}
            {points.length === 1 && "Bitiş noktasına tıklayın"}
            {points.length === 2 && "Ölçüm tamamlandı"}
          </p>
          
          {distance !== null && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t">
               <span className="text-lg font-bold text-primary">
                 {distance.toFixed(1)} cm
               </span>
               <Button variant="ghost" size="sm" className="h-6 px-2 text-xs ml-auto" onClick={() => { setPoints([]); setDistance(null); setScreenPoints([]); }}>
                 Sıfırla
               </Button>
            </div>
          )}
        </div>
      )}
      
       <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none transition-opacity text-slate-500 dark:text-slate-400 text-xs z-0">
          {measurementMode ? 
            "Ölçüm için model üzerinde noktalara tıklayın. Döndürmek için sürükleyin." : 
            "Döndürmek için sürükleyin. Yakınlaştırmak için çimdikleyin veya kaydırın."}
       </div>
    </div>
  );
}
