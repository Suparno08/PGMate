import "./FormError.css";

export default function FormError({ message, onRetry }) {
  return (
    <div className="form-error" role="alert" aria-live="polite">
      <span className="form-error-icon">⚠️</span>
      <span className="form-error-message">{message}</span>
      {onRetry && (
        <button
          className="form-error-retry"
          onClick={onRetry}
          type="button"
          aria-label="Retry"
        >
          🔄 Retry
        </button>
      )}
    </div>
  );
}
