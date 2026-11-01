import { useState, useRef } from 'react';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Hero, { HeroVisual } from './components/Hero';
import SearchCard from './components/SearchCard';
import ResultsSection from './components/ResultsSection';
import PGDetails from './components/PGDetails';
import CompareView from './components/CompareView';
import Features from './components/Features';
import AssistantChat from './components/AssistantChat';
import Footer from './components/Footer';
import { useSearchPG } from './hooks/useApiQueries';
import { useAuth } from './contexts/AuthContext';

/**
 * App Component
 * Main container wrapping the entire SPA.
 * Preserves the existing UI/CSS while using refactored components.
 * P5–P6: Frontend foundation + features with placeholder API integration.
 */
function App() {
  const { user } = useAuth();
  const [selectedPG, setSelectedPG] = useState(null);
  const [comparePGs, setComparePGs] = useState([]);
  const [searchParams, setSearchParams] = useState(null);
  const resultsRef = useRef(null);

  // Fetch search results using React Query
  const { data: searchResults, isLoading: isSearching } = useSearchPG(searchParams);
  const results = searchResults?.data || [];

  // Handle search submission
  const handleSearch = (params) => {
    setSearchParams(params);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Handle PG selection
  const handleViewDetails = (pg) => {
    setSelectedPG(pg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add to comparison
  const handleAddCompare = (pg) => {
    if (!comparePGs.some(item => item.id === pg.id)) {
      setComparePGs([...comparePGs, pg]);
    }
  };

  // Remove from comparison
  const handleRemoveCompare = (id) => {
    setComparePGs(comparePGs.filter(item => item.id !== id));
  };

  return (
    <ErrorBoundary>
      <div className="app">
        <Navbar />

        <main id="home">
          <section className="hero">
            <div className="hero-left">
              <Hero />
              <SearchCard onSearch={handleSearch} />
            </div>
            <HeroVisual />
          </section>

          <div ref={resultsRef}>
            <ResultsSection
              results={results}
              isLoading={isSearching}
              onViewDetails={handleViewDetails}
              onAddCompare={handleAddCompare}
            />
          </div>

          {selectedPG && (
            <PGDetails
              pg={selectedPG}
              isAuthenticated={!!user}
              onClose={() => setSelectedPG(null)}
            />
          )}

          <CompareView
            comparePGs={comparePGs}
            onRemove={handleRemoveCompare}
          />

          <Features />

          <AssistantChat
            onViewDetails={handleViewDetails}
            onAddCompare={handleAddCompare}
          />
        </main>

        <Footer />
      </div>
    </ErrorBoundary>
  );
}

/**
 * Root App with providers
 * Wraps App in AuthProvider and other contexts for state management
 */
function AppWithProviders() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

export default AppWithProviders;
