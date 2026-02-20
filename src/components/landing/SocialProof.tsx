'use client';

import { motion } from 'framer-motion';

const TRUST_SIGNALS = [
  {
    icon: '🦞',
    title: 'Built on OpenClaw',
    description: 'Powered by the open-source AI agent framework',
    link: 'https://openclaw.ai',
  },
  {
    icon: '⚡',
    title: 'Deploy in 60 seconds',
    description: 'From zero to production-ready AI team',
  },
  {
    icon: '🤝',
    title: 'AI teams, not chatbots',
    description: 'Multi-agent collaboration out of the box',
  },
  {
    icon: '💬',
    title: 'WhatsApp, Telegram & Slack',
    description: 'Deploy anywhere your team works',
  },
];

const STATS = [
  { value: '300K+', label: 'OpenClaw users' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<60s', label: 'Setup time' },
  { value: '100+', label: 'Integrations' },
];

export default function SocialProof() {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Teams Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The managed platform for OpenClaw AI agents
          </p>
        </motion.div>

        {/* Trust Signals */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {TRUST_SIGNALS.map((signal, index) => (
            <motion.div
              key={signal.title}
              className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm hover:shadow-lg transition-all"
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
              <div className="text-4xl mb-3">{signal.icon}</div>
              
              {/* Title */}
              {signal.link ? (
                <a
                  href={signal.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-semibold text-gray-900 mb-2 hover:text-orange-500 transition-colors"
                >
                  {signal.title}
                </a>
              ) : (
                <h3 className="font-semibold text-gray-900 mb-2">
                  {signal.title}
                </h3>
              )}
              
              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed">
                {signal.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-500 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Trust Logos */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <p className="text-sm text-gray-500 mb-4 uppercase tracking-wider font-medium">
            Powered by industry-leading AI
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {['OpenClaw', 'Anthropic', 'OpenAI', 'Google'].map((logo) => (
              <span
                key={logo}
                className="text-lg font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-default"
              >
                {logo}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
