import { motion } from 'framer-motion';
import { Award, Star, Trophy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';

export function AwardBadge({ type, movie }) {
  const badges = [];

  // Oscar Winner (vote_average > 8.5 and vote_count > 5000)
  if (movie.vote_average >= 8.5 && movie.vote_count >= 5000) {
    badges.push({
      type: 'oscar',
      icon: Trophy,
      label: 'Highly Acclaimed',
      color: '#FFD700',
      glow: 'rgba(255, 215, 0, 0.4)',
    });
  }

  // IMDb Top Rated (vote_average > 8.0)
  if (movie.vote_average >= 8.0) {
    badges.push({
      type: 'imdb',
      icon: Star,
      label: 'Top Rated',
      color: '#F5C518',
      glow: 'rgba(245, 197, 24, 0.4)',
    });
  }

  // Critics Choice (vote_average > 7.5 and vote_count > 3000)
  if (movie.vote_average >= 7.5 && movie.vote_count >= 3000) {
    badges.push({
      type: 'critics',
      icon: Award,
      label: "Critics' Choice",
      color: '#00E4FF',
      glow: 'rgba(0, 228, 255, 0.4)',
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className="flex gap-1">
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <TooltipProvider key={badge.type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.2 }}
                  data-testid={`award-badge-${badge.type}`}
                >
                  <motion.div
                    className="w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-sm border"
                    style={{
                      backgroundColor: `${badge.color}20`,
                      borderColor: `${badge.color}60`,
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 10px ${badge.glow}`,
                        `0 0 20px ${badge.glow}`,
                        `0 0 10px ${badge.glow}`,
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Icon size={12} style={{ color: badge.color }} />
                  </motion.div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-medium">{badge.label}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}

export function MaturityRating({ rating }) {
  const ratings = {
    'G': { label: 'G', color: '#10B981', desc: 'General Audiences' },
    'PG': { label: 'PG', color: '#3B82F6', desc: 'Parental Guidance' },
    'PG-13': { label: 'PG-13', color: '#F59E0B', desc: 'Parents Strongly Cautioned' },
    'R': { label: 'R', color: '#EF4444', desc: 'Restricted' },
    'NC-17': { label: 'NC-17', color: '#DC2626', desc: 'Adults Only' },
    'TV-Y': { label: 'TV-Y', color: '#10B981', desc: 'All Children' },
    'TV-PG': { label: 'TV-PG', color: '#3B82F6', desc: 'Parental Guidance' },
    'TV-14': { label: 'TV-14', color: '#F59E0B', desc: 'Parents Strongly Cautioned' },
    'TV-MA': { label: 'TV-MA', color: '#EF4444', desc: 'Mature Audiences' },
  };

  const config = ratings[rating] || ratings['PG'];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="px-2 py-0.5 rounded text-[10px] font-bold border"
            style={{
              backgroundColor: `${config.color}20`,
              borderColor: `${config.color}60`,
              color: config.color,
            }}
            data-testid={`maturity-rating-${rating}`}
          >
            {config.label}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{config.desc}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
