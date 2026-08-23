import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, GitBranch, MessageCircle } from 'lucide-react';

export default function TheoryBoard({ movieId }) {
    // CUSTOMER POV: Fandoms thrive on "What Ifs" (e.g. Star Wars, Marvel).
    // Instead of a static comment section, this is an interactive branching timeline
    // where users can vote on alternate realities and discuss fan theories.
    const [activeBranch, setActiveBranch] = useState('canon');

    const timelines = {
        canon: {
            title: "Canon Timeline",
            description: "The official events as depicted in the cinematic release.",
            branches: [
                { id: 'branch_1', title: "What if the hero took the deal?" },
                { id: 'branch_2', title: "The 'Dream Sequence' Theory" }
            ]
        },
        branch_1: {
            title: "Alternate Reality: The Deal",
            description: "Fans theorize that if the protagonist accepted the villain's offer in Act 2, the empire would have collapsed from within.",
            upvotes: 4502,
            author: "@LoreMaster99"
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-6 bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                <Network className="text-purple-400 w-8 h-8" />
                <h2 className="text-2xl font-bold text-white tracking-wide font-serif">
                    The Theory Nexus (Spoilers)
                </h2>
            </div>

            <div className="flex gap-8">
                {/* Timeline Tree Visualization */}
                <div className="w-1/3 flex flex-col gap-4 border-r border-slate-700 pr-6">
                    <button 
                        onClick={() => setActiveBranch('canon')}
                        className={`text-left p-3 rounded-lg flex items-center gap-3 transition-all ${
                            activeBranch === 'canon' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]' : 'hover:bg-slate-800 text-slate-300'
                        }`}
                    >
                        <div className="w-3 h-3 rounded-full bg-white"></div>
                        <span className="font-semibold">Prime Canon</span>
                    </button>

                    {timelines.canon.branches.map(branch => (
                        <div key={branch.id} className="relative ml-4 pl-4 border-l-2 border-slate-700">
                            <button 
                                onClick={() => setActiveBranch(branch.id)}
                                className={`mt-4 w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${
                                    activeBranch === branch.id ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]' : 'hover:bg-slate-800 text-slate-400'
                                }`}
                            >
                                <GitBranch className="w-4 h-4 opacity-70" />
                                <span className="text-sm font-medium line-clamp-2">{branch.title}</span>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Theory Details Pane */}
                <div className="w-2/3 pl-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeBranch}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-slate-800 p-6 rounded-lg border border-slate-600 relative overflow-hidden"
                        >
                            {/* Decorative background glow */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

                            <h3 className="text-xl font-bold text-white mb-2">
                                {timelines[activeBranch]?.title || timelines.canon.title}
                            </h3>
                            
                            {activeBranch !== 'canon' && (
                                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                                    <span className="bg-slate-700 px-2 py-1 rounded text-blue-300 border border-blue-900/50">
                                        Fan Theory
                                    </span>
                                    <span>By {timelines[activeBranch].author}</span>
                                    <span className="text-green-400 font-mono">▲ {timelines[activeBranch].upvotes}</span>
                                </div>
                            )}

                            <p className="text-slate-300 leading-relaxed">
                                {timelines[activeBranch]?.description || timelines.canon.description}
                            </p>

                            {activeBranch !== 'canon' && (
                                <button className="mt-6 flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium">
                                    <MessageCircle className="w-4 h-4" />
                                    Join Discussion
                                </button>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
