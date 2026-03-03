"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface RememberedInfo {
    user_name?: string;
    user_email?: string;
    user_company?: string;
    user_role?: string;
    connection_mode?: boolean;
    awaiting_confirmation?: boolean;
    connection_saved?: boolean;
}

interface ChatResponse {
    response: string;
    session_id: string;
    remembered_info: RememberedInfo;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

// =============================================================================
// SUGGESTED QUESTIONS
// =============================================================================

const SUGGESTED_QUESTIONS = [
    "What are your main skills?",
    "Tell me about your experience",
    "What projects have you worked on?",
    "I&apos;d like to connect with you",
];

// =============================================================================
// FULL PAGE CHAT COMPONENT
// =============================================================================

export default function PortfolioChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [rememberedInfo, setRememberedInfo] = useState<RememberedInfo>({});
    const [error, setError] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    
    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // Load or generate session ID on mount (with localStorage persistence)
    useEffect(() => {
        // Try to load existing session from localStorage
        const storedSessionId = localStorage.getItem('portfolio_chat_session_id');
        
        if (storedSessionId) {
            console.log('📂 Loaded existing session:', storedSessionId);
            setSessionId(storedSessionId);
        } else {
            // Generate new session ID (backend will also generate if missing)
            const newSessionId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log('🆕 Created new session:', newSessionId);
            setSessionId(newSessionId);
            localStorage.setItem('portfolio_chat_session_id', newSessionId);
        }
    }, []);
    
    // ==========================================================================
    // SEND MESSAGE
    // ==========================================================================
    
    const sendMessage = async (messageText?: string) => {
        const text = messageText || input;
        if (!text.trim() || isLoading) return;
        
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text.trim(),
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${FASTAPI_URL}/portfolio/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    session_id: sessionId
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response');
            }
            
            const data: ChatResponse = await response.json();
            
            // Update session ID if backend provided a new one
            if (data.session_id && data.session_id !== sessionId) {
                console.log('🔄 Session ID updated:', data.session_id);
                setSessionId(data.session_id);
                localStorage.setItem('portfolio_chat_session_id', data.session_id);
            }
            
            const assistantMessage: Message = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: data.response,
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, assistantMessage]);
            setRememberedInfo(data.remembered_info);
            
        } catch (err) {
            console.error('Chat error:', err);
            setError('Failed to send message. Please try again.');
            
            const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: "I&apos;m sorry, I encountered an error. Please try again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
            
        } finally {
            setIsLoading(false);
        }
    };
    
    // ==========================================================================
    // RESET CHAT
    // ==========================================================================
    
    const resetChat = async () => {
        try {
            // Clear localStorage
            localStorage.removeItem('portfolio_chat_session_id');
            
            if (sessionId) {
                await fetch(`${FASTAPI_URL}/portfolio/session/${sessionId}`, {
                    method: 'DELETE'
                });
            }
        } catch (err) {
            console.error('Reset error:', err);
        }
        
        // Generate new session ID
        const newSessionId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        localStorage.setItem('portfolio_chat_session_id', newSessionId);
        console.log('🆕 Created new session after reset:', newSessionId);
        
        setMessages([]);
        setRememberedInfo({});
        setError(null);
    };
    
    // ==========================================================================
    // HANDLE KEY PRESS
    // ==========================================================================
    
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    
    // ==========================================================================
    // RENDER MESSAGE CONTENT
    // ==========================================================================
    
    const renderMessageContent = (content: string) => {
        const lines = content.split('\n');
        
        return lines.map((line, index) => {
            let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            formattedLine = formattedLine.replace(
                /(https?:\/\/[^\s]+)/g, 
                '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-purple-400 hover:underline">$1</a>'
            );
            
            if (line.startsWith('- ') || line.startsWith('• ')) {
                return (
                    <li 
                        key={index} 
                        className="ml-4"
                        dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }}
                    />
                );
            }
            
            if (line.startsWith('━')) {
                return <hr key={index} className="border-gray-600 my-2" />;
            }
            
            return (
                <p 
                    key={index} 
                    className={line.trim() === '' ? 'h-4' : ''}
                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                />
            );
        });
    };
    
    // ==========================================================================
    // RENDER
    // ==========================================================================
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black flex flex-col">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-semibold text-white">Portfolio Assistant</h1>
                            <p className="text-xs text-gray-400">
                                {rememberedInfo.user_name 
                                    ? `Chatting with ${rememberedInfo.user_name}`
                                    : 'Powered by AI'
                                }
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Status Badges */}
                        {rememberedInfo.connection_mode && !rememberedInfo.connection_saved && (
                            <span className="px-3 py-1 rounded-full bg-purple-900/50 text-purple-300 text-xs">
                                🤝 Connection Mode
                            </span>
                        )}
                        {rememberedInfo.connection_saved && (
                            <span className="px-3 py-1 rounded-full bg-green-900/50 text-green-300 text-xs">
                                ✅ Connected
                            </span>
                        )}
                        
                        <button
                            onClick={resetChat}
                            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-sm">New Chat</span>
                        </button>
                    </div>
                </div>
            </header>
            
            {/* Main Chat Area */}
            <main className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Empty State */}
                    {messages.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Welcome to the Portfolio Chat
                            </h2>
                            <p className="text-gray-400 mb-8 max-w-md mx-auto">
                                I&apos;m an AI assistant that knows everything about the portfolio owner. 
                                Ask me about skills, experience, projects, or connect for opportunities!
                            </p>
                            
                            {/* Suggested Questions */}
                            <div className="flex flex-wrap justify-center gap-3">
                                {SUGGESTED_QUESTIONS.map((question, index) => (
                                    <button
                                        key={index}
                                        onClick={() => sendMessage(question)}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-sm transition-all",
                                            "bg-gray-800 text-gray-300 border border-gray-700",
                                            "hover:bg-gray-700 hover:border-purple-500 hover:text-white"
                                        )}
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Messages */}
                    <div className="space-y-6">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-4",
                                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                        message.role === 'user'
                                            ? 'bg-blue-600'
                                            : 'bg-gradient-to-r from-purple-600 to-pink-600'
                                    )}
                                >
                                    {message.role === 'user' 
                                        ? <User className="w-5 h-5 text-white" />
                                        : <Bot className="w-5 h-5 text-white" />
                                    }
                                </div>
                                
                                <div
                                    className={cn(
                                        "max-w-[75%] rounded-2xl px-5 py-4",
                                        message.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-md'
                                            : 'bg-gray-800 text-gray-100 rounded-bl-md'
                                    )}
                                >
                                    <div className="space-y-2 text-sm leading-relaxed">
                                        {renderMessageContent(message.content)}
                                    </div>
                                    <p className="text-xs opacity-50 mt-2">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        
                        {/* Loading Indicator */}
                        {isLoading && (
                            <div className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <div className="bg-gray-800 rounded-2xl rounded-bl-md px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                                        <span className="text-sm text-gray-400">Thinking...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </main>
            
            {/* Error Banner */}
            {error && (
                <div className="bg-red-900/50 border-t border-red-700 px-4 py-3">
                    <p className="text-center text-sm text-red-300">{error}</p>
                </div>
            )}
            
            {/* Input Area */}
            <footer className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky bottom-0">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex gap-3">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask me anything about the portfolio..."
                            className={cn(
                                "flex-1 bg-gray-800 text-white rounded-xl px-5 py-4",
                                "border border-gray-700 focus:border-purple-500 focus:outline-none",
                                "resize-none min-h-[56px] max-h-[200px]",
                                "placeholder:text-gray-500"
                            )}
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => sendMessage()}
                            disabled={isLoading || !input.trim()}
                            className={cn(
                                "px-6 py-4 rounded-xl transition-all font-medium",
                                "bg-gradient-to-r from-purple-600 to-pink-600",
                                "hover:from-purple-700 hover:to-pink-700",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                                "flex items-center gap-2"
                            )}
                        >
                            {isLoading 
                                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                : <>
                                    <Send className="w-5 h-5 text-white" />
                                    <span className="text-white hidden sm:inline">Send</span>
                                </>
                            }
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-3">
                        Press Enter to send, Shift + Enter for new line
                    </p>
                </div>
            </footer>
        </div>
    );
}
