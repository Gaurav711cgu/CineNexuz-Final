import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronDown, ChevronUp, Brain } from 'lucide-react';

// Shimmer skeleton for loading state
const MovieCardSkeleton = () => (
    <div className="w-36 h-52 rounded-xl bg-slate-800 animate-pulse flex-shrink-0">
        <div className="h-40 bg-slate-700 rounded-t-xl"></div>
        <div className="p-2 space-y-1">
            <div className="h-2 bg-slate-700 rounded w-3/4"></div>
            <div className="h-2 bg-slate-700 rounded w-1/2"></div>
        </div>
    </div>
);

// Individual movie card with 'Why this?' explainer
const RecommendedMovieCard = ({ movie, index }) => {
    const [showWhy, setShowWhy] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, type: 'spring', stiffness: 200 }}
            className="w-36 flex-shrink-0 group relative cursor-pointer"
        >
            {/* Neural Network Badge */}
            <div className="absolute -top-2 -right-2 z-10">
                <div className="flex items-center gap-1 bg-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-full shadow-lg shadow-purple-900/50">
                    <Brain className="w-2.5 h-2.5" />
                    <span>Neural Match</span>
                </div>
            </div>

            {/* Movie Poster */}
            <div className="h-48 bg-slate-800 rounded-xl overflow-hidden border border-slate-700 group-hover:border-purple-500 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <span className="text-slate-500 text-xs text-center px-2">{movie.title}</span>
                </div>
            </div>

            {/* Score */}
            <div className="mt-1 px-1 flex items-center justify-between">
                <p className="text-white text-xs font-medium truncate">{movie.title}</p>
                <span className="text-green-400 text-[10px] font-mono">{(movie.score * 100).toFixed(0)}%</span>
            </div>

            {/* Why this? toggle */}
            <button
                onClick={() => setShowWhy(!showWhy)}
                className="mt-1 w-full flex items-center justify-between text-[10px] text-slate-400 hover:text-purple-400 transition-colors px-1"
            >
                <span>Why this?</span>
                {showWhy ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <AnimatePresence>
                {showWhy && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="absolute z-20 bottom-full mb-2 left-0 w-56 bg-slate-900 border border-purple-700 rounded-lg p-3 shadow-xl shadow-purple-900/30"
                    >
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                            {movie.reason || `Matched because you watched similar titles at ${movie.context?.time_of_day || 'night'} on ${movie.context?.device || 'mobile'}.`}
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-800">
                            <p className="text-[10px] text-purple-400 font-mono">Neural Confidence: {(movie.score * 100).toFixed(1)}%</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default function TwoTowerRecommendations({ userId }) {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call to Two-Tower model inference endpoint
        const fetchRecommendations = async () => {
            setLoading(true);
            await new Promise(r => setTimeout(r, 1200)); // Simulate network latency
            setRecommendations([
                { id: 1, title: 'Blade Runner 2049', score: 0.94, reason: 'Your late-night watch history strongly matches neo-noir sci-fi on mobile.', context: { time_of_day: '11PM', device: 'mobile' } },
                { id: 2, title: 'Dune: Part Two', score: 0.91, reason: 'Epic world-building and slow-burn narrative aligns with your viewing pattern.', context: { time_of_day: '9PM', device: 'TV' } },
                { id: 3, title: 'Arrival', score: 0.89, reason: 'You consistently rate cerebral, non-linear narratives 4.5+ stars.', context: {} },
                { id: 4, title: 'Severance', score: 0.87, reason: 'Matches your preference for psychological tension with surreal workplace settings.', context: {} },
                { id: 5, title: 'Everything Everywhere', score: 0.85, reason: 'Multi-verse structure matches your recent watch pattern of films rated by friends.', context: {} },
            ]);
            setLoading(false);
        };
        fetchRecommendations();
    }, [userId]);

    return (
        <section className="py-8">
            <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Recommended For You</h2>
                <span className="text-xs bg-purple-900/50 text-purple-300 border border-purple-700 px-2 py-1 rounded-full">
                    Two-Tower Neural Network
                </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {loading
                    ? Array(5).fill(0).map((_, i) => <MovieCardSkeleton key={i} />)
                    : recommendations.map((movie, i) => (
                        <RecommendedMovieCard key={movie.id} movie={movie} index={i} />
                    ))
                }
            </div>

            <p className="text-xs text-slate-500 mt-3">
                Powered by a Two-Tower Neural Network — same architecture used by YouTube and Amazon Prime Video.
                Query tower runs in real-time (&lt;5ms). Candidate embeddings are pre-computed offline across 50,000+ titles.
            </p>
        </section>
    );
}
