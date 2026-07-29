import { useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, FileText, HelpCircle, MessageSquare, Users, Newspaper, Briefcase, Shield, BookOpen, Sparkles, Cpu, Layers, Tv, Zap, CheckCircle2, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';

const PAGE_CONTENT = {
  about: {
    icon: <Users size={32} className="text-cyan-400" />,
    title: 'About CineNexuz',
    subtitle: 'The AI-Native Streaming Platform',
    body: [
      'CineNexuz is a production-grade AI/ML streaming platform built to demonstrate how modern machine learning systems work together in a real application.',
      'We combine collaborative filtering (SVD), semantic search (TF-IDF + embeddings), RAG-powered chat, sentiment analysis, and real-time watch parties — all in a single cohesive experience.',
      'The platform is home to 4000+ films spanning 20+ languages, powered by TMDB data and Archive.org public domain streaming.',
      'CineNexuz was built with React 19, FastAPI, MongoDB, Supabase pgvector, and HuggingFace Spaces — a fully open, production-ready AI stack.',
    ],
    contact: null,
  },
  careers: {
    icon: <Briefcase size={32} className="text-violet-400" />,
    title: 'Careers',
    subtitle: 'Join the team building AI-native media',
    body: [
      'CineNexuz is currently a solo/small-team project. There are no open positions at this time.',
      'If you\'re passionate about AI, streaming technology, and building things that matter — reach out anyway. Great builders always find a way.',
    ],
    contact: { label: 'Get in touch', href: 'mailto:hello@cinenexuz.dev' },
  },
  press: {
    icon: <Newspaper size={32} className="text-amber-400" />,
    title: 'Press',
    subtitle: 'Media resources and press kit',
    body: [
      'CineNexuz is an AI-native streaming platform project demonstrating production ML systems.',
      'For press inquiries, interviews, or media assets, please reach out directly. We\'re happy to provide screenshots, architecture diagrams, and technical details.',
    ],
    contact: { label: 'Press inquiry', href: 'mailto:press@cinenexuz.dev' },
  },
  blog: {
    icon: <BookOpen size={32} className="text-emerald-400" />,
    title: 'Blog',
    subtitle: 'Engineering notes & product updates',
    body: [
      'The CineNexuz blog is coming soon. We\'ll be writing about building production AI systems, the architecture decisions behind the platform, and lessons from shipping real ML features.',
      'Topics will include: collaborative filtering at scale, semantic search pipelines, RAG implementation, and streaming architecture.',
    ],
    contact: { label: 'Get notified', href: 'mailto:blog@cinenexuz.dev' },
  },
  help: {
    icon: <HelpCircle size={32} className="text-cyan-400" />,
    title: 'Help Center',
    subtitle: 'Get answers to common questions',
    body: [
      '**Streaming issues?** Make sure your browser supports HTML5 video. We stream via Archive.org for public domain films.',
      '**AI features not working?** The backend runs on HuggingFace Spaces free tier and may take ~30 seconds to wake up after inactivity.',
      '**Account / subscription?** Use the Profile page to manage your account. Stripe integration handles payments.',
      '**Search not finding results?** Try the AI Lab for semantic search — it understands natural language like "emotional sci-fi drama".',
    ],
    contact: { label: 'Email support', href: 'mailto:support@cinenexuz.dev' },
  },
  feedback: {
    icon: <MessageSquare size={32} className="text-violet-400" />,
    title: 'Send Feedback',
    subtitle: 'Help us make CineNexuz better',
    body: [
      'Your feedback directly shapes what gets built next. Found a bug? Have a feature idea? Tell us.',
      'We read every message and respond to most within 48 hours.',
    ],
    contact: { label: 'Send feedback', href: 'mailto:feedback@cinenexuz.dev' },
  },
  terms: {
    icon: <FileText size={32} className="text-white/60" />,
    title: 'Terms of Service',
    subtitle: 'Last updated: May 2026',
    body: [
      '**Usage:** CineNexuz is provided for personal, non-commercial use. You may not redistribute, resell, or commercially exploit any content on the platform.',
      '**Content:** All streaming content is either licensed, public domain (Archive.org), or user-generated. We respect IP rights and respond to DMCA notices.',
      '**Payments:** Subscription and purchase flows are powered by Stripe. Refunds are handled case-by-case within 7 days of purchase.',
      '**Accounts:** You are responsible for your account credentials. Do not share access. We reserve the right to suspend accounts that violate these terms.',
      '**Limitation of liability:** CineNexuz is provided "as is" without warranties. We are not liable for service interruptions, data loss, or third-party service failures.',
    ],
    contact: { label: 'Legal questions', href: 'mailto:legal@cinenexuz.dev' },
  },
  privacy: {
    icon: <Shield size={32} className="text-emerald-400" />,
    title: 'Privacy Policy',
    subtitle: 'Last updated: May 2026',
    body: [
      '**Data we collect:** Email, username, watch history, ratings, and payment info (via Stripe — we never store raw card numbers).',
      '**How we use it:** To personalize recommendations (collaborative filtering), improve search relevance, and process payments.',
      '**Third parties:** We use MongoDB Atlas (data storage), HuggingFace Spaces (AI inference), Stripe (payments), and TMDB (movie metadata).',
      '**Your rights:** You can delete your account and all associated data from the Profile page at any time.',
      '**Cookies:** We use session cookies for authentication only. No advertising cookies, no cross-site tracking.',
      '**Contact:** privacy@cinenexuz.dev',
    ],
    contact: null,
  },
  faq: {
    icon: <HelpCircle size={32} className="text-amber-400" />,
    title: 'FAQ',
    subtitle: 'Frequently asked questions',
    body: [
      '**Q: Is CineNexuz free?** A: Yes, browsing and searching are free. Some premium films require a subscription or one-time purchase.',
      '**Q: How does the AI search work?** A: We combine TF-IDF cosine similarity with sentence-transformer embeddings for semantic search. Try it in the AI Lab.',
      '**Q: Why does the AI take 30 seconds to respond?** A: The backend runs on HuggingFace free Spaces, which shut down after inactivity. The first request wakes it up.',
      '**Q: What languages are supported?** A: 20 languages including Hindi, Tamil, Telugu, Japanese, Korean, Chinese, Spanish, French, German, and more.',
      '**Q: Can I watch parties with friends?** A: Yes — the Watch Party feature lets you sync playback with others in real-time.',
      '**Q: How do I report a bug?** A: Email feedback@cinenexuz.dev or use the Feedback page.',
    ],
    contact: null,
  },
};

export default function InfoPage() {
  const location = useLocation();
  // Extract the last path segment: "/about" -> "about", "/terms" -> "terms"
  const path = location.pathname.replace(/^\//, '').split('/')[0];
  const content = PAGE_CONTENT[path];

  if (!content) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <div className="text-center py-20 px-6 max-w-md">
          <div className="text-6xl mb-6">404</div>
          <h1 className="text-2xl font-bold mb-3">Page Not Found</h1>
          <p className="text-[hsl(var(--muted-foreground))] mb-8">
            The page you're looking for doesn't exist.
          </p>
          <Link to="/"><Button>Back to Home</Button></Link>
        </div>
      </div>
    );
  }

  if (path === 'about') {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] overflow-x-hidden text-white">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(var(--background))]/95 backdrop-blur-xl">
          <div className="px-4 sm:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                  <ArrowLeft size={20} className="text-white" />
                </Button>
              </Link>
              <span className="text-sm font-semibold tracking-wide text-cyan-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                CINENEXUZ ORIGINS
              </span>
            </div>
            <Link to="/">
              <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold shadow-lg">
                Enter Platform
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative py-20 px-6 sm:px-8 text-center overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-600/10 pointer-events-none" />
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wider text-cyan-400 uppercase">
              <Sparkles size={12} /> The AI-Native Cinematic Network
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>
              Redefining the <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">Future of Streaming</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              CineNexuz is a production-grade, AI-powered entertainment ecosystem engineered to unite advanced cognitive recommender systems with beautiful, zero-latency streaming.
            </p>
          </motion.div>
        </div>

        {/* Dynamic Achievements & Capabilities Grid */}
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-20 space-y-16">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <CheckCircle2 className="text-cyan-400" /> Present Achievements
            </h2>
            <p className="text-white/60 mb-8 max-w-2xl">
              CineNexuz has established a state-of-the-art framework that integrates real-time machine learning pipelines into daily entertainment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all flex gap-4"
              >
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 h-fit">
                  <Cpu size={24} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-lg text-white">Hyper-Personalized Recommendation Matrix</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Powered by local Singular Value Decomposition (SVD) collaborative filtering and user taste vector analysis. It calculates recommendations instantly in less than 5ms.
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all flex gap-4"
              >
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 h-fit">
                  <Layers size={24} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-lg text-white">Semantic Cognitive Search</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Bypasses basic keyword matching by running sentence-transformer embeddings combined with pgvector cosine similarity to understand complex queries like "melancholic sci-fi space exploration".
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all flex gap-4"
              >
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 h-fit">
                  <Users size={24} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-lg text-white">Netflix-Style Multi-Profile Architecture</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Supports up to 5 profiles per account, each featuring customized avatars, independent watchlists, separate maturity/kids toggles, and secure cryptographic profile PIN protection.
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all flex gap-4"
              >
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 h-fit">
                  <Tv size={24} />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="font-semibold text-lg text-white">Global Multi-Lingual Cinematic Library</h3>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Featuring over 4,000 top-tier cinematic titles spanning 16+ languages (Hindi, Kannada, Telugu, Malayalam, Japanese, French, Spanish, Chinese, Korean, Punjabi, and Urdu) with fully populated movie poster cards.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Future Plans Section */}
          <div className="pt-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight flex items-center gap-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <TrendingUp className="text-purple-400" /> Future Roadmap
            </h2>
            <p className="text-white/60 mb-8 max-w-2xl">
              Our engineering team is building the next frontier of streaming, integrating real-time generative capabilities directly into the cinematic feed.
            </p>

            <div className="space-y-6">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/20 to-cyan-950/20 border border-white/10 flex flex-col md:flex-row gap-6 items-start animate-pulse-slow"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-lg">
                  <Zap size={24} />
                </div>
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-lg text-white">Generative Real-Time Audio Scene Descriptions</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-semibold uppercase">Q3 2026</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Integrating low-latency multi-modal vision models to describe on-screen visual details in real-time, providing highly descriptive, customized audio narrations for visually impaired audiences.
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/20 to-cyan-950/20 border border-white/10 flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-lg">
                  <MessageSquare size={24} />
                </div>
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-lg text-white">Interactive Smart Director & Critic Commentary</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-semibold uppercase">Q4 2026</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Enabling viewers to open a split-pane chat interface during playback to interact with AI-driven personas of the movie's director, cast, or film historians for instant trivia and insights.
                  </p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.01 }}
                className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/20 to-cyan-950/20 border border-white/10 flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-lg">
                  <Cpu size={24} />
                </div>
                <div className="space-y-2 flex-1 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-lg text-white">Decentralized P2P Video Swarm Cache</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-semibold uppercase">Q1 2027</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Deploying peer-to-peer WebRTC video swarming to reduce bandwidth loads. Streamers dynamically cache and forward video fragments to neighboring peers, ensuring 0ms buffering regardless of network congestion.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 border-t border-white/10 text-center text-white/40 text-xs flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 CineNexuz Entertainment, Inc. All rights reserved.</p>
          <div className="flex gap-4 animate-fade-in">
            <Link to="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
            <Link to="/faq" className="hover:text-cyan-400 transition-colors">FAQ</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-[hsl(var(--background))]/95 backdrop-blur-xl">
        <div className="px-4 sm:px-8 py-4 flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">CineNexuz</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Icon + Title */}
          <div className="flex items-start gap-5 mb-10">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0">
              {content.icon}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                {content.title}
              </h1>
              <p className="text-[hsl(var(--muted-foreground))]">{content.subtitle}</p>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-5">
            {content.body.map((para, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                  {para.startsWith('**') ? (
                    <>
                      <span className="font-semibold text-white">{para.match(/\*\*(.*?)\*\*/)?.[1]}</span>
                      {para.replace(/\*\*(.*?)\*\*/, '')}
                    </>
                  ) : para}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Contact CTA */}
          {content.contact && (
            <div className="mt-12 p-6 rounded-2xl bg-white/3 border border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-cyan-400" />
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {content.contact.href.replace('mailto:', '')}
                </span>
              </div>
              <a href={content.contact.href}>
                <Button size="sm" variant="outline" className="border-white/20 hover:bg-white/10">
                  {content.contact.label}
                </Button>
              </a>
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-white/10">
            <Link to="/" className="text-sm text-cyan-400 hover:underline">← Back to CineNexuz</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
