import { LoaderCircle } from 'lucide-react';

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = 'Подождите, сервер загружается' }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <LoaderCircle className="loading-spinner" size={24} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
