import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ThumbsUp, ThumbsDown, Minus, Sparkles } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

const SENTIMENT_CONFIG = {
  Positive: {
    icon: ThumbsUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
  },
  Negative: {
    icon: ThumbsDown,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
  },
  Mixed: {
    icon: Minus,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
  },
};

export function ReviewSummary({ movieId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/movies/${movieId}/reviews-summary`
        );
        
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        } else {
          setError('Unable to load review summary');
        }
      } catch (err) {
        console.error('Failed to load review summary:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    }
    
    if (movieId) {
      loadSummary();
    }
  }, [movieId]);

  if (loading) {
    return (
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-[hsl(var(--primary))]" />
        </div>
      </Card>
    );
  }

  if (error || !summary) {
    return null;
  }

  const sentimentConfig = SENTIMENT_CONFIG[summary.sentiment] || SENTIMENT_CONFIG.Mixed;
  const SentimentIcon = sentimentConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6 bg-gradient-to-br from-white/5 to-white/10 border-white/10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${sentimentConfig.bgColor}`}>
              <Sparkles size={20} className="text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>
                AI Review Summary
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {summary.review_count} {summary.review_count === 1 ? 'review' : 'reviews'} analyzed
              </p>
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={`${sentimentConfig.color} ${sentimentConfig.bgColor} ${sentimentConfig.borderColor} border`}
          >
            <SentimentIcon size={14} className="mr-1" />
            {summary.sentiment}
          </Badge>
        </div>

        {/* Summary Text */}
        <div className="mb-4">
          <p className="text-sm leading-relaxed text-[hsl(var(--foreground))]">
            {summary.summary}
          </p>
        </div>

        {/* Highlights */}
        {summary.highlights && summary.highlights.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 text-[hsl(var(--muted-foreground))]">
              Key Points:
            </h4>
            <ul className="space-y-2">
              {summary.highlights.map((highlight, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start gap-2 text-sm text-[hsl(var(--muted-foreground))]"
                >
                  <span className="mt-1 text-[hsl(var(--primary))]">•</span>
                  <span>{highlight}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        {/* Source Badge */}
        {summary.source === 'ai_summarized' && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <Sparkles size={12} />
              Powered by AI analysis
            </p>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
