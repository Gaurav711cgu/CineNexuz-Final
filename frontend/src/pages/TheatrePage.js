import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { moviesAPI, theatreAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { MovieCard, MovieCardSkeleton } from '../components/MovieCard';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import {
  Ticket, MapPin, Calendar, Clock, ChevronRight, ChevronLeft,
  Monitor, Armchair, ShoppingCart, CreditCard, Check, Loader2,
  Utensils, Search, AlertCircle, Percent, ShieldCheck, QrCode
} from 'lucide-react';

const STEPS = ['Location', 'Showtime', 'Seats', 'F&B Add-ons', 'Review', 'Payment'];

// Popular cities presets
const POPULAR_CITIES = [
  'Bhubaneswar',
  'Mumbai',
  'Bengaluru',
  'New Delhi',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata'
];

export default function TheatrePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const movieIdParam = searchParams.get('movie');

  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking wizard state
  const [step, setStep] = useState(-1); // -1 = movie selection view
  const [cities, setCities] = useState([]);
  const [searchCityQuery, setSearchCityQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [shows, setShows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);
  
  // Seat Quantity Popup State
  const [showSeatCountModal, setShowSeatCountModal] = useState(false);
  const [seatCount, setSeatCount] = useState(2);
  const [pendingShow, setPendingShow] = useState(null);

  // Terms & Conditions Modal State
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Seat Grid State
  const [seatData, setSeatData] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [lockInfo, setLockInfo] = useState(null);
  const [timer, setTimer] = useState(0);

  // Meals State
  const [foodMenu, setFoodMenu] = useState([]);
  const [foodCart, setFoodCart] = useState({});

  // Checkout Review State
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // in percentage
  const [activeCoupon, setActiveCoupon] = useState('');

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // UPI, Card, NetBanking
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [upiCountdown, setUpiCountdown] = useState(300); // 5 minutes mock timer
  const [bookingConfirmation, setBookingConfirmation] = useState(null);

  // Initialize dates list dynamically
  const getNext7Days = useCallback(() => {
    const days = [];
    const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayName: weekdays[d.getDay()],
        dayNum: d.getDate(),
        monthName: months[d.getMonth()]
      });
    }
    return days;
  }, []);

  const datesList = getNext7Days();

  // Load now playing movies on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await moviesAPI.nowPlaying(24);
        setMovies(res.data.movies || []);
        if (movieIdParam) {
          const movieRes = await moviesAPI.get(movieIdParam);
          if (movieRes.data) {
            setSelectedMovie(movieRes.data);
            setStep(0); // Go straight to city selection
          }
        }
      } catch (err) {
        console.error('Error loading movies:', err);
      }
      setLoading(false);
    }
    load();
  }, [movieIdParam]);

  // Load cities list
  useEffect(() => {
    if (step === 0) {
      theatreAPI.cities()
        .then(r => {
          const list = r.data.cities || [];
          setCities(list);
          // Auto select Bhubaneswar or Mumbai if available
          const bbsr = list.find(c => c.name === 'Bhubaneswar');
          if (bbsr) setSelectedCity(bbsr);
        })
        .catch(err => console.error('Error loading cities:', err));
    }
  }, [step]);

  // Load shows when city is selected
  useEffect(() => {
    if (selectedCity && selectedMovie) {
      // Default to today
      const defaultDate = datesList[0].dateStr;
      if (!selectedDate) {
        setSelectedDate(defaultDate);
      }
      theatreAPI.shows({
        movie_id: selectedMovie._id,
        city_id: selectedCity._id,
      })
        .then(r => setShows(r.data.shows || []))
        .catch(err => console.error('Error loading shows:', err));
    }
  }, [selectedCity, selectedMovie, selectedDate, datesList]);

  // Load seat data when show is confirmed
  useEffect(() => {
    if (selectedShow) {
      theatreAPI.seats(selectedShow._id)
        .then(r => setSeatData(r.data))
        .catch(err => console.error('Error loading seats:', err));
    }
  }, [selectedShow]);

  // Load food menu when meals step is active
  useEffect(() => {
    if (step === 3) {
      theatreAPI.foodMenu()
        .then(r => setFoodMenu(r.data.menu || []))
        .catch(err => console.error('Error loading food menu:', err));
    }
  }, [step]);

  // Seat lock timer countdown
  useEffect(() => {
    if (lockInfo && timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [lockInfo, timer]);

  // UPI payment QR code timer countdown
  useEffect(() => {
    if (step === 5 && paymentMethod === 'UPI' && upiCountdown > 0) {
      const interval = setInterval(() => setUpiCountdown(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, paymentMethod, upiCountdown]);

  const selectMovie = (movie) => {
    setSelectedMovie(movie);
    setStep(0);
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setStep(1);
  };

  const handleShowClick = (show) => {
    setPendingShow(show);
    setShowSeatCountModal(true);
  };

  const handleSeatCountConfirm = () => {
    setShowSeatCountModal(false);
    setShowTermsModal(true);
  };

  const handleTermsAccept = () => {
    setShowTermsModal(false);
    setSelectedShow(pendingShow);
    setSelectedSeats([]);
    setStep(2);
  };

  const toggleSeat = (seatId) => {
    // If seat already selected, remove it
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
      return;
    }

    // Limit selection to the quantity chosen in the popup
    if (selectedSeats.length >= seatCount) {
      // Replace the first selected seat with the new one
      setSelectedSeats(prev => [...prev.slice(1), seatId]);
    } else {
      setSelectedSeats(prev => [...prev, seatId]);
    }
  };

  const lockAndProceed = async () => {
    if (!user) {
      toast.error('Please sign in to proceed with ticket booking');
      return;
    }
    if (selectedSeats.length === 0) {
      toast.error('Please select your seats first');
      return;
    }
    try {
      const res = await theatreAPI.lockSeats({
        show_id: selectedShow._id,
        seat_ids: selectedSeats,
      });
      setLockInfo(res.data);
      setTimer(res.data.expires_in || 300);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to lock seats. Some seats may have been booked.');
    }
  };

  const updateFood = (foodId, delta) => {
    setFoodCart(prev => {
      const qty = (prev[foodId] || 0) + delta;
      if (qty <= 0) {
        const copy = { ...prev };
        delete copy[foodId];
        return copy;
      }
      return { ...prev, [foodId]: qty };
    });
  };

  const handleApplyCoupon = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'CINEXUZ50') {
      setAppliedDiscount(50);
      setActiveCoupon('CINEXUZ50');
      toast.success('Promo code CINEXUZ50 applied! 50% discount credited.');
    } else if (code === 'YESCARD20') {
      setAppliedDiscount(20);
      setActiveCoupon('YESCARD20');
      toast.success('Promo code YESCARD20 applied! 20% discount credited.');
    } else {
      toast.error('Invalid promo code');
    }
    setPromoCode('');
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(0);
    setActiveCoupon('');
    toast.success('Coupon removed');
  };

  // Pricing calculations
  const seatTotal = lockInfo?.total || 0;
  const convenienceFee = seatTotal * 0.18; // 18% fee
  const gst = convenienceFee * 0.18; // 18% GST on convenience fee
  const foodTotal = Object.entries(foodCart).reduce((sum, [id, qty]) => {
    const item = foodMenu.find(f => f.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);
  
  const subtotal = seatTotal + convenienceFee + gst + foodTotal;
  const discountAmount = subtotal * (appliedDiscount / 100);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const executePayment = async () => {
    setPaymentProcessing(true);
    try {
      const foodItems = Object.entries(foodCart).map(([id, quantity]) => ({ id, quantity }));
      const res = await theatreAPI.mockBook({
        show_id: selectedShow._id,
        seat_ids: selectedSeats,
        food_items: foodItems,
        payment_method: paymentMethod,
        total_amount: grandTotal,
      });

      if (res.data.success) {
        setBookingConfirmation(res.data);
        setStep(6); // Success confirmation page
        toast.success('Ticket booked successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Booking transaction failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Group cities by State
  const filteredCities = cities.filter(c =>
    c.name.toLowerCase().includes(searchCityQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(searchCityQuery.toLowerCase())
  );

  const groupedCities = filteredCities.reduce((acc, city) => {
    acc[city.state] = acc[city.state] || [];
    acc[city.state].push(city);
    return acc;
  }, {});

  const currentShows = shows.filter(s => s.date === selectedDate);

  // Vehicle representation for popup
  const getVehicleInfo = (qty) => {
    if (qty <= 2) return { name: 'Scooter', desc: 'Perfect for a couple' };
    if (qty <= 4) return { name: 'Auto Rickshaw', desc: 'Fits your squad' };
    if (qty <= 7) return { name: 'Hatchback Car', desc: 'Family getaway size' };
    return { name: 'Minivan', desc: 'Full gang booking' };
  };

  // Movie list view
  if (step === -1) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <Ticket size={28} className="text-[hsl(var(--primary))]" />
            <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Now In Theatres</h1>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {Array(10).fill(0).map((_, i) => <MovieCardSkeleton key={i} />)}
            </div>
          ) : movies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {movies.map(m => {
                const posterUrl = m.poster_url_custom
                  ? m.poster_url_custom
                  : m.poster_path
                    ? (m.poster_path.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w500${m.poster_path}`)
                    : '';
                return (
                  <motion.div
                    key={m._id}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative rounded-xl overflow-hidden glass-card cursor-pointer"
                    onClick={() => selectMovie(m)}
                    data-testid={`theatre-movie-${m._id}`}
                  >
                    <div className="aspect-[2/3] overflow-hidden">
                      <img 
                        src={posterUrl} 
                        alt={m.title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        loading="lazy" 
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=450&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                        <Badge className="bg-[hsl(var(--primary))] text-white text-xs gap-1"><Ticket size={10} /> Book Tickets</Badge>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold truncate">{m.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {m.genres?.slice(0, 2).map(g => (
                          <Badge key={g} variant="secondary" className="text-[10px] px-1.5 py-0">{g}</Badge>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="glass-card border-white/10">
              <CardContent className="p-12 text-center">
                <Ticket size={48} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]" />
                <p className="text-lg font-medium mb-2">No movies currently available</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    );
  }

  // Booking wizard view
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1200px] mx-auto min-h-[80vh] flex flex-col">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {step > 0 && step < 6 && (
            <Button variant="ghost" size="sm" onClick={() => {
              if (step === 1) setStep(0);
              else if (step === 2) { setStep(1); setSelectedShow(null); }
              else if (step === 3) { setStep(2); setLockInfo(null); }
              else if (step === 4) setStep(3);
              else if (step === 5) setStep(4);
            }} className="text-white hover:bg-white/10">
              <ChevronLeft size={16} /> Back
            </Button>
          )}
          {step === 0 && (
            <Button variant="ghost" size="sm" onClick={() => { setStep(-1); setSelectedMovie(null); }} className="text-white hover:bg-white/10">
              <ChevronLeft size={16} /> Now Playing
            </Button>
          )}
          <h1 className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            {selectedMovie?.title}
          </h1>
          {selectedMovie?.vote_average && (
            <Badge className="bg-green-500/20 text-green-400 border-none font-bold text-xs py-0.5">
              Rating: {selectedMovie.vote_average.toFixed(1)}/10
            </Badge>
          )}
        </div>

        {/* Stepper progress */}
        {step < 6 && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 border-b border-white/5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  i < step ? 'bg-green-500/20 text-green-400' :
                  i === step ? 'bg-[hsl(var(--primary))] text-white' :
                  'bg-white/5 text-[hsl(var(--muted-foreground))]'
                }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${
                  i === step ? 'text-white' : 'text-[hsl(var(--muted-foreground))]'
                }`}>{s}</span>
                {i < STEPS.length - 1 && <ChevronRight size={12} className="text-white/20" />}
              </div>
            ))}
          </div>
        )}

        {/* Timer notification */}
        {lockInfo && timer > 0 && step >= 3 && step < 6 && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-4 flex items-center justify-between text-sm text-yellow-400">
            <span className="flex items-center gap-2 font-medium">
              <Clock size={16} /> Seats locked
            </span>
            <span className="font-bold tabular-nums">
              Time Left: {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
            </span>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* Step 0: City Selection with Search */}
          {step === 0 && (
            <motion.div key="city" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="max-w-xl mx-auto space-y-4">
                <h2 className="text-center text-xl font-medium text-white/90">Select Your Location</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-5 w-5" />
                  <Input
                    className="pl-10 h-12 bg-white/5 border-white/10 rounded-xl text-white placeholder-white/35 focus:ring-[hsl(var(--primary))]"
                    placeholder="Search your city or state..."
                    value={searchCityQuery}
                    onChange={(e) => setSearchCityQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Popular Cities */}
              {!searchCityQuery && (
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Popular Cities</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                    {POPULAR_CITIES.map(popName => {
                      const found = cities.find(c => c.name.toLowerCase() === popName.toLowerCase());
                      const isSelected = selectedCity?.name === popName;
                      return (
                        <Button
                          key={popName}
                          variant="outline"
                          disabled={!found}
                          className={`h-11 rounded-xl border-white/10 bg-white/5 text-sm font-medium hover:bg-white/10 transition-all ${
                            isSelected ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/15 text-white' : 'text-white/70'
                          }`}
                          onClick={() => found && handleCitySelect(found)}
                        >
                          {popName}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* All Cities Grouped by State */}
              <div className="space-y-6 pt-2">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Browse Cities By State</h3>
                {Object.keys(groupedCities).length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(groupedCities).sort().map(([state, stateCities]) => (
                      <Card key={state} className="bg-white/5 border-white/5 rounded-xl">
                        <CardHeader className="py-3 px-4 border-b border-white/5">
                          <CardTitle className="text-sm font-semibold text-[hsl(var(--primary))]">{state}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 grid grid-cols-2 gap-2">
                          {stateCities.map(city => (
                            <div
                              key={city._id}
                              onClick={() => handleCitySelect(city)}
                              className={`p-3 rounded-lg text-sm text-white/80 hover:bg-white/10 cursor-pointer transition-colors flex items-center justify-between ${
                                selectedCity?._id === city._id ? 'bg-white/10 text-white font-medium border border-[hsl(var(--primary))]/30' : ''
                              }`}
                            >
                              <span>{city.name}</span>
                              <MapPin size={14} className="text-white/20" />
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/35">No cities matched your search query</div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 1: Showtime Selection & date picker rail */}
          {step === 1 && (
            <motion.div key="shows" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              
              {/* Date Rail */}
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                {datesList.map(item => {
                  const isSelected = selectedDate === item.dateStr;
                  return (
                    <button
                      key={item.dateStr}
                      onClick={() => setSelectedDate(item.dateStr)}
                      className={`flex flex-col items-center justify-center min-w-[70px] h-[75px] rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary))]/20' 
                          : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">{item.dayName}</span>
                      <span className="text-lg font-bold mt-0.5">{item.dayNum}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider mt-0.5 opacity-60">{item.monthName}</span>
                    </button>
                  );
                })}
              </div>

              {/* Displays shows */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Theatres In {selectedCity?.name}</h3>
                  <div className="flex gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Available</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> Fast Filling</span>
                  </div>
                </div>

                {currentShows.length === 0 ? (
                  <Card className="bg-white/5 border-white/10 py-12 text-center rounded-2xl">
                    <CardContent className="space-y-3">
                      <AlertCircle size={40} className="mx-auto text-white/25" />
                      <p className="text-white/60 font-medium">No shows scheduled for this date</p>
                      <p className="text-xs text-white/35">Try selecting another date on the horizontal rail above</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {/* Group shows by theatre */}
                    {Object.entries(
                      currentShows.reduce((acc, show) => {
                        acc[show.theatre_name] = acc[show.theatre_name] || [];
                        acc[show.theatre_name].push(show);
                        return acc;
                      }, {})
                    ).map(([theatreName, theatreShows]) => (
                      <Card key={theatreName} className="bg-white/5 border-white/5 rounded-2xl overflow-hidden">
                        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-white text-base">{theatreName}</h4>
                            <div className="flex items-center gap-2 text-xs text-white/45">
                              <MapPin size={12} />
                              <span>{theatreShows[0]?.address || 'Multiplex Cinema Screen'}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2.5">
                            {theatreShows.sort((a,b) => a.time.localeCompare(b.time)).map(show => {
                              // If show booked seats is high, mark it as fast filling
                              const isFastFilling = show.booked_seats?.length >= 50;
                              return (
                                <button
                                  key={show._id}
                                  onClick={() => handleShowClick(show)}
                                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${
                                    isFastFilling 
                                      ? 'border-orange-500/40 text-orange-400 bg-orange-500/5 hover:bg-orange-500/10' 
                                      : 'border-green-500/40 text-green-400 bg-green-500/5 hover:bg-green-500/10'
                                  }`}
                                >
                                  {show.time}
                                  <span className="block text-[8px] text-white/40 mt-0.5 tracking-wider uppercase font-bold">{show.screen_name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Interactive curved screen seat selector layout */}
          {step === 2 && seatData && (
            <motion.div key="seats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              
              {/* Show Info details */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-lg">{selectedMovie?.title}</h4>
                  <p className="text-xs text-white/55 font-medium">
                    {selectedShow.theatre_name} | {new Date(selectedShow.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {selectedShow.time}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-[hsl(var(--primary))]/25 text-[hsl(var(--primary))] font-semibold px-3 py-1 text-xs border-none">
                    {seatCount} Tickets Selected
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-white/60 hover:bg-white/10 hover:text-white rounded-lg">
                    Change Show
                  </Button>
                </div>
              </div>

              {/* Interactive Seat grid */}
              <Card className="bg-white/5 border-white/5 p-6 rounded-3xl relative overflow-x-auto shadow-2xl">
                
                {/* Curved Screen graphic */}
                <div className="max-w-md mx-auto mb-10 mt-2 text-center">
                  <div className="w-full h-2.5 bg-gradient-to-b from-[hsl(var(--primary))]/80 to-transparent rounded-full shadow-lg shadow-[hsl(var(--primary))]/20 scale-y-[0.3]" />
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">All eyes this way (Screen)</p>
                </div>

                {/* Seat Rows grouped by pricing */}
                <div className="flex flex-col items-center gap-3 select-none min-w-[700px]">
                  
                  {/* Category Headers & Seat Matrix */}
                  {['premium', 'executive', 'normal'].map(cat => {
                    const catSeats = seatData.seats.filter(s => s.type === cat);
                    if (catSeats.length === 0) return null;
                    
                    const catRows = [...new Set(catSeats.map(s => s.row))].sort().reverse();
                    const priceLabel = cat === 'premium' ? 'Premium (₹240)' : cat === 'executive' ? 'Executive (₹220)' : 'Normal (₹200)';
                    
                    return (
                      <div key={cat} className="w-full space-y-3 pb-6 border-b border-white/5 last:border-none last:pb-0">
                        <div className="text-center">
                          <Badge variant="secondary" className="text-[10px] font-bold tracking-wider text-white/50 bg-white/5 uppercase py-0.5 px-3 border-none">
                            {priceLabel}
                          </Badge>
                        </div>

                        {catRows.map(rowLetter => {
                          const rowSeats = catSeats.filter(s => s.row === rowLetter).sort((a,b) => a.col - b.col);
                          return (
                            <div key={rowLetter} className="flex items-center justify-center gap-2">
                              <span className="w-6 text-xs font-bold text-white/30 text-center">{rowLetter}</span>
                              
                              <div className="flex items-center gap-1.5">
                                {rowSeats.map(seat => {
                                  const isSelected = selectedSeats.includes(seat.id);
                                  const isBooked = seat.status === 'booked';
                                  const isLocked = seat.status === 'locked';
                                  // Mock bestseller indicator (like seat numbers 4-7 in premium rows)
                                  const isBestseller = cat === 'premium' && seat.col >= 4 && seat.col <= 8;
                                  
                                  // Space layouts (split columns)
                                  const renderSpacing = seat.col === 3 || seat.col === 11;

                                  return (
                                    <div key={seat.id} className="flex items-center">
                                      <button
                                        disabled={isBooked || isLocked}
                                        onClick={() => toggleSeat(seat.id)}
                                        className={`w-7 h-7 rounded-lg text-[9px] font-bold transition-all hover:scale-105 active:scale-95 ${
                                          isBooked 
                                            ? 'bg-white/10 text-white/20 border border-transparent cursor-not-allowed' 
                                            : isLocked 
                                              ? 'bg-yellow-500/10 text-yellow-500/25 border border-yellow-500/20 cursor-not-allowed'
                                              : isSelected 
                                                ? 'bg-green-500 text-white border border-green-500 shadow-md shadow-green-500/25' 
                                                : isBestseller 
                                                  ? 'bg-white/5 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/15' 
                                                  : 'bg-white/5 border border-green-500/50 text-green-400 hover:bg-green-500/15'
                                        }`}
                                      >
                                        {seat.col}
                                      </button>
                                      {renderSpacing && <div className="w-6" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Legend list */}
                <div className="mt-8 pt-5 border-t border-white/5 flex flex-wrap justify-center gap-6 text-xs font-semibold text-white/60">
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-md bg-white/5 border border-green-500/50"></span> Available</span>
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-md bg-white/5 border border-yellow-500/50"></span> Bestseller</span>
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-md bg-green-500"></span> Selected</span>
                  <span className="flex items-center gap-2"><span className="w-4 h-4 rounded-md bg-white/10"></span> Sold</span>
                </div>
              </Card>

              {/* Bottom Sticky bar for payment prompt */}
              <div className="sticky bottom-6 left-0 right-0 bg-black/90 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-2xl mt-4">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Selected Seats</p>
                  <p className="text-white font-bold text-lg">
                    {selectedSeats.length > 0 ? selectedSeats.sort().join(', ') : 'None selected'}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {selectedSeats.length} of {seatCount} tickets chosen
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Subtotal</p>
                    <p className="text-[hsl(var(--primary))] font-extrabold text-xl tabular-nums">
                      ₹{selectedSeats.reduce((sum, sid) => {
                        const seat = seatData.seats.find(s => s.id === sid);
                        return sum + (seat ? seat.price : 0);
                      }, 0)}
                    </p>
                  </div>
                  <Button
                    onClick={lockAndProceed}
                    disabled={selectedSeats.length !== seatCount}
                    className="bg-[hsl(var(--primary))] hover:brightness-110 text-white font-semibold px-6 py-6 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-[hsl(var(--primary))]/20 border-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lock Seats & Proceed <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: F&B Meals Add-ons */}
          {step === 3 && (
            <motion.div key="food" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Utensils size={20} className="text-[hsl(var(--primary))]" /> Grab Snacks & Drinks
                  </h2>
                  <p className="text-xs text-white/40 font-medium">Add F&B combos at discounted prices for the show</p>
                </div>
                <Button variant="ghost" onClick={() => setStep(4)} className="text-white/60 hover:text-white hover:bg-white/10 rounded-xl">
                  Skip snacks <ChevronRight size={16} />
                </Button>
              </div>

              {/* Food menu cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {foodMenu.map(item => {
                  const currentQty = foodCart[item.id] || 0;
                  return (
                    <Card key={item.id} className="bg-white/5 border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:bg-white/10 transition-colors">
                      <CardContent className="p-5 flex gap-4">
                        {/* Food icon avatar box */}
                        <div className="h-16 w-16 rounded-xl bg-[hsl(var(--primary))]/10 border border-[hsl(var(--primary))]/20 flex items-center justify-center text-[hsl(var(--primary))]">
                          <Utensils size={32} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="font-semibold text-white text-sm">{item.name}</h4>
                          <p className="text-xs text-white/40">Fresh popcorn and cold drink combo</p>
                          <p className="text-sm font-bold text-[hsl(var(--primary))] pt-1">₹{item.price.toFixed(2)}</p>
                        </div>
                      </CardContent>
                      
                      {/* Quantity Selector footer */}
                      <div className="px-5 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between">
                        <span className="text-xs text-white/50 font-medium">Selected</span>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-white/10 bg-white/5 hover:bg-white/10 text-white"
                            onClick={() => updateFood(item.id, -1)}
                            disabled={currentQty === 0}
                          >
                            -
                          </Button>
                          <span className="w-5 text-center text-sm font-bold text-white tabular-nums">{currentQty}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-lg border-white/10 bg-white/5 hover:bg-white/10 text-white"
                            onClick={() => updateFood(item.id, 1)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Add snacks proceed button */}
              <div className="bg-white/5 border border-white/5 p-5 rounded-2xl flex justify-between items-center shadow-2xl mt-8">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-semibold">Total Food Add-ons</p>
                  <p className="text-white font-bold text-lg">₹{foodTotal.toFixed(2)}</p>
                </div>
                <Button
                  onClick={() => setStep(4)}
                  className="bg-[hsl(var(--primary))] hover:brightness-110 text-white font-semibold px-6 py-6 rounded-xl text-sm flex items-center gap-2 shadow-lg border-none"
                >
                  Proceed to Checkout <ChevronRight size={16} />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Checkout billing review */}
          {step === 4 && (
            <motion.div key="review" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid md:grid-cols-3 gap-6">
              
              {/* Left Column: Details & Coupons */}
              <div className="md:col-span-2 space-y-4">
                <h2 className="text-xl font-bold text-white">Booking Details</h2>
                
                {/* Movie & Showtime Summary */}
                <Card className="bg-white/5 border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex gap-4">
                    <img
                      src={selectedMovie?.poster_path ? `https://image.tmdb.org/t/p/w200${selectedMovie.poster_path}` : 'https://images.unsplash.com/photo-1563089145-599997674d42?w=100&h=150&fit=crop'}
                      alt={selectedMovie?.title}
                      className="w-16 h-24 rounded-lg object-cover"
                    />
                    <div className="space-y-1">
                      <h3 className="font-bold text-white text-lg">{selectedMovie?.title}</h3>
                      <p className="text-xs text-white/60 font-semibold uppercase tracking-wider">{selectedMovie?.genres?.slice(0, 3).join(' / ')}</p>
                      <p className="text-sm text-white/80 font-medium pt-1">
                        {selectedShow.theatre_name}
                      </p>
                      <p className="text-xs text-white/55 font-semibold">
                        {selectedShow.screen_name} | {new Date(selectedShow.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })} at {selectedShow.time}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex flex-wrap gap-4 text-xs font-semibold text-white/60">
                    <span className="flex items-center gap-1.5"><Armchair size={14} /> Seats: <strong>{selectedSeats.sort().join(', ')}</strong></span>
                    <span className="flex items-center gap-1.5"><Ticket size={14} /> Tickets: <strong>{seatCount}</strong></span>
                  </div>
                </Card>

                {/* Promo Code Coupon Area */}
                <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider pt-2">Promo Coupons</h3>
                <Card className="bg-white/5 border-white/5 rounded-2xl p-5">
                  {activeCoupon ? (
                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                          <Percent size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">Coupon `{activeCoupon}` Applied</p>
                          <p className="text-xs text-green-400 font-semibold">{appliedDiscount}% discount applied on subtotal</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-300 hover:bg-white/5 font-semibold">
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="Enter promo coupon code..."
                          className="bg-white/5 border-white/10 rounded-xl text-white placeholder-white/25 focus:ring-[hsl(var(--primary))]"
                        />
                        <Button onClick={handleApplyCoupon} className="bg-[hsl(var(--primary))] hover:brightness-110 text-white rounded-xl font-semibold px-5 border-none">
                          Apply
                        </Button>
                      </div>

                      {/* Coupon suggestions */}
                      <div className="grid sm:grid-cols-2 gap-2 text-xs">
                        <div className="border border-white/5 bg-white/5 p-3 rounded-xl flex items-start gap-2.5 cursor-pointer hover:bg-white/10" onClick={() => setPromoCode('CINEXUZ50')}>
                          <Percent size={14} className="text-[hsl(var(--primary))] mt-0.5" />
                          <div>
                            <p className="font-bold text-white text-xs">CINEXUZ50</p>
                            <p className="text-white/40 mt-0.5">Flat 50% discount on entire booking</p>
                          </div>
                        </div>
                        <div className="border border-white/5 bg-white/5 p-3 rounded-xl flex items-start gap-2.5 cursor-pointer hover:bg-white/10" onClick={() => setPromoCode('YESCARD20')}>
                          <Percent size={14} className="text-[hsl(var(--primary))] mt-0.5" />
                          <div>
                            <p className="font-bold text-white text-xs">YESCARD20</p>
                            <p className="text-white/40 mt-0.5">20% discount on credit/debit bookings</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Right Column: Billing Breakdown Summary */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Order Summary</h2>
                <Card className="bg-white/5 border-white/5 rounded-3xl p-6 space-y-4 shadow-2xl">
                  
                  {/* Detailed itemized cost */}
                  <div className="space-y-2.5 text-sm text-white/70">
                    <div className="flex justify-between">
                      <span>Base Ticket Cost</span>
                      <span className="font-semibold tabular-nums text-white">₹{seatTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Convenience Fee (18%)</span>
                      <span className="font-semibold tabular-nums text-white">₹{convenienceFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18% of fee)</span>
                      <span className="font-semibold tabular-nums text-white">₹{gst.toFixed(2)}</span>
                    </div>

                    {/* Food list if exists */}
                    {foodTotal > 0 && (
                      <div className="pt-2 border-t border-white/5 space-y-1 text-xs">
                        <p className="font-bold text-white/50 uppercase tracking-wider text-[10px]">Snacks add-ons</p>
                        {Object.entries(foodCart).map(([id, qty]) => {
                          const item = foodMenu.find(f => f.id === id);
                          if (!item) return null;
                          return (
                            <div key={id} className="flex justify-between text-white/60">
                              <span>{item.name} x{qty}</span>
                              <span className="tabular-nums font-medium">₹{(item.price * qty).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {appliedDiscount > 0 && (
                      <div className="pt-2 border-t border-white/5 flex justify-between text-green-400 font-medium">
                        <span>Promo Coupon Discount</span>
                        <span className="tabular-nums">-₹{discountAmount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t border-white/10 pt-3 flex justify-between font-extrabold text-white text-lg">
                      <span>Grand Total</span>
                      <span className="tabular-nums text-[hsl(var(--primary))]">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Proceed to payment */}
                  <Button
                    onClick={() => setStep(5)}
                    className="w-full bg-[hsl(var(--primary))] hover:brightness-110 text-white font-bold py-6 rounded-xl text-sm flex items-center justify-center gap-2 border-none mt-4 shadow-lg shadow-[hsl(var(--primary))]/20"
                  >
                    Proceed to Payment <ChevronRight size={16} />
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-wider pt-2">
                    <ShieldCheck size={14} className="text-green-500" />
                    <span>Safe & Secure Checkout</span>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Step 5: simulated Payment Gateway */}
          {step === 5 && (
            <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-xl mx-auto space-y-6">
              <h2 className="text-xl font-bold text-white text-center">Secure Payment Gateway</h2>

              <div className="grid grid-cols-3 gap-2">
                {['UPI', 'Card', 'NetBanking'].map(method => {
                  const isActive = paymentMethod === method;
                  return (
                    <Button
                      key={method}
                      variant="outline"
                      className={`h-12 rounded-xl font-semibold border-white/10 transition-all ${
                        isActive 
                          ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))] text-white shadow-lg' 
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method === 'UPI' && 'UPI / QR'}
                      {method === 'Card' && 'Debit/Credit Card'}
                      {method === 'NetBanking' && 'Net Banking'}
                    </Button>
                  );
                })}
              </div>

              <Card className="bg-white/5 border-white/5 rounded-3xl p-6 shadow-2xl relative min-h-[300px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  
                  {/* UPI QR Code simulation */}
                  {paymentMethod === 'UPI' && (
                    <motion.div key="upi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-center py-4 flex flex-col items-center">
                      <div className="bg-white p-4 rounded-2xl inline-block shadow-lg">
                        <QrCode size={160} className="text-black" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-white text-sm">Scan QR Code using BHIM / GPAY / PhonePe</p>
                        <p className="text-xs text-white/55">Transaction amount: <strong className="text-[hsl(var(--primary))]">₹{grandTotal.toFixed(2)}</strong></p>
                      </div>
                      
                      <div className="text-xs text-yellow-400 font-semibold tabular-nums bg-yellow-500/10 border border-yellow-500/20 px-4 py-1.5 rounded-full inline-block">
                        QR Expires in: {Math.floor(upiCountdown / 60)}:{String(upiCountdown % 60).padStart(2, '0')}
                      </div>
                    </motion.div>
                  )}

                  {/* Card payment layout */}
                  {paymentMethod === 'Card' && (
                    <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-2">
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/40 font-bold uppercase tracking-wider">Card Number</label>
                        <Input className="bg-white/5 border-white/10 rounded-xl text-white placeholder-white/20 h-11" placeholder="4000 1234 5678 9010" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/40 font-bold uppercase tracking-wider">Expiry Date</label>
                          <Input className="bg-white/5 border-white/10 rounded-xl text-white placeholder-white/20 h-11" placeholder="MM/YY" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/40 font-bold uppercase tracking-wider">CVV Code</label>
                          <Input className="bg-white/5 border-white/10 rounded-xl text-white placeholder-white/20 h-11" type="password" placeholder="***" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-white/40 font-bold uppercase tracking-wider">Cardholder Name</label>
                        <Input className="bg-white/5 border-white/10 rounded-xl text-white placeholder-white/20 h-11" placeholder="Your Full Name" />
                      </div>
                    </motion.div>
                  )}

                  {/* Net Banking layout */}
                  {paymentMethod === 'NetBanking' && (
                    <motion.div key="netbank" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-4">
                      <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Popular Banks</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'].map(bank => (
                          <div key={bank} className="border border-white/5 bg-white/5 p-3 rounded-xl text-white/80 hover:bg-white/10 cursor-pointer font-medium text-center">
                            {bank}
                          </div>
                        ))}
                      </div>
                      <div className="pt-2">
                        <p className="text-xs text-white/40 font-bold uppercase tracking-wider mb-2">Or select other banks</p>
                        <select className="w-full bg-white/5 border border-white/10 rounded-xl text-white/70 h-11 px-3 outline-none">
                          <option className="bg-neutral-900 text-white">Punjab National Bank</option>
                          <option className="bg-neutral-900 text-white">Bank of Baroda</option>
                          <option className="bg-neutral-900 text-white">Canara Bank</option>
                          <option className="bg-neutral-900 text-white">Yes Bank</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Final secure pay CTA button */}
                <Button
                  onClick={executePayment}
                  disabled={paymentProcessing}
                  className="w-full bg-[hsl(var(--primary))] hover:brightness-110 text-white font-bold py-6 rounded-xl text-sm flex items-center justify-center gap-2 border-none mt-6 shadow-lg shadow-[hsl(var(--primary))]/20"
                >
                  {paymentProcessing ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  {paymentProcessing ? 'Processing Secure Payment...' : `Pay ₹${grandTotal.toFixed(2)} Now`}
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Step 6: Confirmation E-Ticket Pass */}
          {step === 6 && bookingConfirmation && (
            <motion.div key="confirmation" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md mx-auto space-y-6 text-center py-6">
              
              {/* Success Badge check */}
              <div className="mx-auto h-16 w-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center shadow-lg shadow-green-500/10">
                <Check size={36} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
                <p className="text-sm text-white/60">Your e-ticket has been generated successfully.</p>
              </div>

              {/* Premium barcode e-ticket card */}
              <Card className="bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/10 rounded-3xl overflow-hidden relative shadow-2xl text-left select-text">
                
                {/* Visual dotted ticket cuts on sides */}
                <div className="absolute left-0 top-[60%] -translate-x-1/2 h-6 w-6 bg-neutral-950 rounded-full border-r border-white/10 z-10" />
                <div className="absolute right-0 top-[60%] translate-x-1/2 h-6 w-6 bg-neutral-950 rounded-full border-l border-white/10 z-10" />

                {/* Header Movie Title Banner */}
                <div className="bg-[hsl(var(--primary))]/10 p-5 border-b border-white/5 relative">
                  <h3 className="font-extrabold text-white text-lg tracking-tight truncate">{selectedMovie?.title}</h3>
                  <p className="text-[10px] text-[hsl(var(--primary))] font-bold uppercase tracking-wider mt-0.5">CineNexuz Electronic Pass</p>
                </div>

                {/* Ticket Details */}
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-white/50">
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Cinema & Hall</p>
                      <p className="text-white font-bold mt-1 text-xs leading-relaxed">{selectedShow.theatre_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Screen</p>
                      <p className="text-white font-bold mt-1 text-xs leading-relaxed">{selectedShow.screen_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Date & Time</p>
                      <p className="text-white font-bold mt-1 text-xs leading-relaxed">
                        {new Date(selectedShow.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}<br/>
                        at {selectedShow.time}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Seats Selected</p>
                      <p className="text-[hsl(var(--primary))] font-extrabold mt-1 text-sm leading-relaxed">{selectedSeats.sort().join(', ')}</p>
                    </div>
                  </div>

                  {/* Meals ordered item */}
                  {Object.keys(foodCart).length > 0 && (
                    <div className="pt-3 border-t border-white/5">
                      <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold mb-1.5">Food & Beverages</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(foodCart).map(([id, qty]) => {
                          const item = foodMenu.find(f => f.id === id);
                          if (!item) return null;
                          return (
                            <Badge key={id} variant="outline" className="border-white/10 text-white/70 bg-white/5 py-1 px-2.5 rounded-lg text-[10px]">
                              {item.name} (x{qty})
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ticket separation line */}
                <div className="border-t border-dashed border-white/10 my-1 mx-5" />

                {/* Barcode & Booking Reference */}
                <div className="p-5 text-center space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Transaction Reference ID</p>
                    <p className="text-xs text-white/80 font-bold tabular-nums">{bookingConfirmation.transaction_id}</p>
                  </div>
                  
                  {/* Mock Barcode display using CSS lines */}
                  <div className="bg-white py-4 px-6 rounded-2xl inline-block max-w-xs mx-auto">
                    <div className="h-10 w-44 flex items-center justify-between overflow-hidden">
                      {Array.from({ length: 24 }).map((_, idx) => {
                        const widths = [1, 2, 3, 4];
                        const w = widths[(idx * 7) % widths.length];
                        const showGap = (idx * 3) % 5 !== 0;
                        return (
                          <div
                            key={idx}
                            className="bg-black h-full"
                            style={{
                              width: `${w}px`,
                              marginRight: showGap ? '2px' : '0'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[9px] text-white/30 font-bold uppercase tracking-wider">Present this barcode at the multiplex gates</p>
                </div>
              </Card>

              {/* Complete return button */}
              <Button
                asChild
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-semibold w-full py-6 mt-4 border-none"
              >
                <Link to="/">Return to Dashboard</Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* MODAL: "How many seats?" popup layout */}
      <AnimatePresence>
        {showSeatCountModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 text-center space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">How many seats?</h3>
                  <p className="text-xs text-white/55">Select number of tickets to book for this show</p>
                </div>

                {/* Scooter illustration box */}
                <div className="py-4 flex flex-col items-center gap-2">
                  <div className="h-24 w-24 bg-[hsl(var(--primary))]/10 rounded-full flex items-center justify-center text-[hsl(var(--primary))] shadow-inner">
                    <Utensils size={44} />
                  </div>
                  <p className="font-bold text-white text-sm mt-2">{getVehicleInfo(seatCount).name}</p>
                  <p className="text-xs text-white/40">{getVehicleInfo(seatCount).desc}</p>
                </div>

                {/* Ticket quantity circle picker */}
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                    <button
                      key={num}
                      onClick={() => setSeatCount(num)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all hover:scale-105 active:scale-95 ${
                        seatCount === num 
                          ? 'bg-[hsl(var(--primary))] text-white shadow-lg' 
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                {/* Seating Classes Preview */}
                <div className="border-t border-white/5 pt-4 text-xs font-semibold text-white/50 flex justify-around gap-2">
                  <div>
                    <p className="text-white font-bold">Premium</p>
                    <p className="text-white/40 mt-0.5">₹240</p>
                  </div>
                  <div className="border-l border-white/5 h-8" />
                  <div>
                    <p className="text-white font-bold">Executive</p>
                    <p className="text-white/40 mt-0.5">₹220</p>
                  </div>
                  <div className="border-l border-white/5 h-8" />
                  <div>
                    <p className="text-white font-bold">Normal</p>
                    <p className="text-white/40 mt-0.5">₹200</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setShowSeatCountModal(false)} className="flex-1 text-white/60 hover:bg-white/5 hover:text-white rounded-xl py-6">
                    Cancel
                  </Button>
                  <Button onClick={handleSeatCountConfirm} className="flex-1 bg-[hsl(var(--primary))] hover:brightness-110 text-white font-bold rounded-xl py-6 border-none">
                    Select Seats
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Terms & Conditions accept/cancel */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <div className="p-6 space-y-4">
                <h3 className="text-lg font-bold text-white text-center border-b border-white/5 pb-3">Terms & Conditions</h3>
                
                <div className="space-y-3 text-xs text-white/60 max-h-[220px] overflow-y-auto pr-1 leading-relaxed">
                  <p>1. Tickets once booked cannot be cancelled, exchanged, refunded, or transferred.</p>
                  <p>2. Patrons must comply with the film's censor certification and carry valid ID/Age Proof to the theatre. Admission may be denied otherwise.</p>
                  <p>3. Outside food and beverages are strictly not allowed inside the cinema premises.</p>
                  <p>4. Items like bags, helmets, cameras, eatables, or inflammable objects are prohibited.</p>
                  <p>5. Seat layout coordinates are representational; actual seat positioning at the multiplex hall may vary slightly.</p>
                  <p>6. 3D movies ticket price includes charges towards the usage of 3D glasses which must be returned post-show.</p>
                </div>

                <div className="flex gap-3 pt-3 border-t border-white/5">
                  <Button variant="ghost" onClick={() => setShowTermsModal(false)} className="flex-1 text-white/60 hover:bg-white/5 hover:text-white rounded-xl py-6">
                    Cancel
                  </Button>
                  <Button onClick={handleTermsAccept} className="flex-1 bg-[hsl(var(--primary))] hover:brightness-110 text-white font-bold rounded-xl py-6 border-none">
                    Accept
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
