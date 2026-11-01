
import locationIcon from '../assets/location.svg';
import ratingIcon from '../assets/rating.svg';
import wifiIcon from '../assets/wifi.svg';
import foodIcon from '../assets/food.svg';
import acIcon from '../assets/ac.svg';
import laundryIcon from '../assets/laundry.svg';
import bedIcon from '../assets/bed.svg';
import distanceIcon from '../assets/distance.svg';
import compareIcon from '../assets/compare.svg';

export default function PGCard({ pg, onViewDetails, onAddCompare }) {

  // Common SVG icon styling
  const iconStyle = {
    width: '18px',
    height: '18px',
    objectFit: 'contain',
    flexShrink: 0,
    filter:
      'invert(29%) sepia(92%) saturate(2727%) hue-rotate(239deg) brightness(96%) contrast(93%)',
  };

  // Facility icon styling
  const facilityIconStyle = {
    ...iconStyle,
    width: '19px',
    height: '19px',
    marginRight: '5px',
  };

  return (
    <div className="pg-card">

      {/* PG Image */}
      <div className="pg-image">
        <img
          src={bedIcon}
          alt="PG Room"
          style={{
            width: '48px',
            height: '48px',
            objectFit: 'contain',
            filter: iconStyle.filter,
          }}
        />

        <span className="rating">
          <img
            src={ratingIcon}
            alt=""
            style={{
              ...iconStyle,
              width: '17px',
              height: '17px',
              marginRight: '4px',
            }}
          />
          {pg.rating}
        </span>
      </div>

      <div className="pg-content">

        {/* PG Name */}
        <h3>{pg.name}</h3>

        {/* Location and Distance */}
        <p
          className="pg-location"
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '7px',
          }}
        >
          <img
            src={locationIcon}
            alt=""
            style={iconStyle}
          />

          <span>{pg.location}</span>

          <span style={{ color: '#9CA3AF' }}>·</span>

          <img
            src={distanceIcon}
            alt=""
            style={iconStyle}
          />

          <span>{pg.distanceKm} km</span>
        </p>

        {/* Rent */}
        <p
          className="pg-rent"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          ₹{String(pg.rent ?? '').replace(/₹\s?/g, '').trim()}
          <span>/month</span>
        </p>

        {/* Facilities */}
        <div className="facilities">

          <span
            className={
              pg.facilities?.wifi || pg.facilityKeys?.has('wifi')
                ? 'available'
                : 'disabled'
            }
          >
            <img
              src={wifiIcon}
              alt=""
              style={facilityIconStyle}
            />
            Wi-Fi
          </span>

          <span
            className={
              pg.facilities?.food || pg.facilityKeys?.has('food')
                ? 'available'
                : 'disabled'
            }
          >
            <img
              src={foodIcon}
              alt=""
              style={facilityIconStyle}
            />
            Food
          </span>

          <span
            className={
              pg.facilities?.ac || pg.facilityKeys?.has('ac')
                ? 'available'
                : 'disabled'
            }
          >
            <img
              src={acIcon}
              alt=""
              style={facilityIconStyle}
            />
            AC
          </span>

          <span
            className={
              pg.facilities?.laundry || pg.facilityKeys?.has('laundry')
                ? 'available'
                : 'disabled'
            }
          >
            <img
              src={laundryIcon}
              alt=""
              style={facilityIconStyle}
            />
            Laundry
          </span>

        </div>

        {/* Compare Button */}
        <button
          className="compare-btn"
          onClick={() => onAddCompare(pg)}
          type="button"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px',
            marginTop: '15px',
            backgroundColor: '#172033',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#5145E5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#172033';
          }}
        >
          <img
            src={compareIcon}
            alt=""
            style={{
              ...iconStyle,
              width: '18px',
              height: '18px',
              filter: 'brightness(0) invert(1)',
            }}
          />
          Compare
        </button>

        {/* View Details Button */}
        <button
          className="details-btn"
          onClick={() => onViewDetails(pg)}
          type="button"
        >
          View Details →
        </button>

      </div>
    </div>
  );
}
