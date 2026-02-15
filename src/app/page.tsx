/**
 * CLAWER.AI Landing Page
 * 
 * Complete redesign (Feb 2026): UX-driven, animated, conversion-focused
 * - Dark theme (#07080a) with premium animations
 * - Framer Motion scroll reveals & micro-interactions
 * - Clear value proposition with live demos
 * - Social proof and trust signals throughout
 */

'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import HeroSection from "@/components/landing/HeroSection";
import LiveProofBar from "@/components/landing/LiveProofBar";
import HowItWorks from "@/components/landing/HowItWorks";
import FeatureCards from "@/components/landing/FeatureCards";
import SocialProof from "@/components/landing/SocialProof";
import PricingSection from "@/components/landing/PricingSection";
import FinalCTA from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#07080a] text-[#e0e1e3]">
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-[#07080a]/80 backdrop-blur-lg border-b border-white/[0.06]"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <span className="text-xl font-bold">
              CLAWER<span className="text-blue-500">.AI</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="#features" 
              className="text-[#6b6f76] hover:text-[#e0e1e3] transition-colors"
            >
              Features
            </Link>
            <Link 
              href="#pricing" 
              className="text-[#6b6f76] hover:text-[#e0e1e3] transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href="/sign-in" 
              className="text-[#6b6f76] hover:text-[#e0e1e3] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-all hover:shadow-lg hover:shadow-blue-500/30"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile CTA */}
          <div className="flex md:hidden">
            <Link
              href="/sign-up"
              className="bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Live Proof Bar */}
      <LiveProofBar />

      {/* How It Works */}
      <HowItWorks />

      {/* Feature Cards */}
      <div id="features">
        <FeatureCards />
      </div>

      {/* Social Proof */}
      <SocialProof />

      {/* Pricing Section */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🦞</span>
                <span className="text-lg font-bold">
                  CLAWER<span className="text-blue-500">.AI</span>
                </span>
              </div>
              <p className="text-sm text-[#6b6f76]">
                Deploy AI agents across any communication channel in seconds.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-[#e0e1e3] mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-[#6b6f76]">
                <li>
                  <Link href="#features" className="hover:text-[#e0e1e3] transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-[#e0e1e3] transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-[#e0e1e3] transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/changelog" className="hover:text-[#e0e1e3] transition-colors">
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-[#e0e1e3] mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-[#6b6f76]">
                <li>
                  <Link href="/about" className="hover:text-[#e0e1e3] transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-[#e0e1e3] transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#e0e1e3] transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://github.com/openclaw/openclaw" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-[#e0e1e3] transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-[#e0e1e3] mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-[#6b6f76]">
                <li>
                  <Link href="/privacy" className="hover:text-[#e0e1e3] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-[#e0e1e3] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-[#e0e1e3] transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <a 
                    href="mailto:support@clawer.ai" 
                    className="hover:text-[#e0e1e3] transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#6b6f76]">
              © 2026 Clawer.ai. Built on{' '}
              <a 
                href="https://github.com/openclaw/openclaw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 transition-colors"
              >
                OpenClaw
              </a>
              .
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://twitter.com/clawer_ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#6b6f76] hover:text-[#e0e1e3] transition-colors"
              >
                𝕏
              </a>
              <a 
                href="https://github.com/openclaw/openclaw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#6b6f76] hover:text-[#e0e1e3] transition-colors"
              >
                GitHub
              </a>
              <a 
                href="https://discord.gg/openclaw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#6b6f76] hover:text-[#e0e1e3] transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
