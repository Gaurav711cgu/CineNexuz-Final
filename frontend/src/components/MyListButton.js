import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus } from 'lucide-react';
import { myListAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export default function MyListButton({ movieId, size = 'default', className = '' }) {
  const { user } = useAuth();
  const [isInList, setIsInList] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkIfInList();
  }, [movieId, user]);

  async function checkIfInList() {
    if (!user) return;
    try {
      const res = await myListAPI.get();
      setIsInList(res.data.movies.some(m => m._id === movieId));
    } catch (err) {
      console.error('Failed to check list:', err);
    }
  }

  async function handleToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Sign in to add to your list');
      return;
    }

    setLoading(true);
    try {
      if (isInList) {
        await myListAPI.remove(movieId);
        setIsInList(false);
        toast.success('Removed from My List');
      } else {
        await myListAPI.add(movieId);
        setIsInList(true);
        toast.success('Added to My List');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update list');
    }
    setLoading(false);
  }

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;

  return (
    <motion.button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-full border-2 transition-all ${
        isInList
          ? 'bg-white border-white text-black'
          : 'bg-transparent border-white/40 text-white hover:border-white'
      } ${
        size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-9 h-9'
      } flex items-center justify-center ${className}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      data-testid={`mylist-button-${movieId}`}
    >
      <AnimatePresence mode="wait">
        {isInList ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.3 }}
          >
            <Check size={iconSize} strokeWidth={3} />
          </motion.div>
        ) : (
          <motion.div
            key="plus"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: -180 }}
            transition={{ duration: 0.3 }}
          >
            <Plus size={iconSize} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
