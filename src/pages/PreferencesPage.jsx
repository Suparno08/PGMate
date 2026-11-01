import { useState, useEffect } from 'react';
import { useNavigate } from '../router';
import { useAuth } from '../contexts/AuthContext';
import { useGetPreferences, useSavePreferences } from '../hooks/useApiQueries';
import { validators } from '../utils/validators';
import FormError from '../components/FormError';

/**
 * PreferencesPage - User preferences (location, budget, facilities)
 */
export default function PreferencesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: prefs } = useGetPreferences(user?.userId);
  const { mutate: savePref, isPending, error: saveError } = useSavePreferences();

  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState(7000);
  const [facilities, setFacilities] = useState({
    wifi: false,
    food: false,
    ac: false,
    laundry: false,
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Prefill from fetched preferences
  useEffect(() => {
    if (prefs) {
      setLocation(prefs.preferredLocation || '');
      setBudget(prefs.maxBudget || 7000);
      if (prefs.requiredFacilities?.length) {
        const fac = {};
        prefs.requiredFacilities.forEach(f => { fac[f] = true; });
        setFacilities(prev => ({ ...prev, ...fac }));
      }
    }
  }, [prefs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    // Validate location (optional, but if provided must be < 100 chars)
    const locErr = location ? validators.location(location) : '';
    if (locErr) {
      setError(locErr);
      return;
    }

    // Validate budget
    const budgetErr = validators.budget(budget);
    if (budgetErr) {
      setError(budgetErr);
      return;
    }

    const requiredFacilities = Object.entries(facilities)
      .filter(([_key, enabled]) => enabled)
      .map(([key]) => key);

    try {
      await savePref({
        preferredLocation: location,
        maxBudget: budget,
        requiredFacilities,
      });
      setSuccess('Preferences saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save preferences');
    }
  };

  const handleFacilityToggle = (key) => {
    setFacilities(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7f9fc',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '18px', color: '#172033', marginBottom: '20px' }}>
            Please sign in to view preferences
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#5146e5',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f7f9fc',
      padding: '60px 7%',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 10px 35px rgba(31, 41, 65, 0.1)',
      }}>
        <h1 style={{ fontSize: '32px', color: '#172033', marginBottom: '8px' }}>
          My Preferences
        </h1>

        <p style={{ color: '#697386', marginBottom: '30px', fontSize: '16px' }}>
          Customize your PG search preferences to get better recommendations.
        </p>

        {success && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: '#ecfdf3',
            border: '1px solid #d1fae5',
            borderRadius: '8px',
            color: '#065f46',
            fontSize: '14px',
          }}>
            ✓ {success}
          </div>
        )}

        {error && (
          <FormError 
            message={error}
            onRetry={() => setError('')}
          />
        )}

        {saveError && (
          <FormError 
            message={saveError}
            onRetry={() => setError(saveError)}
          />
        )}

        <form onSubmit={handleSubmit}>
          {/* Location */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '10px',
              color: '#26334b',
            }}>
              📍 Preferred Location
            </label>
            <input
              id="prefs-location"
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Agarpara, Sodepur, Belgharia"
              maxLength="100"
              aria-describedby={error ? 'prefs-error' : undefined}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid #dce1eb',
                borderRadius: '10px',
                fontSize: '15px',
                outline: 'none',
                backgroundColor: '#fafbfe',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#5146e5';
                e.target.style.boxShadow = '0 0 0 3px rgba(81, 70, 229, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#dce1eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Budget */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '10px',
              color: '#26334b',
            }}>
              💰 Maximum Budget
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
            }}>
              <input
                id="prefs-budget"
                type="range"
                min="1000"
                max="100000"
                step="500"
                value={budget}
                onChange={(e) => {
                  setBudget(Number(e.target.value));
                  if (error) setError('');
                }}
                style={{
                  flex: 1,
                  accentColor: '#5146e5',
                  cursor: 'pointer',
                }}
                aria-label="Budget range"
                aria-valuemin="1000"
                aria-valuemax="100000"
                aria-valuenow={budget}
                aria-valuetext={`₹${budget} per month`}
              />
              <span style={{
                minWidth: '80px',
                textAlign: 'center',
                padding: '8px 12px',
                backgroundColor: '#eeedff',
                color: '#5146e5',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
              }}>
                ₹{budget}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#9ca3af', margin: '8px 0 0 0' }}>
              Range: ₹1,000 – ₹100,000/month
            </p>
          </div>

          {/* Facilities */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '700',
              marginBottom: '15px',
              color: '#26334b',
            }}>
              🏠 Required Facilities
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}>
              {[
                { key: 'wifi', label: '📶 Wi-Fi' },
                { key: 'food', label: '🍱 Food' },
                { key: 'ac', label: '❄️ AC' },
                { key: 'laundry', label: '🧺 Laundry' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: facilities[key] ? '#eeedff' : '#f3f4f8',
                    border: `2px solid ${facilities[key] ? '#5146e5' : '#e8eaf1'}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = facilities[key] ? '#e8e3ff' : '#f0f1f7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = facilities[key] ? '#eeedff' : '#f3f4f8';
                  }}
                >
                  <input
                    type="checkbox"
                    checked={facilities[key]}
                    onChange={() => handleFacilityToggle(key)}
                    style={{
                      marginRight: '8px',
                      cursor: 'pointer',
                      accentColor: '#5146e5',
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#5146e5',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => !isPending && (e.target.style.backgroundColor = '#4038c7')}
            onMouseLeave={(e) => !isPending && (e.target.style.backgroundColor = '#5146e5')}
            aria-busy={isPending}
          >
            {isPending ? 'Saving...' : 'Save Preferences'}
          </button>
        </form>
      </div>
    </div>
  );
}
