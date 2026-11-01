
import { useState, useRef, useEffect } from 'react';

import SearchCard from '../components/SearchCard';
import ResultsSection from '../components/ResultsSection';
import PGDetails from '../components/PGDetails';
import CompareView from '../components/CompareView';
import Features from '../components/Features';
import AssistantChat from '../components/AssistantChat';

import { useSearchPG } from '../hooks/useApiQueries';
import { useAuth } from '../contexts/AuthContext';
import Hero from '../components/Hero';

export default function HomePage() {
  const { user } = useAuth();

  const [selectedPG, setSelectedPG] = useState(null);
  const [comparePGs, setComparePGs] = useState([]);
  const [searchParams, setSearchParams] = useState(null);
  const [assistantResults, setAssistantResults] = useState([]);

  // Section references
  const resultsRef = useRef(null);
  const detailsRef = useRef(null);
  const compareRef = useRef(null);

  // Fetch normal search results
  const searchQuery = useSearchPG(searchParams);

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError
  } = searchQuery;

  // Decide which results to display
  const results = searchParams
    ? (searchResults?.data || [])
    : assistantResults;

  // Scroll to PG Details when opened
  useEffect(() => {
    if (selectedPG && detailsRef.current) {
      detailsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [selectedPG]);

  // Automatically scroll to Compare section
  useEffect(() => {
    if (comparePGs.length > 0 && compareRef.current) {
      compareRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [comparePGs]);

  // Scroll Reveal Animation
  useEffect(() => {
    const elements = document.querySelectorAll(
      '.reveal-on-scroll:not(.is-visible)'
    );

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12
      }
    );

    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [selectedPG, comparePGs.length]);

  // Normal PG search
  const handleSearch = (params) => {
    setAssistantResults([]);
    setSearchParams(params);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: 'smooth'
      });
    }, 100);
  };

  // Open PG details
  const handleViewDetails = (pg, matchedPGs) => {
    if (Array.isArray(matchedPGs)) {
      setAssistantResults(matchedPGs);
      setSearchParams(null);
    }

    setSelectedPG(pg);
  };

  // Add PG to comparison
  const handleAddCompare = (pg) => {
    setComparePGs((prev) => {
      // Prevent duplicate PGs
      if (prev.some(item => item.id === pg.id)) {
        return prev;
      }

      // Maximum 4 PGs
      if (prev.length >= 4) {
        return prev;
      }

      return [...prev, pg];
    });
  };

  // Remove PG from comparison
  const handleRemoveCompare = (id) => {
    setComparePGs((prev) =>
      prev.filter(item => item.id !== id)
    );
  };

  // Close PG details
  const handleCloseDetails = () => {
    setSelectedPG(null);

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  return (
    <main id="home">

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <Hero />
          <SearchCard onSearch={handleSearch} />
        </div>
      </section>

      {/* Search Results */}
      <div
        ref={resultsRef}
        className="reveal-on-scroll"
      >
        <ResultsSection
          results={results}
          isLoading={searchParams ? isSearching : false}
          error={searchParams ? searchError : null}
          onViewDetails={handleViewDetails}
          onAddCompare={handleAddCompare}
          onRetry={() => {
            if (searchParams) {
              setSearchParams({ ...searchParams });
            }
          }}
        />
      </div>

      {/* PG Details */}
      {selectedPG && (
        <div
          ref={detailsRef}
          id="pg-details"
          className="reveal-on-scroll"
        >
          <PGDetails
            pg={selectedPG}
            isAuthenticated={!!user}
            onClose={handleCloseDetails}
          />
        </div>
      )}

      {/* Compare Section */}
      {comparePGs.length > 0 && (
        <div
          ref={compareRef}
          className="reveal-on-scroll"
        >
          <CompareView
            comparePGs={comparePGs}
            onRemove={handleRemoveCompare}
          />
        </div>
      )}

      {/* Features Section */}
      <div className="reveal-on-scroll">
        <Features />
      </div>

      {/* AI Assistant */}
      <div className="reveal-on-scroll">
        <AssistantChat
          onViewDetails={handleViewDetails}
          _onAddCompare={handleAddCompare}
        />
      </div>

      {/* Footer / Contact Support */}
      <footer className="pgmate-footer">
        <div className="footer-brand">
          <h2>PG<span>Mate</span></h2>
          <p>Find a place that feels like home.</p>
        </div>

        <div className="footer-support">
          <h3>Contact Support</h3>
          <a href="mailto:suparnodas08@gmail.com">
            suparnodas08@gmail.com
          </a>
        </div>

        <p className="footer-copyright">
          © {new Date().getFullYear()} PGMate. All rights reserved.
        </p>
      </footer>

    </main>
  );
}
