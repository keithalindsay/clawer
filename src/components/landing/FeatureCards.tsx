'use client';

import { motion } from 'framer-motion';

const FEATURES = [
  {
    icon: '🖥️',
    title: 'Desktop Access',
    description: 'VNC viewer built-in. See exactly what your agent sees, interact with their desktop in real-time.',
  },
  {
    icon: '📁',
    title: 'File Management',
    description: 'Full filesystem access. Upload, download, edit files. Your agent has its own workspace.',
  },
  {
    icon: '⚡',
    title: 'Automation & Cron',
    description: 'Schedule tasks, set triggers, automate workflows. Let your agents work while you sleep.',
  },
  {
    icon: '🛍️',
    title: 'Skills Marketplace',
    description: 'Pre-built integrations for Gmail, Calendar, Notion, GitHub, and 100+ more services.',
  },
  {
    icon: '🌐',
    title: 'Multi-Channel',
    description: 'One agent, every platform. Deploy once, reach users on Telegram, WhatsApp, Discord, Slack.',
  },
  {
    icon: '🎙️',
    title: 'Voice Support',
    description: 'Text-to-speech and speech-to-text. Your agents can listen and speak naturally.',
  },
];

export default function FeatureCards() {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-transparent to-white/[0.02]">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#e0e1e3] mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-[#6b6f76] max-w-2xl mx-auto">
            Enterprise features without the enterprise complexity
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-6 hover:bg-white/[0.05] transition-all group cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                delay: index * 0.1,
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{
                scale: 1.02,
                borderColor: 'rgba(99, 102, 241, 0.3)',
                boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)',
              }}
            >
              {/* Icon with glow effect */}
              <motion.div
                className="relative mb-4"
                whileHover={{ scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <div className="text-5xl">{feature.icon}</div>
                <motion.div
                  className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl -z-10"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-[#e0e1e3] mb-2 group-hover:text-blue-400 transition-colors">
                {feature.title}
              </h3>
              <p className="text-[#6b6f76] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
