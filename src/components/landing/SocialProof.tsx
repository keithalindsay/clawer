'use client';

import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    name: 'Eric Siu',
    role: 'CEO, SingleGrain',
    handle: '@ericosiu',
    avatar: '👨‍💼',
    quote: 'This is exactly what I built for my 14-agent team. They made it work in 60 seconds.',
    context: 'After weeks building OpenClaw infrastructure',
  },
  {
    name: 'Winrey',
    role: 'Team9.ai',
    handle: '@team9_ai',
    avatar: '👩‍💻',
    quote: 'After deploying OpenClaw to 50 people, I learned: The hard part isn\'t the AI. It\'s the hosting.',
    context: 'On why managed hosting matters',
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
            Join thousands of teams already using Clawer
          </p>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all"
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
              {/* Quote */}
              <p className="text-gray-700 leading-relaxed mb-4 italic">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
              
              {/* Context */}
              <p className="text-sm text-gray-500 mb-5 pb-5 border-b border-gray-100">
                {testimonial.context}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.role}
                  </div>
                </div>
              </div>
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
