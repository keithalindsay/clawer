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
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
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
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Start free, scale as you grow. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 bg-gray-200 rounded-full transition-colors hover:bg-gray-300"
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 bg-orange-500 rounded-full shadow-sm"
                animate={{ x: isAnnual ? 24 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
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
              className={`relative bg-white border rounded-2xl p-8 transition-all ${
                tier.popular
                  ? 'border-orange-500 shadow-xl shadow-orange-500/10'
                  : 'border-gray-200 shadow-sm hover:shadow-lg'
              }`}
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
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1.5 bg-orange-500 text-white text-sm font-semibold rounded-full shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {tier.name}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {tier.description}
                </p>

                {/* Price */}
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-gray-900">
                    ${isAnnual ? tier.price.annual : tier.price.monthly}
                  </span>
                  <span className="text-gray-500">
                    /{isAnnual ? 'year' : 'month'}
                  </span>
                </div>
                {isAnnual && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    ${Math.round(tier.price.annual / 12)}/month billed annually
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
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

              {/* CTA */}
              <Link
                href={tier.cta === 'Contact Sales' ? '/contact' : '/sign-up'}
                className={`block w-full py-3 rounded-full font-semibold text-center transition-all ${
                  tier.popular
                    ? 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.p
          className="text-center text-gray-500 mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          All plans include 200 free messages to try it out. No credit card required.
        </motion.p>
      </div>
    </section>
  );
}
