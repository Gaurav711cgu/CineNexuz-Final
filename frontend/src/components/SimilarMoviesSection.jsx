import { useState } from 'react';
import { Link } from 'react-router-dom';
import ContentRail from './ContentRail';

/**
 * SimilarMoviesSection — tabbed view of Similar Movies vs Franchise Parts.
 * Props:
 *   - movieId: string
 *   - franchiseParts: array
 *   - similarMovies: array
 *   - loading: boolean
 */
export default function SimilarMoviesSection({ franchiseParts = [], similarMovies = [], loading = false }) {
  const [activeTab, setActiveTab] = useState(franchiseParts.length > 0 ? 'franchise' : 'similar');

  const tabs = [
    ...(franchiseParts.length > 0 ? [{ id: 'franchise', label: `Franchise Parts (${franchiseParts.length})` }] : []),
    { id: 'similar', label: 'Similar Movies' },
  ];

  const currentItems = activeTab === 'franchise' ? franchiseParts : similarMovies;

  return (
    <div className="mt-8">
      {/* Tab Headers */}
      <div className="flex gap-1 mb-4 border-b border-white/10 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <ContentRail
        loading={loading}
        items={currentItems}
        onMovieClick={(movie) => {
          if (movie._id) window.location.href = `/movie/${movie._id}`;
        }}
      />

      {!loading && currentItems.length === 0 && (
        <p className="text-sm text-white/40 italic">Nothing found in this category.</p>
      )}
    </div>
  );
}
