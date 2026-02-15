'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

const CHANNELS = [
  { name: 'Telegram', icon: '✈️', color: 'text-blue-400' },
  { name: 'WhatsApp', icon: '💬', color: 'text-green-400' },
  { name: 'Discord', icon: '🎮', color: 'text-indigo-400' },
  { name: 'Slack', icon: '💼', color: 'text-purple-400' },
];

export default function LiveProofBar() {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    const controls = animate(count, 4231, {
      duration: 2,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return controls.stop;
  }, [count]);

  return (
    <section className="py-12 border-y border-white/[0.06]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
        >
          {/* Counter */}
          <div className="text-center">
            <motion.div className="text-5xl font-bold text-[#e0e1e3] mb-2">
              <motion.span>{rounded}</motion.span>
            </motion.div>
            <p className="text-[#6b6f76]">agents handling messages right now</p>
          </div>

          {/* Flowing Dots Between Channels */}
          <div className="flex items-center gap-3">
            {CHANNELS.map((channel, index) => (
              <div key={channel.name} className="flex items-center gap-3">
                <div className="relative">
                  <div className="text-3xl">{channel.icon}</div>
                  {/* Pulsing ring */}
                  <motion.div
                    className={`absolute inset-0 rounded-full ${channel.color} opacity-20`}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.2, 0, 0.2],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.3,
                    }}
                  />
                </div>

                {/* Flowing dots connector */}
                {index < CHANNELS.length - 1 && (
                  <div className="relative w-12 h-1">
                    <div className="absolute inset-0 bg-white/[0.06] rounded-full" />
                    <motion.div
                      className="absolute top-0 left-0 w-2 h-1 bg-blue-500 rounded-full"
                      animate={{
                        x: [0, 40, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: index * 0.3,
                        ease: 'linear',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
