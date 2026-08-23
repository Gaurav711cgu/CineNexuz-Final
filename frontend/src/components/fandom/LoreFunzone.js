import React, { useState } from 'react';
import { BookOpen, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoreFunzone({ isVisible, onClose, currentSceneContext }) {
    // CUSTOMER POV: When watching adaptations (Marvel, Dune, Lord of the Rings),
    // fans constantly pause to google "who is that character?" or "was this in the book?"
    // 
    // STAFF ML IMPLEMENTATION: Real-time RAG (Retrieval-Augmented Generation).
    // As the movie plays, the UI pulls real-time context from the backend's vector DB 
    // of comic books, novels, and wiki lore, linking the current scene to the source material.

    const [activeLore, setActiveLore] = useState(null);

    // Simulated RAG response triggered by the current timestamp/scene
    const ragLoreData = [
        {
            id: 1,
            title: "Comic Reference: Issue #42",
            type: "source_material",
            summary: "This dialogue is pulled almost verbatim from the 1987 comic run, though the character delivering it was swapped.",
            confidence: 0.98,
            tags: ["Easter Egg", "Dialogue"]
        },
        {
            id: 2,
            title: "Character Origin: The Watcher",
            type: "deep_lore",
            summary: "The figure in the background is part of an ancient cosmic race. They are sworn to observe but never interfere, a rule broken in exactly 3 comic arcs.",
            confidence: 0.94,
            tags: ["Cosmic Entities", "Worldbuilding"]
        }
    ];

    if (!isVisible) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-screen w-96 bg-black/90 backdrop-blur-xl border-l border-slate-800 shadow-2xl p-6 overflow-y-auto z-50 text-white font-sans"
        >
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h2 className="text-xl font-bold tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                        Deep Lore X-Ray
                    </h2>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="space-y-6">
                <p className="text-sm text-slate-400 italic">
                    AI scanning current scene against 45,000 comic issues and novel databases...
                </p>

                {ragLoreData.map((lore) => (
                    <div 
                        key={lore.id}
                        onClick={() => setActiveLore(activeLore === lore.id ? null : lore.id)}
                        className={`p-4 rounded-xl cursor-pointer transition-all border ${
                            activeLore === lore.id 
                            ? 'bg-slate-800 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]' 
                            : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                        }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <BookOpen className={`w-4 h-4 ${lore.type === 'source_material' ? 'text-blue-400' : 'text-purple-400'}`} />
                            <h3 className="font-semibold text-slate-200">{lore.title}</h3>
                        </div>
                        
                        <div className="flex gap-2 mb-3">
                            {lore.tags.map(tag => (
                                <span key={tag} className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-400 px-2 py-1 rounded">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <AnimatePresence>
                            {activeLore === lore.id && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <p className="text-sm text-slate-300 leading-relaxed pt-2 border-t border-slate-700/50">
                                        {lore.summary}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="text-xs text-slate-500">
                                            RAG Confidence: {(lore.confidence * 100).toFixed(1)}%
                                        </span>
                                        <button className="text-xs text-amber-400 hover:text-amber-300 font-semibold uppercase tracking-wider">
                                            Read Source →
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
