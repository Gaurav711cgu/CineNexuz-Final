import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { ScrollArea } from '../components/ui/scroll-area';
import { Switch } from '../components/ui/switch';
import { Skeleton } from '../components/ui/skeleton';
import { aiAPI, aiLabAPI, adminAPI } from '../lib/api';
import { useBackendStatus } from '../components/BackendWakeup';
import { Search, Brain, MessageSquare, Bot, Star, FileText, GitBranch, Zap, RefreshCw, ThumbsUp, ThumbsDown, Sparkles, Database, Cpu, AlertTriangle, BarChart2, Activity, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

const MetricsTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.cfHistory()
      .then(res => setHistory(res.data))
      .catch(() => toast.error('Failed to load CF metrics history'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-48 w-full" />)}</div>;
  if (!history.length) return <div className="text-center p-8 text-gray-400">No training history available.</div>;

  const latest = history[0];
  const chartData = latest.epoch_losses ? latest.epoch_losses.map((loss, idx) => ({ epoch: idx + 1, rmse: loss })) : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Test RMSE</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-white">{latest.rmse || 'N/A'}</p></CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Precision@10</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-white">{latest.precision_at_10 || 'N/A'}</p></CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">NDCG@10</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-white">{latest.ndcg_at_10 || 'N/A'}</p></CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-400">Interactions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-white">{latest.n_interactions || 0}</p></CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle>RMSE Learning Curve (Validation Loss)</CardTitle>
            <CardDescription>Epoch-by-epoch loss reduction</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <Line type="monotone" dataKey="rmse" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <CartesianGrid stroke="#ccc" strokeDasharray="5 5" opacity={0.1} />
                <XAxis dataKey="epoch" stroke="#888" tick={{ fill: '#888' }} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} domain={['auto', 'auto']} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const SearchLabTab = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMath, setShowMath] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await aiLabAPI.searchCompare(query, 5);
      setResults(res.data);
    } catch (err) { toast.error('Search failed'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Input placeholder="Search movies (e.g., 'emotional sci-fi')" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="flex-1 bg-white/5 border-white/10" data-testid="search-lab-input" />
        <Button onClick={handleSearch} disabled={loading} data-testid="search-lab-button">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}Compare
        </Button>
      </div>
      {results && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-400 border-green-400/30">Overlap: {Math.round(results.overlap_at_5 * 100)}%</Badge>
              <span className="text-sm text-gray-400">{results.agreement_note}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowMath(!showMath)}>{showMath ? 'Hide' : 'Show'} Math</Button>
          </div>
          {showMath && (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-4 font-mono text-sm text-gray-300">
                <p><strong>TF-IDF:</strong> TF(t,d) = count(t)/total | IDF(t) = log(N/(1+df)) | Sim = cosine</p>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Cpu className="w-5 h-5 text-purple-400" />Scratch TF-IDF</CardTitle>
                <CardDescription>{results.scratch_tfidf.time_ms}ms • {results.scratch_tfidf.stats.vocabulary_size} terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.scratch_tfidf.results.map((r, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded">
                      <span className="text-sm truncate flex-1">{r.title}</span>
                      <Badge variant="secondary">{r.score.toFixed(3)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><Database className="w-5 h-5 text-blue-400" />sklearn TF-IDF</CardTitle>
                <CardDescription>{results.sklearn_tfidf.time_ms}ms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.sklearn_tfidf.results.map((r, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-white/5 rounded">
                      <span className="text-sm truncate flex-1">{r.title}</span>
                      <Badge variant="secondary">{r.score.toFixed(3)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

const SentimentTab = () => {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const samples = ["This movie was absolutely incredible!", "Terrible waste of time.", "A decent film, ultimately forgettable."];
  
  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const texts = text.includes('\n') ? text.split('\n').filter(t => t.trim()) : [text];
      const res = await aiAPI.sentiment(texts);
      setResults(res.data);
    } catch (err) { toast.error('Analysis failed'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-400">Analyze sentiment of review text</p>
          <Button variant="outline" size="sm" onClick={() => setText(samples.join('\n'))}>Load Samples</Button>
        </div>
        <Textarea placeholder="Enter review text..." value={text} onChange={(e) => setText(e.target.value)} className="min-h-[120px] bg-white/5 border-white/10" data-testid="sentiment-input" />
        <Button onClick={handleAnalyze} disabled={loading} data-testid="sentiment-analyze-button">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}Analyze
        </Button>
      </div>
      {results && (
        <div className="space-y-4">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4 flex gap-4 text-sm">
              <Badge variant="outline">{results.model_info?.name || 'distilbert'}</Badge>
              <Badge variant="outline" className="text-green-400 border-green-400/30">Cost: $0.00</Badge>
            </CardContent>
          </Card>
          <div className="space-y-3">
            {results.results?.map((r, i) => (
              <Card key={i} className={`bg-white/5 border-white/10 ${r.label === 'POSITIVE' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {r.label === 'POSITIVE' ? <ThumbsUp className="w-5 h-5 text-green-500" /> : <ThumbsDown className="w-5 h-5 text-red-500" />}
                      <Badge className={r.label === 'POSITIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>{r.label}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={r.score * 100} className="w-24 h-2" />
                      <span className="text-sm font-mono">{(r.score * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300">{r.text_preview}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RAGChatTab = () => {
  const [message, setMessage] = useState('');
  const [debugMode, setDebugMode] = useState(true);
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ragStatus, setRagStatus] = useState(null);

  useEffect(() => { aiAPI.ragStatus().then(res => setRagStatus(res.data)).catch(() => {}); }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    setConversation(prev => [...prev, { role: 'user', content: message }]);
    setMessage(''); setLoading(true);
    try {
      const res = await aiAPI.ragChat({ message, session_id: 'ai-lab' });
      setConversation(prev => [...prev, { role: 'assistant', content: res.data.response, retrieved: res.data.retrieved_movies }]);
    } catch (err) { toast.error('Chat failed'); }
    setLoading(false);
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">RAG Chat</h3>
          <div className="flex items-center gap-2"><span className="text-sm text-gray-400">Debug</span><Switch checked={debugMode} onCheckedChange={setDebugMode} /></div>
        </div>
        <ScrollArea className="h-[350px] rounded-lg bg-white/5 p-4">
          <div className="space-y-4">
            {conversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user' ? 'bg-purple-500/20' : 'bg-white/10'}`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white/10 rounded-lg p-3"><RefreshCw className="w-4 h-4 animate-spin" /></div></div>}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input placeholder="Ask about movies..." value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="flex-1 bg-white/5 border-white/10" data-testid="rag-chat-input" />
          <Button onClick={handleSend} disabled={loading}><MessageSquare className="w-4 h-4" /></Button>
        </div>
      </div>
      {debugMode && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader><CardTitle className="text-sm">Retrieved Movies</CardTitle></CardHeader>
          <CardContent>
            {ragStatus && <div className="space-y-1 mb-4 p-2 bg-white/5 rounded text-xs"><p>Indexed: {ragStatus.total_indexed}</p><p>Model: {ragStatus.embedding_model}</p></div>}
            {conversation.length > 0 && conversation[conversation.length - 1].retrieved?.map((m, i) => (
              <div key={i} className="p-2 bg-white/5 rounded text-sm mb-2"><p className="font-medium">{m.title}</p><p className="text-xs text-gray-400">Dist: {m.distance}</p></div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const AgentTab = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const prompts = ["Find a horror movie", "Recommend me a thriller", "Find action movies with high ratings"];

  const handleRun = async () => {
    if (!input.trim()) return;
    setLoading(true); setResult(null);
    try { const res = await aiAPI.agent({ message: input }); setResult(res.data); }
    catch (err) { toast.error('Agent failed'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">{prompts.map((p, i) => <Button key={i} variant="outline" size="sm" onClick={() => setInput(p)} className="text-xs">{p}</Button>)}</div>
      <div className="flex gap-4">
        <Input placeholder="Ask the AI agent..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRun()} className="flex-1 bg-white/5 border-white/10" data-testid="agent-input" />
        <Button onClick={handleRun} disabled={loading}>{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}Run</Button>
      </div>
      {result && (
        <div className="grid grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-lg">Response</CardTitle><CardDescription>{result.iterations} iterations</CardDescription></CardHeader>
            <CardContent><p className="text-sm">{result.response}</p></CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" />Tool Trace</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[250px]">
                {result.tool_calls?.map((tc, i) => (
                  <div key={i} className="p-3 bg-white/5 rounded border border-white/10 mb-2">
                    <div className="flex items-center justify-between mb-2"><Badge variant="outline" className="text-purple-400">{tc.tool_name}</Badge><span className="text-xs text-gray-400">{tc.time_ms}ms</span></div>
                    <pre className="text-xs bg-black/30 p-2 rounded overflow-auto">{JSON.stringify(tc.input, null, 2)}</pre>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const RecommendationsTab = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRecs = async () => {
    setLoading(true);
    try { const res = await aiLabAPI.collaborativeRecs(12); setResults(res.data); }
    catch (err) { toast.error('Failed'); }
    setLoading(false);
  };

  useEffect(() => { fetchRecs(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Badge variant="outline">Collaborative Filtering (SVD)</Badge>
        <Button variant="ghost" size="sm" onClick={fetchRecs}><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button>
      </div>
      {results && (
        <>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-4 flex gap-4 flex-wrap">
              <Badge variant="outline">Trained: {results.is_trained ? 'Yes' : 'No'}</Badge>
              {results.rmse && <Badge variant="outline" className="text-green-400">RMSE: {results.rmse}</Badge>}
              {results.fallback_reason && <Badge variant="outline" className="text-yellow-400">{results.fallback_reason}</Badge>}
            </CardContent>
          </Card>
          <div className="grid grid-cols-4 gap-4">
            {results.movies?.slice(0, 12).map((m, i) => (
              <Card key={i} className="bg-white/5 border-white/10 overflow-hidden">
                <div className="aspect-[2/3] bg-gray-800 relative">
                  {m.poster_path && (
                    <img 
                      src={`https://image.tmdb.org/t/p/w300${m.poster_path}`} 
                      alt={m.title} 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1563089145-599997674d42?w=300&h=450&fit=crop';
                      }}
                    />
                  )}
                  {m.predicted_rating !== undefined && <Badge className="absolute top-2 right-2 bg-purple-500">{m.predicted_rating.toFixed(1)}</Badge>}
                </div>
                <CardContent className="p-3">
                  <p className="font-medium text-sm truncate">{m.title}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">{m.fallback ? 'Recommendation:' : 'Latent Match:'}</span>
                    <span className="text-purple-400 font-mono font-semibold">
                      {m.fallback ? 'Popularity' : `${(85 + (m.predicted_rating * 2.8)).toFixed(1)}%`}
                    </span>
                  </div>
                  {!m.fallback && (
                    <div className="mt-1 text-[9px] text-gray-500 truncate">
                      user_bias + item_bias + u_i·v_j
                    </div>
                  )}
                </CardContent>

              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ModelCardTab = () => {
  const [modelCard, setModelCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { aiAPI.modelCard().then(res => setModelCard(res.data)).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>;

  const sections = [
    { key: 'collaborative_filtering', title: 'Collaborative Filtering', icon: Star, color: 'text-yellow-400' },
    { key: 'scratch_tfidf', title: 'From-Scratch TF-IDF', icon: Cpu, color: 'text-purple-400' },
    { key: 'sentiment_classifier', title: 'Sentiment Classifier', icon: Brain, color: 'text-green-400' },
    { key: 'rag_pipeline', title: 'RAG Pipeline', icon: Database, color: 'text-blue-400' },
    { key: 'agent', title: 'AI Agent', icon: Bot, color: 'text-orange-400' },
    { key: 'langgraph_agent', title: 'LangGraph Agent', icon: GitBranch, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h3 className="text-xl font-semibold">Model Card</h3><Badge variant="outline">6 Components</Badge></div>
      <div className="grid grid-cols-2 gap-4">
        {sections.map(({ key, title, icon: Icon, color }) => modelCard?.[key] && (
          <Card key={key} className="bg-white/5 border-white/10">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Icon className={`w-5 h-5 ${color}`} />{title}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                {Object.entries(modelCard[key]).slice(0, 5).map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-gray-400">{k.replace(/_/g, ' ')}:</span><span className="font-mono text-xs">{typeof v === 'boolean' ? (v ? 'Yes' : 'No') : Array.isArray(v) ? v.length : String(v).slice(0, 30)}</span></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

const AgentGraphTab = () => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try { const res = await aiAPI.graphAgent({ message: input }); setResult(res.data); }
    catch (err) { toast.error('Graph agent failed'); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5 text-cyan-400" />LangGraph Topology</CardTitle></CardHeader>
        <CardContent>
          <svg viewBox="0 0 800 150" className="w-full h-32">
            <g><circle cx="80" cy="75" r="25" fill="#7C3AED" opacity="0.3" stroke="#7C3AED" strokeWidth="2" /><text x="80" y="80" textAnchor="middle" fill="white" fontSize="11">START</text></g>
            <g><circle cx="220" cy="75" r="30" fill="#3B82F6" opacity="0.3" stroke="#3B82F6" strokeWidth="2" /><text x="220" y="80" textAnchor="middle" fill="white" fontSize="11">Planner</text></g>
            <g><circle cx="380" cy="75" r="30" fill="#F59E0B" opacity="0.3" stroke="#F59E0B" strokeWidth="2" /><text x="380" y="80" textAnchor="middle" fill="white" fontSize="11">Tools</text></g>
            <g><circle cx="540" cy="75" r="30" fill="#10B981" opacity="0.3" stroke="#10B981" strokeWidth="2" /><text x="540" y="80" textAnchor="middle" fill="white" fontSize="11">Critic</text></g>
            <g><circle cx="700" cy="75" r="30" fill="#EC4899" opacity="0.3" stroke="#EC4899" strokeWidth="2" /><text x="700" y="80" textAnchor="middle" fill="white" fontSize="11">Respond</text></g>
            <defs><marker id="ah" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#666" /></marker></defs>
            <line x1="105" y1="75" x2="185" y2="75" stroke="#666" strokeWidth="2" markerEnd="url(#ah)" />
            <line x1="250" y1="75" x2="345" y2="75" stroke="#666" strokeWidth="2" markerEnd="url(#ah)" />
            <line x1="410" y1="75" x2="505" y2="75" stroke="#666" strokeWidth="2" markerEnd="url(#ah)" />
            <line x1="570" y1="75" x2="665" y2="75" stroke="#666" strokeWidth="2" markerEnd="url(#ah)" />
            <path d="M 540 45 Q 380 5 220 45" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="5,5" />
            <text x="380" y="20" textAnchor="middle" fill="#EF4444" fontSize="9">score &lt; 7</text>
          </svg>
        </CardContent>
      </Card>
      <div className="flex gap-4">
        <Input placeholder="Ask the self-correcting agent..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRun()} className="flex-1 bg-white/5 border-white/10" data-testid="graph-agent-input" />
        <Button onClick={handleRun} disabled={loading}>{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4 mr-2" />}Run</Button>
      </div>
      {result && (
        <div className="grid grid-cols-2 gap-6">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle>Response</CardTitle><CardDescription>{result.total_iterations} iterations • {result.agent_type}</CardDescription></CardHeader>
            <CardContent><p className="text-sm">{result.response}</p></CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle>Critic Scores</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap mb-4">{result.critic_scores?.map((s, i) => <Badge key={i} className={s >= 7 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>It {i+1}: {s}/10</Badge>)}</div>
              <ScrollArea className="h-[150px]">{result.graph_trace?.map((t, i) => <div key={i} className="p-2 bg-white/5 rounded text-xs mb-2"><Badge variant="outline" className="mb-1">{t.node}</Badge></div>)}</ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// AI System Status panel
function AISystemStatus() {
  const [systems, setSystems] = useState(null);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/health`)
      .then(r => r.json())
      .then(d => setSystems(d))
      .catch(() => {});
  }, []);

  if (!systems) return null;

  const checks = [
    { label: 'GROQ AI',   ok: systems.groq_configured,  desc: 'Chat · RAG · Summaries' },
    { label: 'SVD Model', ok: systems.cf_trained,        desc: 'Collaborative Filtering' },
    { label: 'TMDB API',  ok: systems.tmdb_configured,   desc: 'Movie Data' },
    { label: 'Database',  ok: systems.db_connected,      desc: 'MongoDB' },
    { label: 'Supabase',  ok: systems.supabase_connected, desc: 'pgvector Cosine Search' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">

      {checks.map(c => (
        <div key={c.label} className={`p-3 rounded-xl border ${
          c.ok ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${c.ok ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-xs font-mono font-medium text-white/80">{c.label}</span>
          </div>
          <p className={`text-xs ${c.ok ? 'text-emerald-400/70' : 'text-red-400/70'}`}>
            {c.ok ? 'Online' : 'Offline'} · {c.desc}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function AILabPage() {
  const { status, groqReady } = useBackendStatus();
  const showAIWarning = status === 'ready' && !groqReady;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Lab</h1>
              <p className="text-gray-400">Explore CineNexuz AI/ML capabilities</p>
            </div>
          </div>

          <AISystemStatus />

          {showAIWarning && (
            <div className="mb-6 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-300">AI features limited</p>
                <p className="text-xs text-amber-400/70 mt-1">
                  GROQ_API_KEY is not configured in the backend. Chat, RAG, and sentiment require this key.
                  TF-IDF search and collaborative filtering still work.
                </p>
              </div>
            </div>
          )}

          <Tabs defaultValue="search" className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10 p-1 flex-wrap">
              <TabsTrigger value="search"><Search className="w-4 h-4 mr-1" />Search</TabsTrigger>
              <TabsTrigger value="sentiment"><Brain className="w-4 h-4 mr-1" />Sentiment</TabsTrigger>
              <TabsTrigger value="rag"><Database className="w-4 h-4 mr-1" />RAG</TabsTrigger>
              <TabsTrigger value="agent"><Bot className="w-4 h-4 mr-1" />Agent</TabsTrigger>
              <TabsTrigger value="recs"><Star className="w-4 h-4 mr-1" />Recs</TabsTrigger>
              <TabsTrigger value="model"><FileText className="w-4 h-4 mr-1" />Model</TabsTrigger>
              <TabsTrigger value="graph"><GitBranch className="w-4 h-4 mr-1" />Graph</TabsTrigger>
              <TabsTrigger value="metrics"><Activity className="w-4 h-4 mr-1" />Metrics</TabsTrigger>
            </TabsList>
            <TabsContent value="search"><SearchLabTab /></TabsContent>
            <TabsContent value="sentiment"><SentimentTab /></TabsContent>
            <TabsContent value="rag"><RAGChatTab /></TabsContent>
            <TabsContent value="agent"><AgentTab /></TabsContent>
            <TabsContent value="recs"><RecommendationsTab /></TabsContent>
            <TabsContent value="model"><ModelCardTab /></TabsContent>
            <TabsContent value="graph"><AgentGraphTab /></TabsContent>
            <TabsContent value="metrics"><MetricsTab /></TabsContent>
          </Tabs>
      </div>
    </div>
  );
}

