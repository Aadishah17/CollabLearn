import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Sparkles, Map, ChevronRight, Loader2 } from 'lucide-react';

const AiChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I\'m your AI learning assistant. Ask me about any skill or request a roadmap!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [roadmap, setRoadmap] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, roadmap]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);
        setRoadmap(null); // Reset roadmap on new query

        try {
            // Check if user is asking for a plan/roadmap explicitly
            if (userMessage.toLowerCase().includes('roadmap') || userMessage.toLowerCase().includes('plan')) {
                // Extract potential skill name (naive approach)
                const skill = userMessage.replace(/(roadmap|plan|for|give|me|a)/gi, '').trim();

                const response = await fetch('/api/ai/roadmap', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ skill: skill || 'general' })
                });
                const data = await response.json();

                if (data.success) {
                    setMessages(prev => [...prev, { role: 'assistant', content: `Here is a roadmap for ${skill || 'your request'}:` }]);
                    setRoadmap(data.roadmap);
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't generate a roadmap at the moment." }]);
                }

            } else {
                // Normal chat
                const response = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMessage })
                });
                const data = await response.json();

                if (data.success) {
                    setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
                } else {
                    setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting to my brain right now." }]);
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Network error. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-red-600 to-red-800 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-transform z-50 animate-bounce-slow"
                >
                    <Sparkles size={24} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-black rounded-2xl shadow-2xl flex flex-col z-50 border border-white overflow-hidden animate-slideUp">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-600 to-red-800 p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <Sparkles size={20} />
                            <span className="font-bold">AI Learning Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900 scrollbar-thin scrollbar-thumb-gray-700">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                    ? 'bg-red-600 text-white rounded-tr-none'
                                    : 'bg-black border border-gray-700 text-gray-200 rounded-tl-none shadow-sm'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Roadmap Display */}
                        {roadmap && (
                            <div className="bg-black border border-white rounded-xl p-4 shadow-sm animate-fadeIn">
                                <div className="flex items-center gap-2 mb-3 text-red-500 font-bold border-b border-gray-700 pb-2">
                                    <Map size={18} />
                                    <span>Detailed Roadmap</span>
                                </div>
                                <div className="space-y-4 relative">
                                    {/* Vertical Line */}
                                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-700"></div>

                                    {roadmap.map((step, i) => (
                                        <div key={i} className="relative flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-red-500 flex items-center justify-center text-xs font-bold text-red-500 flex-shrink-0 z-10">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-sm">{step.title}</h4>
                                                <p className="text-xs text-gray-400 mt-1">{step.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-black border border-gray-700 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-red-600" />
                                    <span className="text-xs text-gray-400">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-black border-t border-white">
                        <div className="flex items-center gap-2 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ask for a roadmap..."
                                className="w-full pl-4 pr-12 py-3 bg-gray-900 border border-gray-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm placeholder:text-gray-500"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AiChatbot;
