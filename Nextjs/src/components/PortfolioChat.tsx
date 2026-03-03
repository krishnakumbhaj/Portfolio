"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, RefreshCw, X } from 'lucide-react';
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
// PORTFOLIO CHAT COMPONENT
// =============================================================================

export default function PortfolioChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [rememberedInfo, setRememberedInfo] = useState<RememberedInfo>({});
    const [isOpen, setIsOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    
    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);
    
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
    
    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
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
            
            // Add error message
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
    // RENDER MESSAGE CONTENT (with markdown-like formatting)
    // ==========================================================================
    
    const renderMessageContent = (content: string) => {
        // Simple markdown-like rendering
        const lines = content.split('\n');
        
        return lines.map((line, index) => {
            // Bold text
            let formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
            // Links
            formattedLine = formattedLine.replace(
                /(https?:\/\/[^\s]+)/g, 
                '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:underline">$1</a>'
            );
            
            // Check for list items
            if (line.startsWith('- ') || line.startsWith('• ')) {
                return (
                    <li 
                        key={index} 
                        className="ml-4"
                        dangerouslySetInnerHTML={{ __html: formattedLine.substring(2) }}
                    />
                );
            }
            
            // Check for headers
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
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300",
                    "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
                    "text-white",
                    isOpen && "scale-0 opacity-0"
                )}
            >
                <Bot className="w-6 h-6" />
            </button>
            
            {/* Chat Window */}
            <div
                className={cn(
                    "fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-h-[80vh]",
                    "bg-gray-900 rounded-2xl shadow-2xl border border-gray-700",
                    "flex flex-col overflow-hidden transition-all duration-300",
                    isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Portfolio Assistant</h3>
                            <p className="text-xs text-gray-400">
                                {rememberedInfo.user_name 
                                    ? `Chatting with ${rememberedInfo.user_name}`
                                    : 'Ask me anything!'
                                }
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={resetChat}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Reset chat"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                
                {/* Connection Status Badge */}
                {rememberedInfo.connection_mode && !rememberedInfo.connection_saved && (
                    <div className="px-4 py-2 bg-purple-900/50 border-b border-purple-700">
                        <p className="text-xs text-purple-300">
                            🤝 {rememberedInfo.awaiting_confirmation 
                                ? 'Awaiting your confirmation...' 
                                : 'Collecting connection details...'}
                        </p>
                    </div>
                )}
                
                {rememberedInfo.connection_saved && (
                    <div className="px-4 py-2 bg-green-900/50 border-b border-green-700">
                        <p className="text-xs text-green-300">
                            ✅ Connection request submitted!
                        </p>
                    </div>
                )}
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-8">
                            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">
                                        Hi! I&apos;m the portfolio assistant. Ask me anything about skills, experience, or projects.
                                        <br /><br />
                                        Want to connect? Just let me know!
                                    </p>
                        </div>
                    )}
                    
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-3",
                                message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            )}
                        >
                            <div
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    message.role === 'user'
                                        ? 'bg-blue-600'
                                        : 'bg-gradient-to-r from-purple-600 to-pink-600'
                                )}
                            >
                                {message.role === 'user' 
                                    ? <User className="w-4 h-4 text-white" />
                                    : <Bot className="w-4 h-4 text-white" />
                                }
                            </div>
                            
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                                    message.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-md'
                                        : 'bg-gray-800 text-gray-100 rounded-bl-md'
                                )}
                            >
                                <div className="space-y-1">
                                    {renderMessageContent(message.content)}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>
                
                {/* Error Message */}
                {error && (
                    <div className="px-4 py-2 bg-red-900/50 border-t border-red-700">
                        <p className="text-xs text-red-300">{error}</p>
                    </div>
                )}
                
                {/* Input */}
                <div className="p-4 border-t border-gray-700 bg-gray-800">
                    <div className="flex gap-2">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Type your message..."
                            className={cn(
                                "flex-1 bg-gray-900 text-white rounded-xl px-4 py-3 text-sm",
                                "border border-gray-700 focus:border-purple-500 focus:outline-none",
                                "resize-none min-h-[44px] max-h-[120px]",
                                "placeholder:text-gray-500"
                            )}
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={isLoading || !input.trim()}
                            className={cn(
                                "p-3 rounded-xl transition-all",
                                "bg-gradient-to-r from-purple-600 to-pink-600",
                                "hover:from-purple-700 hover:to-pink-700",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {isLoading 
                                ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                : <Send className="w-5 h-5 text-white" />
                            }
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
