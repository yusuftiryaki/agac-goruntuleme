declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      src?: string;
      alt?: string;
      ar?: boolean;
      'camera-controls'?: boolean;
      'auto-rotate'?: boolean;
    }, HTMLElement>;
  }
}
