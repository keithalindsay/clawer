'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PricingSection() {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            One plan. Everything included. Scale as you grow.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Main Plan */}
          <motion.div
            className="relative bg-white border-2 border-orange-500 rounded-2xl p-8 shadow-xl shadow-orange-500/10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ y: -4 }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-full shadow-lg">
                Early Access
              </div>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Clawer Pro
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Everything you need to deploy your AI team
              </p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-gray-900">$49</span>
                <span className="text-gray-500">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {[
                'Up to 3 AI agents',
                'All channels (WhatsApp, Telegram, Discord, Slack)',
                'Pre-built AI team configurations',
                'Automated tasks & scheduling',
                'Long-term memory & personality',
                'File access & desktop viewer',
                'Curated skills marketplace',
                '10GB storage',
                'Email support',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/sign-up"
              className="block w-full py-3 rounded-full font-semibold text-center bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25 transition-all"
            >
              Get Started Free
            </Link>

            <p className="text-center text-xs text-gray-500 mt-3">
              200 free messages included. No credit card required.
            </p>
          </motion.div>

          {/* Coming Soon */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="bg-white border border-gray-200 rounded-2xl p-6 opacity-75">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">Team</h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Unlimited agents, team collaboration, advanced automations, priority support.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 opacity-75">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900">Business</h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Enterprise-grade with SSO, custom SLA, dedicated support, and audit logs.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
              <p className="text-sm text-orange-800 font-medium">
                🚀 Early access members get locked-in pricing when we launch higher tiers. Join now and save.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
