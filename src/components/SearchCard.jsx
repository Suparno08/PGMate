import { useState } from 'react';
import { validators } from '../utils/validators';
import FormError from './FormError';

/**
 * SearchCard - Search form for location and budget
 * Validates inputs and provides user feedback
 */
export default function SearchCard({ onSearch }) {
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState(7000);
  const [error, setError] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs
    const validation = validators.searchParams({ location, maxBudget: budget });

    if (validation) {
      // Validation failed, show error
      setError(validation);
      return;
    }

    // Validation passed, trigger search
    onSearch({ location, maxBudget: budget });
  };

  return (
    <form className="search-card" onSubmit={handleSearch}>
      {error && (
        <FormError 
          message={error}
          isValidationError={true}
          onRetry={() => setError('')}
        />
      )}

      <div className="input-group">
        <label htmlFor="location">
          📍 Where do you want to stay?
        </label>

        <input
          id="location"
          type="text"
          placeholder="e.g. Agarpara, Sodepur, Belgharia"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            if (error) setError('');
          }}
          maxLength="100"
          aria-describedby={error ? 'search-error' : undefined}
          title="Enter a location"
        />
        <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          Leave empty to search all locations
        </span>
      </div>

      <div className="input-group">
        <label htmlFor="budget">
          💰 Monthly Budget
        </label>

        <div className="budget-row">
          <input
            id="budget"
            type="range"
            min="3000"
            max="15000"
            step="500"
            value={budget}
            onChange={(e) => {
              setBudget(Number(e.target.value));
              if (error) setError('');
            }}
            aria-label="Budget range"
            aria-valuemin="3000"
            aria-valuemax="15000"
            aria-valuenow={budget}
            aria-valuetext={`₹${budget} per month`}
          />

          <span>
            ₹{budget}
          </span>
        </div>
        <span style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          Range: ₹3,000 – ₹15,000/month
        </span>
      </div>

      <button
        type="submit"
        className="search-btn"
        aria-label={`Find PGs with location ${location || 'any'} and budget ₹${budget}`}
      >
        Find My PG →
      </button>
    </form>
  );
}
