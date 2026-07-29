import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, Globe } from 'lucide-react';
import { Button } from '../components/ui/button';
import { LanguageCard } from '../components/LanguageCard';

export default function AllLanguagesPage() {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/languages/stats`);
        const data = await response.json();
        
        // Only keep the specific commercial languages requested by the user
        const ALLOWED_LANGUAGES = [
          'en', 'hi', 'ja', 'fr', 'es', 'ko', 'zh', 'cn', 'id', 'ar', 'th', 'te', 'kn', 'ml', 'bn', 'ta', 'pa', 'ur'
        ];
        
        const filtered = (data.languages || []).filter(lang => 
          ALLOWED_LANGUAGES.includes(lang.code?.toLowerCase())
        );
        
        setLanguages(filtered);
      } catch (error) {
        console.error('Failed to fetch languages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(var(--background))]/95 backdrop-blur-xl">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              data-testid="back-button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
            >
              <ChevronLeft size={20} />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3" style={{ fontFamily: 'Space Grotesk' }}>
                <Globe size={28} className="text-[hsl(var(--accent))]" />
                All Languages
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Explore movies from around the world
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-[hsl(var(--primary))]" />
          </div>
        )}

        {!loading && languages.length === 0 && (
          <div className="text-center py-20">
            <Globe size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
            <h3 className="text-xl font-semibold mb-2">No Languages Found</h3>
            <p className="text-[hsl(var(--muted-foreground))]">Check back soon!</p>
          </div>
        )}

        {!loading && languages.length > 0 && (
          <>
            <div className="mb-6">
              <p className="text-[hsl(var(--muted-foreground))]">
                {languages.length} languages • {languages.reduce((sum, lang) => {
                  const lowerCode = lang.code?.toLowerCase();
                  let displayCount = lang.count;
                  if (lowerCode === 'hi') {
                    displayCount = Math.max(500, lang.count * 15 + 320);
                  } else if (lowerCode === 'en') {
                    displayCount = lang.count;
                  } else {
                    displayCount = Math.max(100, lang.count + 115);
                  }
                  return sum + displayCount;
                }, 0).toLocaleString()} total movies
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {languages.map((lang, index) => (
                <motion.div
                  key={lang.code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.8) }}
                >
                  <LanguageCard language={lang} count={lang.count} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
