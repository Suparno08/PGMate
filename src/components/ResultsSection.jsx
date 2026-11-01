
import PGCard from './PGCard';
import FormError from './FormError';

export default function ResultsSection({
  results,
  isLoading,
  error,
  onViewDetails,
  onAddCompare,
  onRetry
}) {
  return (
    <section className="results-section" id="results">
      <div className="section-heading">
        <p>PGMATE RESULTS</p>

        <h2>
          {isLoading
            ? 'Searching...'
            : error
            ? 'Search Error'
            : results.length > 0
            ? `${results.length} PGs found for you`
            : 'Find a PG that fits you'}
        </h2>
      </div>

      {error && (
        <div style={{ maxWidth: '1100px', margin: '0 auto 30px' }}>
          <FormError
            message={error}
            isValidationError={false}
            onRetry={onRetry}
            testId="search-error"
          />
        </div>
      )}

      {isLoading ? (
        <div className="pg-grid loading-grid">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="pg-skeleton"
              role="status"
              aria-label={`Loading PG ${i}`}
            >
              <div className="skeleton-image" />
              <div className="skeleton-content">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-short" />
                <div className="skeleton-line" />
                <div className="skeleton-line skeleton-medium" />
                <div className="skeleton-bottom" />
              </div>
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="pg-grid">
          {results.map((pg) => (
            <PGCard
              key={pg.id}
              pg={pg}
              onViewDetails={onViewDetails}
              onAddCompare={onAddCompare}
            />
          ))}
        </div>
      ) : !error ? (
        <div className="empty-results">
          <div role="img" aria-label="Search icon">🔎</div>

          <h3>No PGs searched yet</h3>

          <p>
            Enter a location and choose your budget
            above to find suitable PGs.
          </p>
        </div>
      ) : null}
    </section>
  );
}
