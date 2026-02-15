'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const DEMO_MESSAGES = [
  { role: 'user', text: 'Check my calendar for today' },
  { role: 'assistant', text: 'You have 3 meetings today:\n• 9am - Team standup\n• 2pm - Client call with Acme Corp\n• 4:30pm - Design review' },
];

const CHANNEL_ICONS = [
  { name: 'Telegram', icon: '✈️' },
  { name: 'WhatsApp', icon: '💬' },
  { name: 'Discord', icon: '🎮' },
  { name: 'Slack', icon: '💼' },
];

export default function HeroSection() {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % DEMO_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
      {/* Gradient Orbs Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: [0.25, 0.1, 0.25, 1],
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Headline & CTA */}
          <div>
            <motion.h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {['Your', 'AI', 'employees,', 'always', 'on', 'duty'].map((word, i) => (
                <motion.span
                  key={i}
                  className={i < 2 ? 'text-[#e0e1e3]' : i === 2 ? 'text-blue-500' : 'text-[#e0e1e3]'}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.1,
                    duration: 0.6,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  {word}{' '}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className="text-xl text-[#6b6f76] mb-8 max-w-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              Deploy specialized AI agents across your communication channels. 
              No setup, no maintenance, always working.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <Link
                href="/sign-up"
                className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/30"
              >
                Deploy Your First Agent
              </Link>
              <p className="text-sm text-[#6b6f76] mt-3">
                No credit card required • 200 free messages
              </p>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              className="flex items-center gap-4 mt-8 flex-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.6 }}
            >
              <span className="text-sm text-[#6b6f76]">Supported channels:</span>
              {CHANNEL_ICONS.map((channel) => (
                <div
                  key={channel.name}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg"
                >
                  <span className="text-lg">{channel.icon}</span>
                  <span className="text-sm text-[#e0e1e3]">{channel.name}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Live Demo Terminal */}
          <motion.div
            className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Terminal Header */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <span className="text-sm text-[#6b6f76] ml-2">Agent Chat</span>
            </div>

            {/* Messages */}
            <div className="space-y-4 min-h-[300px]">
              {DEMO_MESSAGES.map((msg, i) => (
                <motion.div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: currentMessage >= i ? 1 : 0.3,
                    y: 0,
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-xl ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/[0.06] text-[#e0e1e3] border border-white/[0.06]'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {currentMessage === 0 && (
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <div className="flex gap-1.5 px-4 py-3 bg-white/[0.06] rounded-xl border border-white/[0.06]">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{
                          y: [0, -8, 0],
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
