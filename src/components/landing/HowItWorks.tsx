'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    number: '01',
    title: 'Create',
    description: 'Pick an AI team template or build your own. Configure personality, skills, and integrations.',
    icon: '🤖',
  },
  {
    number: '02',
    title: 'Connect',
    description: 'Link your channels (WhatsApp, Telegram, Slack) with a simple QR code or token.',
    icon: '🔗',
  },
  {
    number: '03',
    title: 'Deploy',
    description: 'Hit deploy. Your agents are live in seconds, handling messages and automating tasks 24/7.',
    icon: '🚀',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#e0e1e3] mb-4">
            How It Works
          </h2>
          <p className="text-xl text-[#6b6f76] max-w-2xl mx-auto">
            From idea to deployed agents in under 60 seconds
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.05] transition-all group"
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
              {/* Step Number Badge */}
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {step.number}
              </div>

              {/* Icon */}
              <motion.div
                className="text-6xl mb-6 mt-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                {step.icon}
              </motion.div>

              {/* Content */}
              <h3 className="text-2xl font-semibold text-[#e0e1e3] mb-3">
                {step.title}
              </h3>
              <p className="text-[#6b6f76] leading-relaxed">
                {step.description}
              </p>

              {/* Arrow connector (except last) */}
              {index < STEPS.length - 1 && (
                <motion.div
                  className="hidden md:block absolute top-1/2 -right-4 text-3xl text-white/[0.1]"
                  animate={{
                    x: [0, 5, 0],
                  }}
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
