/**
 * Features - Display feature cards showcasing PGMate capabilities
 */
export default function Features() {
  return (
    <section className="features" id="find">
      <div className="section-heading">
        <p>
          WHY PGMATE?
        </p>

        <h2>
          Everything you need to find a place
        </h2>
      </div>

      <div className="feature-grid">
        <div className="feature-card">
          <div className="feature-icon">
            🔍
          </div>

          <h3>
            Smart Search
          </h3>

          <p>
            Find PGs based on your location,
            budget and lifestyle preferences.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            🤖
          </div>

          <h3>
            AI Recommendations
          </h3>

          <p>
            Get personalized recommendations
            based on what matters to you.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            ⚖️
          </div>

          <h3>
            Compare PGs
          </h3>

          <p>
            Compare rent, distance, food,
            Wi-Fi and other facilities in one place.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">
            💰
          </div>

          <h3>
            Budget Friendly
          </h3>

          <p>
            Calculate your estimated monthly
            accommodation expenses before deciding.
          </p>
        </div>
      </div>
    </section>
  );
}
