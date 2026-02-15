'use client';

import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    role: 'Product Manager',
    company: 'TechCorp',
    avatar: '👩‍💼',
    quote: 'Clawer cut our response time from hours to minutes. Our customers love it.',
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Founder',
    company: 'StartupXYZ',
    avatar: '👨‍💻',
    quote: "It's like hiring a team of specialists without the overhead. Game changer.",
  },
  {
    name: 'Emily Watson',
    role: 'Operations Lead',
    company: 'Scale Co',
    avatar: '👩‍🔬',
    quote: 'Set it up in 5 minutes. Been running flawlessly for 3 months. Worth every penny.',
  },
];

const TRUST_LOGOS = [
  'OpenClaw',
  'Anthropic',
  'OpenAI',
  'Google',
];

export default function SocialProof() {
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
            Trusted by Teams Worldwide
          </h2>
          <p className="text-xl text-[#6b6f76] max-w-2xl mx-auto">
            Join thousands of teams already using Clawer
          </p>
        </motion.div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.05] transition-all"
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
              }}
            >
              {/* Quote */}
              <p className="text-[#e0e1e3] leading-relaxed mb-6 italic">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="text-4xl">{testimonial.avatar}</div>
                <div>
                  <div className="font-semibold text-[#e0e1e3]">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-[#6b6f76]">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <p className="text-sm text-[#6b6f76] mb-6 uppercase tracking-wider">
            Powered by industry-leading AI
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {TRUST_LOGOS.map((logo, index) => (
              <motion.div
                key={logo}
                className="text-xl font-semibold text-[#6b6f76] hover:text-[#e0e1e3] transition-colors cursor-pointer"
                initial={{ opacity: 0.5 }}
                whileHover={{ opacity: 1, scale: 1.1 }}
                transition={{ delay: index * 0.1 }}
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {[
            { value: '300K+', label: 'Active Users' },
            { value: '99.9%', label: 'Uptime' },
            { value: '<60s', label: 'Setup Time' },
            { value: '100+', label: 'Integrations' },
          ].map((stat, index) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-[#6b6f76]">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
