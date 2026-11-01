
import locationIcon from '../assets/location.svg';
import ratingIcon from '../assets/rating.svg';
import wifiIcon from '../assets/wifi.svg';
import foodIcon from '../assets/food.svg';
import acIcon from '../assets/ac.svg';
import laundryIcon from '../assets/laundry.svg';
import bedIcon from '../assets/bed.svg';
import distanceIcon from '../assets/distance.svg';

export default function CompareView({ comparePGs, onRemove }) {

  if (!comparePGs || comparePGs.length === 0) {
    return null;
  }

  // Common SVG styling
  const iconStyle = {
    width: '19px',
    height: '19px',
    objectFit: 'contain',
    verticalAlign: 'middle',
    marginRight: '6px',
    flexShrink: 0,
    filter:
      'invert(29%) sepia(92%) saturate(2727%) hue-rotate(239deg) brightness(96%) contrast(93%)',
  };

  // Facility display
  const renderFacility = (pg, key, label, icon) => {
    const available =
      pg.facilities?.[key] || pg.facilityKeys?.has(key);

    return (
      <p
        key={key}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          margin: '10px 0',
          color: available ? '#047857' : '#9CA3AF',
        }}
      >
        <img
          src={icon}
          alt=""
          style={{
            ...iconStyle,
            opacity: available ? 1 : 0.4,
          }}
        />

        <span>{label}:</span>

        <span
          style={{
            fontWeight: '600',
            fontSize: '13px',
          }}
        >
          {available ? 'Available' : 'Not available'}
        </span>
      </p>
    );
  };

  // Calculate fit score
  const calculateFitScore = (pg) => {
    const rentScore =
      (1 - (pg.rent - 1000) / (100000 - 1000)) * 30;

    const distanceScore =
      (1 - pg.distanceKm / 10) * 30;

    const ratingScore =
      (pg.rating / 5) * 40;

    return Math.round(rentScore + distanceScore + ratingScore);
  };

  const withScores = comparePGs.map(pg => ({
    ...pg,
    fitScore: calculateFitScore(pg),
  }));

  const bestOverall = withScores.reduce((a, b) =>
    a.fitScore > b.fitScore ? a : b
  );

  return (
    <section className="compare-section" id="compare">

      {/* Section Heading */}
      <div className="section-heading">
        <p>PGMATE COMPARISON</p>

        <h2>Compare Your Selected PGs</h2>
      </div>

      {/* Waiting for second PG */}
      {comparePGs.length < 2 && (
        <div
          style={{
            maxWidth: '700px',
            margin: '0 auto 25px',
            padding: '18px',
            backgroundColor: '#eeedff',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#5146e5',
          }}
        >
          <h3 style={{ margin: '0 0 8px' }}>
            One more PG needed!
          </h3>

          <p style={{ margin: 0 }}>
            Select another PG using the Compare button
            to see the comparison.
          </p>
        </div>
      )}

      {/* Comparison Cards */}
      <div className="compare-grid">

        {withScores.map((pg) => (
          <div
            key={pg.id}
            className="compare-card"
            style={
              withScores.length >= 2 &&
              pg.id === bestOverall.id
                ? {
                    border: '2px solid #5146e5',
                    backgroundColor: '#f9f9ff',
                  }
                : {}
            }
          >

            {/* PG Image */}
            <div
              className="compare-image"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={bedIcon}
                alt="PG Room"
                style={{
                  width: '42px',
                  height: '42px',
                  objectFit: 'contain',
                  filter: iconStyle.filter,
                }}
              />
            </div>

            {/* PG Name */}
            <h3>{pg.name}</h3>

            {/* Location */}
            <p
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <img
                src={locationIcon}
                alt=""
                style={iconStyle}
              />
              {pg.location}
            </p>

            {/* Rent - Always show only one Rupee symbol */}
            <h3
              className="compare-rent"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              ₹{String(pg.rent ?? '').replace(/₹\s?/g, '').trim()}
              <span>/month</span>
            </h3>

            {/* Rating */}
            <p
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <img
                src={ratingIcon}
                alt=""
                style={iconStyle}
              />
              {pg.rating} Rating
            </p>

            {/* Distance */}
            <p
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <img
                src={distanceIcon}
                alt=""
                style={iconStyle}
              />
              {pg.distanceKm} km
            </p>

            {/* Facilities */}
            <div className="compare-facilities">

              {renderFacility(pg, 'wifi', 'Wi-Fi', wifiIcon)}

              {renderFacility(pg, 'food', 'Food', foodIcon)}

              {renderFacility(pg, 'ac', 'AC', acIcon)}

              {renderFacility(pg, 'laundry', 'Laundry', laundryIcon)}

            </div>

            {/* Fit Score */}
            <div
              style={{
                marginTop: '15px',
                padding: '12px',
                backgroundColor: '#eeedff',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  margin: '0 0 5px',
                  fontSize: '13px',
                  color: '#667085',
                }}
              >
                Fit Score
              </p>

              <p
                style={{
                  margin: 0,
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#5146e5',
                }}
              >
                {pg.fitScore}%
              </p>

              {withScores.length >= 2 &&
                pg.id === bestOverall.id && (
                  <p
                    style={{
                      margin: '5px 0 0',
                      fontSize: '12px',
                      color: '#5146e5',
                      fontWeight: '600',
                    }}
                  >
                    Best Overall
                  </p>
                )}
            </div>

            {/* Remove Button */}
            <button
              className="remove-compare"
              onClick={() => onRemove(pg.id)}
              type="button"
            >
              Remove
            </button>

          </div>
        ))}

      </div>
    </section>
  );
}
