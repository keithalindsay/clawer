'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

const TIERS = [
  {
    name: 'Starter',
    price: { monthly: 49, annual: 470 },
    description: 'Perfect for individuals and small teams',
    features: [
      'Up to 3 agents',
      'All communication channels',
      'Basic automations',
      'Community support',
      '10GB storage',
      'Standard security',
    ],
    cta: 'Start Free',
    popular: false,
  },
  {
    name: 'Pro',
    price: { monthly: 99, annual: 950 },
    description: 'For growing teams and power users',
    features: [
      'Unlimited agents',
      'All communication channels',
      'Advanced automations',
      'Priority support',
      '100GB storage',
      'Enhanced security',
      'Custom integrations',
      'Team collaboration',
    ],
    cta: 'Start Free',
    popular: true,
  },
  {
    name: 'Business',
    price: { monthly: 200, annual: 1920 },
    description: 'Enterprise-grade for larger organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Unlimited storage',
      'Custom SLA',
      'SSO & SAML',
      'Audit logs',
      'Advanced analytics',
      'Custom deployment',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-white/[0.02] to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-[#e0e1e3] mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-[#6b6f76] max-w-2xl mx-auto mb-8">
            Start free, scale as you grow. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isAnnual ? 'text-[#e0e1e3]' : 'text-[#6b6f76]'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-white/[0.06] rounded-full border border-white/[0.06] transition-colors hover:border-white/[0.1]"
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 bg-blue-500 rounded-full"
                animate={{ x: isAnnual ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-[#e0e1e3]' : 'text-[#6b6f76]'}`}>
              Annual
              <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                Save 20%
              </span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {TIERS.map((tier, index) => (
            <motion.div
              key={tier.name}
              className={`relative bg-white/[0.03] border rounded-2xl p-8 hover:bg-white/[0.05] transition-all ${
                tier.popular
                  ? 'border-blue-500/50 shadow-lg shadow-blue-500/10'
                  : 'border-white/[0.06]'
              }`}
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
                borderColor: tier.popular ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.3)',
              }}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 bg-blue-500 text-white text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#e0e1e3] mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-[#6b6f76] mb-6">
                  {tier.description}
                </p>

                {/* Price */}
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-[#e0e1e3]">
                    ${isAnnual ? tier.price.annual : tier.price.monthly}
                  </span>
                  <span className="text-[#6b6f76]">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                </div>
                {isAnnual && (
                  <p className="text-xs text-green-400 mt-2">
                    ${Math.round(tier.price.annual / 12)}/month billed annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5"
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
                    <span className="text-sm text-[#e0e1e3]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={tier.cta === 'Contact Sales' ? '/contact' : '/sign-up'}
                className={`block w-full py-3 rounded-xl font-semibold text-center transition-all ${
                  tier.popular
                    ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/30'
                    : 'bg-white/[0.06] text-[#e0e1e3] border border-white/[0.06] hover:bg-white/[0.1] hover:border-white/[0.1]'
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.p
          className="text-center text-[#6b6f76] mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          All plans include 200 free messages to try it out. No credit card required.
        </motion.p>
      </div>
    </section>
  );
}
