import axios from 'axios';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cinenexus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  signup: (data) => api.post('/api/auth/signup', data),
  login: (data) => api.post('/api/auth/login', data),
  me: () => api.get('/api/auth/me'),
};

// Movies
export const moviesAPI = {
  list: (params) => api.get('/api/movies', { params }),
  trending: (limit = 20) => api.get('/api/movies/trending', { params: { limit } }),
  nowPlaying: (limit = 20) => api.get('/api/movies/now-playing', { params: { limit } }),
  discover: (page = 1, limit = 20) => api.get('/api/movies/discover', { params: { page, limit } }),
  genres: () => api.get('/api/movies/genres'),
  search: (q, semantic = false) => api.get('/api/movies/search', { params: { q, semantic } }),
  get: (id) => api.get(`/api/movies/${id}`),
  stream: (id) => api.get(`/api/movies/${id}/stream`),
  studio: (studioId, params) => api.get(`/api/studio/${studioId}`, { params }),
  random: () => api.get('/api/movies/random'),
};

// Actors
export const actorsAPI = {
  get: (id) => api.get(`/api/actors/${id}`),
};

// AI
export const aiAPI = {
  chat: (data) => api.post('/api/ai/chat', data),
  recommendations: () => api.post('/api/ai/recommendations'),
  mood: (data) => api.post('/api/ai/mood', data),
  // Session 1: Sentiment Analysis
  sentiment: (texts) => api.post('/api/ai/sentiment', { texts }),
  // Session 2: RAG Chat
  ragChat: (data) => api.post('/api/ai/rag/chat', data),
  ragStatus: () => api.get('/api/ai/rag/status'),
  // Session 2: Agent
  agent: (data) => api.post('/api/ai/agent', data),
  agentTools: () => api.get('/api/ai/agent/tools'),
  // Session 2: Model Card
  modelCard: () => api.get('/api/ai/model-card'),
  evalDataset: () => api.get('/api/ai/eval-dataset'),
  // Session 5: LangChain RAG
  langchainRag: (data) => api.post('/api/ai/rag-chain', data),
  langchainStatus: () => api.get('/api/ai/langchain/status'),
  // Session 5: LangGraph Agent
  graphAgent: (data) => api.post('/api/ai/graph-agent', data),
  graphAgentInfo: () => api.get('/api/ai/graph-agent/info'),
};

// AI Lab - Search Comparison
export const aiLabAPI = {
  searchCompare: (q, limit = 5) => api.get('/api/search/compare', { params: { q, limit } }),
  scratchSearch: (q, limit = 20) => api.get('/api/search/scratch', { params: { q, limit } }),
  collaborativeRecs: (limit = 20) => api.get('/api/recommendations/collaborative', { params: { limit } }),
  retrainCF: () => api.post('/api/admin/ml/retrain-cf'),
  runEvals: () => api.post('/api/admin/ai/run-evals'),
  rebuildVectors: () => api.post('/api/admin/ai/rebuild-vectors'),
};

// OTT Watch Providers (Session 6)
export const watchProvidersAPI = {
  get: (movieId) => api.get(`/api/movies/${movieId}/watch-providers`),
};

// Payments
export const paymentsAPI = {
  plans: () => api.get('/api/payments/plans'),
  config: () => api.get('/api/payments/config'),
  checkout: (data) => api.post('/api/payments/checkout', data),
  subscribe: (data) => api.post('/api/payments/subscribe', data),
  status: (sessionId) => api.get(`/api/payments/status/${sessionId}`),
};

// Access
export const accessAPI = {
  check: (movieId) => api.get(`/api/access/${movieId}`),
};

// Profile
export const profileAPI = {
  get: () => api.get('/api/profile'),
  list: () => api.get('/api/profiles'),
  create: (data) => api.post('/api/profiles', data),
  update: (id, data) => api.put(`/api/profiles/${id}`, data),
  delete: (id) => api.delete(`/api/profiles/${id}`),
  verifyPin: (id, pin) => api.post(`/api/profiles/${id}/verify-pin`, { pin }),
};

// Admin
export const adminAPI = {
  stats: () => api.get('/api/admin/stats'),
  movies: (params) => api.get('/api/admin/movies', { params }),
  addMovie: (data) => api.post('/api/admin/movies', data),
  updateMovie: (id, data) => api.put(`/api/admin/movies/${id}`, data),
  deleteMovie: (id) => api.delete(`/api/admin/movies/${id}`),
  refreshMovies: () => api.post('/api/admin/movies/refresh'),
  users: (params) => api.get('/api/admin/users', { params }),
  analytics: () => api.get('/api/admin/analytics'),
  theatres: () => api.get('/api/admin/theatres'),
  createShow: (data) => api.post('/api/admin/shows', data),
  cfHistory: () => api.get('/api/admin/ml/cf-history'),
  retrainCF: () => api.post('/api/admin/ml/retrain-cf'),
};

// Theatre
export const theatreAPI = {
  cities: () => api.get('/api/theatre/cities'),
  theatres: (cityId) => api.get('/api/theatre/theatres', { params: { city_id: cityId } }),
  shows: (params) => api.get('/api/theatre/shows', { params }),
  seats: (showId) => api.get(`/api/theatre/shows/${showId}/seats`),
  lockSeats: (data) => api.post('/api/theatre/lock-seats', data),
  book: (data) => api.post('/api/theatre/book', data),
  mockBook: (data) => api.post('/api/theatre/mock-book', data),
  foodMenu: () => api.get('/api/theatre/food-menu'),
};

// Watch Party
export const watchPartyAPI = {
  create: (data) => api.post('/api/watchparty/create', data),
  rooms: () => api.get('/api/watchparty/rooms'),
  getRoom: (roomId) => api.get(`/api/watchparty/${roomId}`),
};

// OTP Auth
export const otpAPI = {
  request: (data) => api.post('/api/auth/otp/request', data),
  verify: (data) => api.post('/api/auth/otp/verify', data),
  resetRequest: (data) => api.post('/api/auth/password-reset/request', data),
  resetConfirm: (data) => api.post('/api/auth/password-reset/confirm', data),
};

// Onboarding & Taste DNA
export const onboardingAPI = {
  status: () => api.get('/api/onboarding/status'),
  submit: (data) => api.post('/api/onboarding/submit', data),
};

export const tasteDNAAPI = {
  get: () => api.get('/api/taste-dna'),
  addToWatchHistory: (movieId) => api.post('/api/watch-history/add', { movie_id: movieId }),
};

export const recommendationsAPI = {
  personalized: (limit = 20) => api.get('/api/recommendations/personalized', { params: { limit } }),
  hybrid: (limit = 20) => api.get('/api/recommendations/hybrid', { params: { limit } }),
};

// My List / Watchlist
export const myListAPI = {
  get: () => api.get('/api/mylist'),
  add: (movieId) => api.post('/api/mylist/add', { movie_id: movieId }),
  remove: (movieId) => api.post('/api/mylist/remove', { movie_id: movieId }),
};

// Continue Watching
export const continueWatchingAPI = {
  get: () => api.get('/api/continue-watching'),
  update: (movieId, progress) => api.post('/api/continue-watching/update', { movie_id: movieId, progress }),
  updateSeconds: (movieId, progressSeconds, totalDuration) => api.put('/api/continue-watching/update', {
    movie_id: movieId,
    progress_seconds: progressSeconds,
    total_duration: totalDuration,
  }),
};

// Top 10
export const top10API = {
  get: () => api.get('/api/top10'),
};

// Collections & Franchises
export const collectionsAPI = {
  list: (params) => api.get('/api/collections', { params }),       // { q, page, limit }
  featured: () => api.get('/api/collections/featured'),
  get: (collectionId) => api.get(`/api/collections/${collectionId}`),
  movieFranchise: (movieId) => api.get(`/api/movies/${movieId}/franchise`),
  movieSimilar: (movieId) => api.get(`/api/movies/${movieId}/similar`),
};

export default api;

