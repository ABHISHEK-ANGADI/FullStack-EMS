import React, { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, User, Loader2, Trash2, CornerDownLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { chatWithAI } from "../services/api";
import { useAuth } from "../context/AuthContext";

const AiChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Namaste! I am **Astra**, your intelligent AI Copilot. How can I assist you with the Employee Management System today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isLoading, isOpen]);

  // Only show to Admin
  if (user?.role !== "ADMIN") return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    
    const currentHistory = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const data = await chatWithAI(userMessage, currentHistory);
      setMessages((prev) => [...prev, { role: "ai", content: data.response }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "I am having trouble connecting to my brain right now. Please try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      { role: "ai", content: "Chat cleared. How can I help you today?" }
    ]);
  };

  return (
    <>
        {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        // REMOVED: onMouseEnter={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 hover:scale-110 hover:shadow-indigo-500/60 transition-all duration-300 z-50 flex items-center justify-center group ${isOpen ? 'hidden' : ''}`}
        aria-label="Open Astra AI"
      >
        <Sparkles className="w-7 h-7 text-white group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden animate-slide-up ring-1 ring-black/5 font-sans">
          
          {/* Premium Header */}
          <div className="relative bg-linear-to-r from-slate-900 to-slate-800 p-5 text-white flex justify-between items-center shrink-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-400/30 shadow-inner">
                <Sparkles className="w-5 h-5 text-indigo-300" />
              </div>
              <div>
                <h3 className="font-semibold text-base tracking-wide flex items-center gap-1.5">
                  Astra AI <Sparkles className="w-4 h-4 text-amber-300" />
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <p className="text-xs text-slate-300 font-medium">Online & Ready</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 relative z-10">
              <button 
                onClick={clearChat} 
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${msg.role === "user" ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                    {msg.role === "user" ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-indigo-600" />}
                  </div>

                  <div className={`p-4 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                    msg.role === "user" 
                      ? "bg-linear-to-br from-indigo-600 to-indigo-500 text-white rounded-tr-sm" 
                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm"
                  }`}>
                    {msg.role === "user" ? (
                      msg.content
                    ) : (
                      <div className="prose prose-sm prose-slate max-w-none overflow-x-auto prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Thinking Indicator */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex gap-3 max-w-[80%] flex-row">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                  </div>
                  <div className="px-5 py-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm shadow-sm flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">Astra is thinking</span>
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Premium Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={handleSend} className="relative flex items-end gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Astra anything..."
                  className="w-full bg-slate-100/80 border border-transparent focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 text-sm text-slate-700 rounded-xl pl-4 pr-12 py-3.5 transition-all duration-200 outline-none placeholder:text-slate-400 shadow-inner"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center justify-center pointer-events-none text-slate-300">
                  <CornerDownLeft className="w-4 h-4" />
                </div>
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 flex-shrink-0"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-[10px] text-slate-400 font-medium">Powered by Groq & LangChain</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiChatWidget;