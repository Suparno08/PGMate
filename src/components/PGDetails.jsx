/**
 * PGDetails - Modal/section to display full PG details
 * Shows contact info only when authenticated
 */
export default function PGDetails({ pg, isAuthenticated, onClose }) {
  if (!pg) return null;

  return (
    <section className="pg-details-section">
      <div className="pg-details-card">
        <button
          className="back-btn"
          onClick={onClose}
        >
          ← Back to Results
        </button>

        <h2>
          {pg.name}
        </h2>

        <p>
          📍 {pg.location}
        </p>

        <p>
          📏 {pg.distanceKm} km
        </p>

        <h3>
          ₹{pg.rent}/month
        </h3>

        <p>
          ⭐ {pg.rating} Rating
        </p>

        {pg.description && (
          <p style={{ color: '#697386', marginTop: '15px', lineHeight: '1.6' }}>
            {pg.description}
          </p>
        )}

        <div className="details-facilities">
          <span className={pg.facilities?.wifi || pg.facilityKeys?.has('wifi') ? 'available' : 'disabled'}>
            📶 Wi-Fi
          </span>

          <span className={pg.facilities?.food || pg.facilityKeys?.has('food') ? 'available' : 'disabled'}>
            🍱 Food
          </span>

          <span className={pg.facilities?.ac || pg.facilityKeys?.has('ac') ? 'available' : 'disabled'}>
            ❄️ AC
          </span>

          <span className={pg.facilities?.laundry || pg.facilityKeys?.has('laundry') ? 'available' : 'disabled'}>
            🧺 Laundry
          </span>
        </div>

        {isAuthenticated && pg.contact ? (
          <div style={{ marginTop: '25px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '700' }}>
              Contact Details
            </h4>
            <p style={{ color: '#697386', marginBottom: '5px' }}>
              📞 Phone: {pg.contact.phone}
            </p>
            <p style={{ color: '#697386' }}>
              📧 Email: {pg.contact.email}
            </p>
            <button className="contact-btn">
              📞 Contact Owner
            </button>
          </div>
        ) : !isAuthenticated ? (
          <p style={{ marginTop: '25px', color: '#e67e22', fontSize: '14px' }}>
            🔒 Sign in to view contact details
          </p>
        ) : null}
      </div>
    </section>
  );
}
