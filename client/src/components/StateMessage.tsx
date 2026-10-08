type StateMessageProps = {
  title: string;
  message?: string;
};

export function StateMessage({ title, message }: StateMessageProps) {
  return (
    <div className="state-message">
      <strong>{title}</strong>
      {message ? <span>{message}</span> : null}
    </div>
  );
}
