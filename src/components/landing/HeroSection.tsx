'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const CHANNEL_ICONS = [
  { name: 'WhatsApp', icon: '💬', color: 'bg-green-50 text-green-600' },
  { name: 'Telegram', icon: '✈️', color: 'bg-blue-50 text-blue-600' },
  { name: 'Discord', icon: '🎮', color: 'bg-indigo-50 text-indigo-600' },
  { name: 'Slack', icon: '💼', color: 'bg-purple-50 text-purple-600' },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden bg-gradient-to-b from-orange-50/50 to-white">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-100 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-8"
        >
          <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          <span>Built on OpenClaw — trusted by 300,000+ users</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {['Your', 'Hosted', 'OpenClaw'].map((word, i) => (
            <motion.span
              key={i}
              className={i === 2 ? 'text-orange-500' : 'text-gray-900'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: i * 0.1,
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {word}{' '}
            </motion.span>
          ))}
          <br className="hidden md:block" />
          {['AI', 'Team,', 'Always', 'On', 'Duty'].map((word, i) => (
            <motion.span
              key={i + 3}
              className="text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: (i + 3) * 0.1,
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            >
              {word}{' '}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Deploy specialized AI agents across WhatsApp, Telegram, and Slack. 
          No setup, no maintenance — they just work.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mb-8"
        >
          <Link
            href="/sign-up"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all hover:shadow-xl hover:shadow-orange-500/25 hover:-translate-y-0.5"
          >
            Deploy Your First Agent
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • 200 free messages
          </p>
        </motion.div>

        {/* Channel badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <span className="text-sm text-gray-500 mr-2 self-center">Works with:</span>
          {CHANNEL_ICONS.map((channel, i) => (
            <motion.div
              key={channel.name}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm ${channel.color}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-lg">{channel.icon}</span>
              <span className="text-sm font-medium text-gray-700">{channel.name}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Demo Preview */}
        <motion.div
          className="mt-16 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white text-lg">
                🦞
              </div>
              <div>
                <p className="font-semibold text-gray-900">Max (AI Assistant)</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Online
                </p>
              </div>
            </div>
            
            {/* Chat messages */}
            <div className="p-5 space-y-4">
              <div className="flex justify-end">
                <div className="bg-orange-500 text-white px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%]">
                  <p className="text-sm">What&apos;s on my calendar today?</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[80%]">
                  <p className="text-sm leading-relaxed">
                    You have 3 meetings today:<br />
                    • 9am — Team standup<br />
                    • 2pm — Client call with Acme<br />
                    • 4:30pm — Design review
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
