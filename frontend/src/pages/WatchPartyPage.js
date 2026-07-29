import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { watchPartyAPI } from '../lib/api';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Users, Send, Play, Pause, Copy, Share2, MessageCircle,
  Sparkles, Film, Plus, ArrowLeft
} from 'lucide-react';

const REACTIONS = ['thumbsup', 'heart', 'laughing', 'fire', 'mindblown'];
const REACTION_EMOJIS = { thumbsup: '\uD83D\uDC4D', heart: '\u2764\uFE0F', laughing: '\uD83D\uDE02', fire: '\uD83D\uDD25', mindblown: '\uD83E\uDD2F' };

export default function WatchPartyPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [members, setMembers] = useState([]);
  const [ws, setWs] = useState(null);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadRooms();
    return () => { if (ws) ws.close(); };
  }, []); // eslint-disable-line

  const loadRooms = async () => {
    try {
      const res = await watchPartyAPI.rooms();
      setRooms(res.data.rooms || []);
    } catch { }
  };

  const createRoom = async (movieId) => {
    if (!user) { toast.error('Sign in to create a watch party'); return; }
    try {
      const res = await watchPartyAPI.create({ movie_id: movieId });
      joinRoom(res.data.room_id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create room');
    }
  };

  const joinRoom = useCallback(async (roomId) => {
    try {
      const res = await watchPartyAPI.getRoom(roomId);
      setCurrentRoom({ room_id: roomId, ...res.data.room });

      // Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const wsUrl = backendUrl.replace(/^https?:/, protocol);
      const socket = new WebSocket(`${wsUrl}/api/ws/watchparty/${roomId}`);

      socket.onopen = () => {
        socket.send(JSON.stringify({ user_name: user?.name || `Guest_${Math.random().toString(36).substr(2, 4)}` }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          setMessages(prev => [...prev, data]);
        } else if (data.type === 'user_joined' || data.type === 'user_left') {
          setMembers(data.members || []);
          setMessages(prev => [...prev, {
            type: 'system',
            message: `${data.user} ${data.type === 'user_joined' ? 'joined' : 'left'} the party`,
          }]);
        } else if (data.type === 'reaction') {
          const id = Date.now() + Math.random();
          setFloatingReactions(prev => [...prev, { id, emoji: data.emoji, user: data.user }]);
          setTimeout(() => setFloatingReactions(prev => prev.filter(r => r.id !== id)), 3000);
        } else if (data.type === 'trivia') {
          setMessages(prev => [...prev, { type: 'trivia', message: data.content }]);
        }
      };

      socket.onclose = () => {
        toast.info('Disconnected from watch party');
      };

      setWs(socket);
    } catch (err) {
      toast.error('Room not found or expired');
    }
  }, [user]);

  const sendChat = (e) => {
    e.preventDefault();
    if (!input.trim() || !ws) return;
    ws.send(JSON.stringify({ type: 'chat', message: input.trim() }));
    setInput('');
  };

  const sendReaction = (emoji) => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'reaction', emoji }));
  };

  const requestTrivia = () => {
    if (!ws) return;
    ws.send(JSON.stringify({ type: 'trivia_request' }));
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/watchparty?room=${currentRoom?.room_id}`);
    toast.success('Room link copied!');
  };

  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const leaveRoom = () => {
    if (ws) ws.close();
    setWs(null);
    setCurrentRoom(null);
    setMessages([]);
    setMembers([]);
    loadRooms();
  };

  // Inside a room
  if (currentRoom) {
    return (
      <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={leaveRoom}>
            <ArrowLeft size={16} />
          </Button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold">{currentRoom.movie_title}</h2>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                <Users size={10} className="mr-1" /> {members.length} watching
              </Badge>
              <Badge variant="secondary" className="text-[10px]">Room: {currentRoom.room_id}</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={copyRoomLink}>
            <Share2 size={12} /> Share
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={requestTrivia}>
            <Sparkles size={12} /> Trivia
          </Button>
        </div>

        {/* Main area */}
        <div className="flex-1 flex">
          {/* Video placeholder */}
          <div className="flex-1 flex items-center justify-center bg-black/20 relative overflow-hidden">
            <div className="text-center">
              <Film size={64} className="mx-auto mb-4 text-[hsl(var(--muted-foreground))]/30" />
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Streaming: {currentRoom.movie_title}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]/50 mt-1">Video player placeholder</p>
            </div>
            {/* Floating reactions */}
            <AnimatePresence>
              {floatingReactions.map(r => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 1, y: 0, x: Math.random() * 200 }}
                  animate={{ opacity: 0, y: -200 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2.5 }}
                  className="absolute bottom-20 text-3xl"
                >
                  {REACTION_EMOJIS[r.emoji] || r.emoji}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Chat sidebar */}
          <div className="w-[320px] border-l border-white/8 flex flex-col hidden md:flex">
            <div className="px-3 py-2 border-b border-white/8">
              <p className="text-xs font-medium">Live Chat</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2" ref={scrollRef}>
              {messages.map((msg, i) => (
                <div key={i} className={`text-xs ${msg.type === 'system' ? 'text-center text-[hsl(var(--muted-foreground))] italic' : msg.type === 'trivia' ? 'glass-card rounded-lg p-2 text-[hsl(var(--primary))]' : ''}`}>
                  {msg.type === 'chat' && (
                    <><strong className="text-[hsl(var(--primary))]">{msg.user}: </strong>{msg.message}</>
                  )}
                  {msg.type === 'system' && msg.message}
                  {msg.type === 'trivia' && (
                    <><Sparkles size={12} className="inline mr-1" />{msg.message}</>
                  )}
                </div>
              ))}
            </div>
            {/* Reactions */}
            <div className="px-3 py-2 border-t border-white/8 flex gap-1">
              {REACTIONS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors text-lg"
                >
                  {REACTION_EMOJIS[emoji]}
                </button>
              ))}
            </div>
            {/* Chat input */}
            <form onSubmit={sendChat} className="px-3 py-2 border-t border-white/8 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-8 text-xs bg-white/5 border-white/10"
                data-testid="watchparty-chat-input"
              />
              <Button type="submit" size="icon" className="h-8 w-8 bg-[hsl(var(--primary))]" data-testid="watchparty-chat-send">
                <Send size={12} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Room lobby
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1200px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-6">
          <Users size={28} className="text-[hsl(var(--primary))]" />
          <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Watch Party</h1>
        </div>

        {/* Active rooms */}
        {rooms.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Active Parties</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map(room => (
                <Card key={room.room_id} className="glass-card border-white/10 cursor-pointer hover:bg-white/8" onClick={() => joinRoom(room.room_id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{room.movie_title}</p>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          <Users size={10} className="mr-1" /> {room.member_count} watching
                        </Badge>
                      </div>
                      <Button size="sm" className="bg-[hsl(var(--primary))] hover:brightness-110">Join</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Create room */}
        <h2 className="text-lg font-semibold mb-3">Start a Watch Party</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
          Pick a movie and invite friends to watch together with live chat and reactions!
        </p>
        <WatchPartyMoviePicker onSelect={createRoom} />
      </motion.div>
    </div>
  );
}

function WatchPartyMoviePicker({ onSelect }) {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await (await import('../lib/api')).moviesAPI.trending(12);
        setMovies(res.data.movies || []);
      } catch { }
    };
    load();
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {movies.map(m => (
        <Card key={m._id} className="glass-card border-white/10 cursor-pointer hover:bg-white/8" onClick={() => onSelect(m._id)}>
          <CardContent className="p-3 flex items-center gap-3">
            <img
              src={m.poster_path?.startsWith('http') ? m.poster_path : `https://image.tmdb.org/t/p/w200${m.poster_path}`}
              alt=""
              className="w-10 h-14 rounded object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=100&h=140&fit=crop';
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{m.title}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{m.vote_average?.toFixed(1)} rating</p>
            </div>
            <Plus size={16} className="text-[hsl(var(--primary))]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
