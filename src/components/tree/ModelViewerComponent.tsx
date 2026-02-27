'use client';

import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';

interface ModelViewerProps {
  src: string;
}

export default function ModelViewerComponent({ src }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !src) return;

    let viewer: any = null;
    let isMounted = true;
    let abortController = new AbortController();

    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Clean up container manually to prevent DOM conflicts
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }

        // Create the viewer
        viewer = new GaussianSplats3D.Viewer({
          'rootElement': containerRef.current,
          'cameraUp': [0, -1, 0],
          'initialCameraPosition': [0, -2, 5],
          'initialCameraLookAt': [0, 0, 0],
          'selfDrivenMode': true,
          'useBuiltInControls': true,
          // 'ignoreDevicePixelRatio': false,
        });
        
        viewerRef.current = viewer;

        // Handle URL for splat loading
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

        if (!isMounted) {
            viewer.dispose();
            return;
        }

        // Load the splat scene
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
        } else {
             // If unmounted during load, dispose immediately
             viewer.dispose();
        }

      } catch (err: any) {
        console.error("Error initializing splat viewer:", err);
        if (isMounted) {
             // Check if it's the specific format error
            let errorMessage = err.message || "Bilinmeyen hata";
            if (errorMessage.includes("File format not supported")) {
                errorMessage = "Dosya formatı algılanamadı veya desteklenmiyor.";
            } else if (errorMessage.includes("Scene disposed")) {
                // Ignore scene disposed errors during init as they might be race conditions
                return; 
            }
            setError("Model yüklenirken bir hata oluştu: " + errorMessage);
            setIsLoading(false);
        }
        // If an error occurred, we should probably dispose the partial viewer
        if (viewer) {
            try { viewer.dispose(); } catch(e) {}
        }
      }
    };

    initViewer();

    return () => {
      isMounted = false;
      abortController.abort();
      if (viewerRef.current) {
         try {
             viewerRef.current.dispose();
         } catch(e) {
             console.warn("Error disposing viewer:", e);
         }
         viewerRef.current = null;
      }
      // Manually clear container to avoid React removal issues if the library messed with DOM
      if (containerRef.current) {
          containerRef.current.innerHTML = '';
      }
    };
  }, [src]);

  const handleResetView = () => {
    if(viewerRef.current) {
         try {
            if (viewerRef.current.camera) {
                 viewerRef.current.camera.position.set(0, -2, 5);
                 viewerRef.current.camera.lookAt(0, 0, 0);
                 viewerRef.current.camera.up.set(0, -1, 0);
            }
         } catch(e) {
             console.log("Could not reset view manually", e);
         }
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-900 rounded-lg overflow-hidden group">
      {/* Container for the 3D canvas. We use a key to force re-creation if src changes drastically, though here we rely on useEffect cleanup */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 pointer-events-none">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 p-4 text-center">
          <div className="text-red-400">
            <p className="font-bold">Hata</p>
            <p className="text-sm">{error}</p>
             <Button variant="secondary" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                Yeniden Dene
            </Button>
          </div>
        </div>
      )}
      
      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
         <Button size="icon" variant="secondary" onClick={handleResetView} title="Görünümü Sıfırla">
             <RotateCcw className="h-4 w-4" />
         </Button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none text-white/70 text-xs select-none">
        Sol Tık: Döndür • Sağ Tık: Taşı • Tekerlek: Yakınlaş
      </div>
    </div>
  );
}
