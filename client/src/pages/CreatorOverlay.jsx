import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function CreatorOverlay() {
  const [searchParams] = useSearchParams();
  const code = useMemo(() => {
    const value = searchParams.get('code') || '';
    return value.trim().toUpperCase() || 'TU-CODIGO';
  }, [searchParams]);

  return (
    <div className="creator-overlay-root">
      <div className="creator-overlay-bg" aria-hidden="true" />
      <div className="creator-overlay-card" role="presentation">
        <div className="creator-overlay-brand">WelyAlerts</div>
        <div className="creator-overlay-line">
          <span className="creator-overlay-text">Code:</span>
          <span className="creator-overlay-code">{code}</span>
          <span className="creator-overlay-text">welyalerts.com</span>
        </div>
        <div className="creator-overlay-tagline">Alertas pro para tu stream</div>
      </div>
      <div className="creator-overlay-scan" aria-hidden="true" />
    </div>
  );
}
