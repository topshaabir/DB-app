type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="progress-wrap" aria-label={label}>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${safeValue}%` }} />
      </div>
      {label ? <span>{label}</span> : null}
    </div>
  );
}
