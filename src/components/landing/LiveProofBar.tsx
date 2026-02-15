'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';

const CHANNELS = [
  { name: 'WhatsApp', icon: '💬', color: 'text-green-500' },
  { name: 'Telegram', icon: '✈️', color: 'text-blue-500' },
  { name: 'Discord', icon: '🎮', color: 'text-indigo-500' },
  { name: 'Slack', icon: '💼', color: 'text-purple-500' },
];

export default function LiveProofBar() {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    const controls = animate(count, 4231, {
      duration: 2,
      ease: [0.25, 0.1, 0.25, 1],
    });
    return controls.stop;
  }, [count]);

  return (
    <section className="py-10 bg-gray-50 border-y border-gray-100">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          className="flex flex-col md:flex-row items-center justify-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
        >
          {/* Counter */}
          <div className="text-center">
            <motion.div className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">
              <motion.span>{rounded}</motion.span>
            </motion.div>
            <p className="text-gray-600">agents handling messages right now</p>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-16 bg-gray-200" />

          {/* Channel icons */}
          <div className="flex items-center gap-4">
            {CHANNELS.map((channel, index) => (
              <div key={channel.name} className="flex items-center gap-4">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <div className="text-3xl">{channel.icon}</div>
                  {/* Pulse ring */}
                  <motion.div
                    className={`absolute inset-0 rounded-full ${channel.color} opacity-20`}
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.3, 0, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.4,
                    }}
                  />
                </motion.div>

                {/* Connector dot */}
                {index < CHANNELS.length - 1 && (
                  <div className="relative w-8 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 w-2 h-full bg-orange-400 rounded-full"
                      animate={{ x: [0, 24, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: index * 0.3,
                        ease: 'easeInOut',
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
