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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const viewerRef = useRef<any>(null);

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
      if (containerRef.current && containerRef.current.contains(viewerContainer)) {
          try {
            containerRef.current.removeChild(viewerContainer);
          } catch (e) {
            console.warn("Error removing viewer container:", e);
          }
      }
    };
  }, [src]);

  const handleResetView = () => {
      if (viewerRef.current && viewerRef.current.camera) {
         try {
             viewerRef.current.camera.position.set(0, -2, 5);
             viewerRef.current.camera.lookAt(0, 0, 0);
             viewerRef.current.camera.up.set(0, -1, 0);
         } catch(e) {
             console.log("Reset view error", e);
         }
      }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-900 rounded-lg overflow-hidden group">
      {/* React controls this div. We append a child to it manually. */}
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
