import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { LanguageCard } from './LanguageCard';

export function LanguageRail() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/languages/stats`);
        const data = await response.json();
        // Show top 8 languages
        setLanguages((data.languages || []).slice(0, 8));
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  if (loading) {
    return (
      <div className="mb-12">
        <div className="mb-6 px-1">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Popular Languages
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="min-w-[240px] h-[180px] rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (languages.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <div className="mb-6 px-1 flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Popular Languages
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Explore content in your language
          </p>
        </div>
        <Link 
          to="/languages" 
          className="text-sm text-[hsl(var(--primary))] hover:underline flex items-center gap-1 font-semibold"
          style={{ fontFamily: 'Space Grotesk' }}
        >
          View All <ChevronRight size={16} />
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4">
        {languages.map((lang, index) => (
          <motion.div
            key={lang.code}
            className="min-w-[240px]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <LanguageCard language={lang} count={lang.count} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
