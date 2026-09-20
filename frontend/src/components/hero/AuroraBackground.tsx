import type { CSSProperties } from 'react';

interface AuroraStyle extends CSSProperties {
  '--aurora-1': string;
  '--aurora-2': string;
  '--aurora-3': string;
  '--aurora-blend': string;
  '--aurora-speed': string;
  '--aurora-amp': string;
}

export function AuroraBackground() {
  return (
    <div
      className="aurora"
      style={{
        '--aurora-1': 'rgba(13, 148, 136, 0.34)',
        '--aurora-2': 'rgba(124, 58, 237, 0.26)',
        '--aurora-3': 'rgba(245, 158, 11, 0.14)',
        '--aurora-blend': '0.72',
        '--aurora-speed': '20s',
        '--aurora-amp': '1',
      } as AuroraStyle}
      aria-hidden="true"
    >
      <div className="aurora__blob aurora__blob--a" />
      <div className="aurora__blob aurora__blob--b" />
      <div className="aurora__blob aurora__blob--c" />
      <div className="aurora__grain" />
    </div>
  );
}
