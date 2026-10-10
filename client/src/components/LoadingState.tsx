import { usePreferences } from '../services/preferences';
import { Info, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type LoadingStateProps = {
  message?: string;
  fullScreen?: boolean;
};

export function LoadingState({ message, fullScreen = true }: LoadingStateProps) {
  const { t } = usePreferences();
  const [showDelayNotice, setShowDelayNotice] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowDelayNotice(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  const delayNotice = showDelayNotice ? (
    <div className="server-delay-notice" role="status" aria-live="polite">
      <Info size={22} aria-hidden="true" />
      <div>
        <strong>{t('waitingServer')}</strong>
        <p>{t('delayNotice')}</p>
      </div>
    </div>
  ) : null;

  useEffect(() => {
    if (!fullScreen) return;
    const root = document.getElementById('root');
    const previousInert = root?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    return () => {
      if (root) root.inert = previousInert;
      document.body.style.overflow = previousOverflow;
    };
  }, [fullScreen]);

  if (fullScreen) {
    return createPortal(
      <div className="loading-screen" role="status" aria-live="polite">
        <div className="loading-screen-content">
          <img className="loading-mascot" src="/images/fluffy-logo-transparent.png" alt="" width={240} height={240} />
          <strong className="loading-screen-brand">Fluffy</strong>
          <h1>{message ?? t('loadingServer')}</h1>
          <div className="loading-screen-track" aria-hidden="true">
            <div className="loading-screen-progress" />
          </div>
          {delayNotice}
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div>
      <div className="loading-state" role="status" aria-live="polite">
        <LoaderCircle className="loading-spinner" size={24} aria-hidden="true" />
        <span>{message ?? t('loadingServer')}</span>
      </div>
      {delayNotice}
    </div>
  );
}
