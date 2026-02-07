/**
 * Chat Interface - The Core Product
 * 
 * Design principles:
 * - WhatsApp-simple: input at bottom, messages above
 * - Recipe suggestions when empty
 * - Clear bot identity throughout
 * - One-click to approve bot actions
 */

"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

// Bot definitions (would come from API in production)
const BOTS: Record<string, {
  name: string;
  emoji: string;
  tagline: string;
  color: string;
  welcomeMessage: string;
  suggestions: string[];
}> = {
  "email-assistant": {
    name: "Email Assistant",
    emoji: "📧",
    tagline: "Inbox zero without the work",
    color: "bg-blue-500",
    welcomeMessage: "Hey! I can help you manage your emails. What would you like to do?",
    suggestions: [
      "Summarize my unread emails",
      "Find emails from last week about the project",
      "Draft a reply to the latest email from my boss",
      "Show me emails I haven't responded to",
    ],
  },
  "meeting-buddy": {
    name: "Meeting Buddy", 
    emoji: "📅",
    tagline: "Never forget what was discussed",
    color: "bg-purple-500",
    welcomeMessage: "Ready to help with your meetings! What do you need?",
    suggestions: [
      "Turn these notes into action items",
      "Write a follow-up email for my last meeting",
      "What meetings do I have today?",
      "Prep me for my 2pm call",
    ],
  },
  "research-helper": {
    name: "Research Helper",
    emoji: "🔍", 
    tagline: "Hours of research in minutes",
    color: "bg-green-500",
    welcomeMessage: "I'll help you research anything. What are you curious about?",
    suggestions: [
      "Compare the top 3 project management tools",
      "Summarize this article for me",
      "What's the latest news about AI?",
      "Find reviews of [product]",
    ],
  },
  "writing-coach": {
    name: "Writing Coach",
    emoji: "✏️",
    tagline: "Write better, faster",
    color: "bg-orange-500",
    welcomeMessage: "Paste any text and I'll help you improve it!",
    suggestions: [
      "Make this email more professional",
      "Shorten this to half the length",
      "Fix the grammar in this",
      "Make this sound friendlier",
    ],
  },
  "task-manager": {
    name: "Task Manager",
    emoji: "📝",
    tagline: "From chaos to clarity",
    color: "bg-pink-500",
    welcomeMessage: "Let's get organized! What's on your plate?",
    suggestions: [
      "I have too much to do, help me prioritize",
      "Break down this project into steps",
      "What should I focus on this week?",
      "Create a schedule for my tasks",
    ],
  },
  "data-analyst": {
    name: "Data Helper",
    emoji: "📊",
    tagline: "Make sense of numbers",
    color: "bg-cyan-500",
    welcomeMessage: "I'll help you understand your data. What are you looking at?",
    suggestions: [
      "Explain what this spreadsheet shows",
      "What chart should I use for this data?",
      "Find patterns in these numbers",
      "Help me create a simple report",
    ],
  },
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: {
    type: "approval";
    label: string;
    approved?: boolean;
  };
}

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const botId = params.botId as string;
  const recipe = searchParams.get("recipe");
  
  const bot = BOTS[botId] || BOTS["email-assistant"];
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle recipe from URL
  useEffect(() => {
    if (recipe && messages.length === 0) {
      const recipeMessages: Record<string, string> = {
        summarize: "Summarize my unread emails",
        draft: "Draft replies to my important emails",
        find: "Help me find an email",
        "action-items": "Turn my meeting notes into action items",
        followup: "Draft follow-up emails for my last meeting",
        prep: "Prep me for my next meeting",
        compare: "Help me compare some options",
        news: "Find recent news about a topic",
      };
      const message = recipeMessages[recipe];
      if (message) {
        handleSend(message);
      }
    }
  }, [recipe]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history for API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call real API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botId,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
        // Add approval action for certain responses
        ...(messageText.toLowerCase().includes("draft") || messageText.toLowerCase().includes("send") 
          ? {
              action: {
                type: "approval" as const,
                label: "Send this email?",
              },
            }
          : {}),
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = (messageId: string, approved: boolean) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId && msg.action
          ? { ...msg, action: { ...msg.action, approved } }
          : msg
      )
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 ${bot.color} rounded-xl flex items-center justify-center text-xl`}>
              {bot.emoji}
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{bot.name}</h1>
              <p className="text-xs text-gray-500">{bot.tagline}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            42/50 messages
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            /* Empty State with Suggestions */
            <div className="text-center py-12">
              <div className={`w-16 h-16 ${bot.color} rounded-2xl flex items-center justify-center text-3xl mx-auto`}>
                {bot.emoji}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {bot.welcomeMessage}
              </h2>
              <div className="mt-6 space-y-2 max-w-md mx-auto">
                <p className="text-sm text-gray-500 mb-3">Try one of these:</p>
                {bot.suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion)}
                    className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message List */
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Approval Action */}
                    {message.action && message.action.type === "approval" && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        {message.action.approved === undefined ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 mr-2">
                              {message.action.label}
                            </span>
                            <button
                              onClick={() => handleApprove(message.id, true)}
                              className="px-4 py-2 bg-green-500 text-white text-sm rounded-full hover:bg-green-600 transition-colors"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleApprove(message.id, false)}
                              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-full hover:bg-gray-300 transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <div className={`text-sm ${message.action.approved ? "text-green-600" : "text-gray-500"}`}>
                            {message.action.approved ? "✓ Sent!" : "Editing..."}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${bot.name} anything...`}
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500 text-center">
            {bot.name} reviews your request before taking action. You always approve first.
          </p>
        </div>
      </div>
    </div>
  );
}

// Bot responses now come from real Kimi API via /api/chat
