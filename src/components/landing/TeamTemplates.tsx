'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const TEMPLATES = [
  {
    name: 'Life OS',
    description: 'Personal productivity assistant. Email summaries, calendar management, task tracking.',
    icon: '🧠',
    gradient: 'from-violet-500 to-purple-600',
    features: ['Email drafts', 'Calendar sync', 'Daily briefings'],
  },
  {
    name: 'E-commerce Agent',
    description: 'Customer support bot. Order tracking, FAQ handling, returns processing.',
    icon: '🛍️',
    gradient: 'from-orange-500 to-amber-500',
    features: ['Order status', 'Product search', '24/7 support'],
  },
  {
    name: "Mom's Command Center",
    description: 'Family assistant. Schedule coordination, meal planning, activity reminders.',
    icon: '👩‍👧‍👦',
    gradient: 'from-pink-500 to-rose-500',
    features: ['Family calendar', 'Meal ideas', 'Homework help'],
  },
  {
    name: 'Developer Companion',
    description: 'Coding assistant. Code review, documentation lookup, debugging help.',
    icon: '💻',
    gradient: 'from-cyan-500 to-blue-500',
    features: ['Code review', 'API lookup', 'Bug triage'],
  },
];

export default function TeamTemplates() {
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
            Start with a Template
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Pre-configured AI teams for common use cases. Customize as you grow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEMPLATES.map((template, index) => (
            <motion.div
              key={template.name}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                delay: index * 0.1,
                duration: 0.5,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              whileHover={{ y: -6 }}
            >
              {/* Icon with gradient background */}
              <motion.div
                className={`w-14 h-14 bg-gradient-to-br ${template.gradient} rounded-xl flex items-center justify-center text-2xl mb-5 shadow-lg`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                {template.icon}
              </motion.div>

              {/* Name */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                {template.name}
              </h3>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                {template.description}
              </p>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-2">
                {template.features.map((feature) => (
                  <span
                    key={feature}
                    className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 text-orange-500 font-semibold hover:text-orange-600 transition-colors"
          >
            Browse all templates
            <span className="text-lg">→</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
