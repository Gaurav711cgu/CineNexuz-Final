import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

/**
 * OTT Provider Badge Component
 * - Displays provider logo + name
 * - Links to provider's watch page
 * - Glassmorphism with hover effects
 */

const PROVIDER_LOGOS = {
  'Netflix': 'https://image.tmdb.org/t/p/original/9A1JSVmSxsyaBK4SUFsYVqbAYfW.jpg',
  'Amazon Prime Video': 'https://image.tmdb.org/t/p/original/dQeAar5H991VYporEjUspolDarG.jpg',
  'Disney Plus': 'https://image.tmdb.org/t/p/original/7Fl8ylPDclt3ZYgNbW2t7rbZE9I.jpg',
  'Apple TV Plus': 'https://image.tmdb.org/t/p/original/6uhKBfmtzFqOcLousHwZuzcrScK.jpg',
  'Hulu': 'https://image.tmdb.org/t/p/original/pqUTCleNUiTLAVlelGxUgWn1ELh.jpg',
  'HBO Max': 'https://image.tmdb.org/t/p/original/aS2zvJWn9mwiCOeaaCkIh4wleZS.jpg',
  'Paramount Plus': 'https://image.tmdb.org/t/p/original/j4yw1sCb4P9sxX2Qs3uIx4k0RHZ.jpg',
  'Peacock': 'https://image.tmdb.org/t/p/original/xTVM8uXT9QocigQ1hQBApX2eI7B.jpg',
  'YouTube Premium': 'https://image.tmdb.org/t/p/original/9V1i4zyxdBGbnFJX7NN3hj1s2R8.jpg',
  'Crunchyroll': 'https://image.tmdb.org/t/p/original/mXeC4TrcgdU6ltE9bCBCEORwSQR.jpg',
};

export function ProviderBadge({ provider, type = 'flatrate', link, className = '' }) {
  const logoUrl = provider.logo_path 
    ? `https://image.tmdb.org/t/p/original${provider.logo_path}` 
    : PROVIDER_LOGOS[provider.provider_name] || null;

  const typeLabels = {
    flatrate: 'Stream',
    rent: 'Rent',
    buy: 'Buy',
    ads: 'Watch Free',
  };

  const typeColors = {
    flatrate: 'from-[hsl(var(--accent))] to-blue-600',
    rent: 'from-yellow-600 to-orange-600',
    buy: 'from-green-600 to-emerald-600',
    ads: 'from-purple-600 to-pink-600',
  };

  const gradient = typeColors[type] || 'from-gray-600 to-slate-600';

  const handleClick = () => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      className={`relative overflow-hidden rounded-lg bg-[hsl(var(--card))] border border-white/10
        shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group ${className}`}
      data-testid={`provider-badge-${provider.provider_id}`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 
        group-hover:opacity-20 transition-opacity duration-200`} />

      <div className="relative p-3 flex items-center gap-3">
        {/* Provider logo */}
        {logoUrl && (
          <div className="w-12 h-12 rounded-md overflow-hidden bg-white flex-shrink-0 shadow-sm">
            <img 
              src={logoUrl} 
              alt={provider.provider_name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-full h-full hidden items-center justify-center bg-[hsl(var(--muted))] text-xs font-bold text-[hsl(var(--muted-foreground))]">
              {provider.provider_name.charAt(0)}
            </div>
          </div>
        )}

        {/* Provider info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[hsl(var(--foreground))] truncate mb-0.5" 
              style={{ fontFamily: 'Space Grotesk' }}>
            {provider.provider_name}
          </h4>
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
            bg-gradient-to-r ${gradient} text-white text-xs font-semibold`}>
            <span>{typeLabels[type]}</span>
            {link && <ExternalLink size={10} />}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Provider List Container
 * - Groups providers by type (stream, rent, buy)
 * - Responsive grid layout
 */
export function ProviderList({ providers, watchLink, className = '' }) {
  if (!providers || Object.keys(providers).length === 0) {
    return (
      <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
        <p>No streaming information available</p>
      </div>
    );
  }

  const { flatrate = [], rent = [], buy = [], ads = [] } = providers;
  const allProviders = [...flatrate, ...rent, ...buy, ...ads];

  if (allProviders.length === 0) {
    return (
      <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
        <p>Not available for streaming in your region</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {flatrate.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">
            Stream Now
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {flatrate.map((provider) => (
              <ProviderBadge 
                key={provider.provider_id} 
                provider={provider} 
                type="flatrate"
                link={watchLink}
              />
            ))}
          </div>
        </div>
      )}

      {rent.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">
            Rent
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {rent.map((provider) => (
              <ProviderBadge 
                key={provider.provider_id} 
                provider={provider} 
                type="rent"
                link={watchLink}
              />
            ))}
          </div>
        </div>
      )}

      {buy.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">
            Buy
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {buy.map((provider) => (
              <ProviderBadge 
                key={provider.provider_id} 
                provider={provider} 
                type="buy"
                link={watchLink}
              />
            ))}
          </div>
        </div>
      )}

      {ads.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3">
            Watch Free (with ads)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ads.map((provider) => (
              <ProviderBadge 
                key={provider.provider_id} 
                provider={provider} 
                type="ads"
                link={watchLink}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
