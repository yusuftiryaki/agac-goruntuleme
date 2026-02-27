import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        'ar-modes'?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        'disable-tap'?: boolean;
        poster?: string;
        loading?: 'auto' | 'lazy' | 'eager';
        reveal?: 'auto' | 'interaction' | 'manual';
      }, HTMLElement>;
    }
  }
}

interface ModelViewerElement extends HTMLElement {
  positionAndNormalFromPoint(pixelX: number, pixelY: number): {
    position: { x: number, y: number, z: number };
    normal: { x: number, y: number, z: number };
    uv: { x: number, y: number };
  } | null;
  toScreenPosition(position: { x: number, y: number, z: number }): { x: number, y: number } | null;
}
