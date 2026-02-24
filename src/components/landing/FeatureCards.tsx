'use client';

import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '🖥️',
    title: 'Desktop Access',
    description: 'VNC viewer built-in. See exactly what your agent sees, interact with their desktop in real-time.',
    color: 'bg-blue-100',
  },
  {
    icon: '📁',
    title: 'File Management',
    description: 'Full filesystem access. Upload, download, edit files. Your agent has its own dedicated workspace.',
    color: 'bg-purple-100',
  },
  {
    icon: '⚡',
    title: 'Automation & Cron',
    description: 'Schedule tasks, set triggers, automate workflows. Let your agents work while you sleep.',
    color: 'bg-amber-100',
  },
  {
    icon: '🛍️',
    title: 'Skills Marketplace',
    description: 'Pre-built integrations for Gmail, Calendar, Notion, GitHub, and 100+ more services.',
    color: 'bg-green-100',
  },
  {
    icon: '🌐',
    title: 'Multi-Channel',
    description: 'One agent, every platform. Deploy once, reach users on Telegram, WhatsApp, Discord, Slack.',
    color: 'bg-cyan-100',
  },
  {
    icon: '🔐',
    title: 'Security First',
    description: 'Isolated Docker containers. BYOK option. Your data never leaves your control. Security-first architecture with SOC 2 aligned practices.',
    color: 'bg-rose-100',
  },
];

export default function FeatureCards() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enterprise features without the enterprise complexity
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition-all group"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -4 }}
            >
              {/* Icon */}
              <motion.div
                className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center text-3xl mb-5`}
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                {feature.icon}
              </motion.div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
