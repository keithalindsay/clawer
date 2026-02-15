'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '01',
    title: 'Create',
    description: 'Pick a pre-built AI team or build your own. Configure personality, skills, and integrations.',
    icon: '🎨',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    number: '02',
    title: 'Connect',
    description: 'Link your channels — WhatsApp, Telegram, or Slack — with a simple QR code or token.',
    icon: '🔗',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    number: '03',
    title: 'Deploy',
    description: 'Hit deploy. Your agents are live in 60 seconds, handling messages and tasks 24/7.',
    icon: '🚀',
    color: 'bg-green-100 text-green-600',
  },
];

export default function HowItWorks() {
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
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            From idea to deployed agents in under 60 seconds
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative bg-white border border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                delay: index * 0.15,
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -4 }}
            >
              {/* Step Number Badge */}
              <div className="absolute -top-4 -left-2 w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/25">
                {step.number}
              </div>

              {/* Icon */}
              <motion.div
                className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center text-3xl mb-6 mt-4`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                {step.icon}
              </motion.div>

              {/* Content */}
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>

              {/* Arrow connector (except last) */}
              {index < STEPS.length - 1 && (
                <motion.div
                  className="hidden md:block absolute top-1/2 -right-4 text-2xl text-gray-300"
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                >
                  →
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
