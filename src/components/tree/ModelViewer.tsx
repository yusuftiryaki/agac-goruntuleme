'use client';

interface ModelViewerProps {
  src: string;
}

export function ModelViewer({ src }: ModelViewerProps) {
  return (
    <model-viewer
      src={src}
      alt="Fıstık ağacının 3D modeli"
      ar
      camera-controls
      auto-rotate
      style={{ width: '100%', height: '100%', borderRadius: 'var(--radius)' }}
    ></model-viewer>
  );
}
