/**
 * CLAWER.AI Landing Page
 * 
 * Version 2.0 — The Definitive Brand (Feb 2026)
 * - Light theme, warm coral accents
 * - Professional, approachable, NOT a QuickClaw clone
 * - Framer Motion animations throughout
 */

'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import HeroSection from "@/components/landing/HeroSection";
import LiveProofBar from "@/components/landing/LiveProofBar";
import HowItWorks from "@/components/landing/HowItWorks";
import TeamTemplates from "@/components/landing/TeamTemplates";
import FeatureCards from "@/components/landing/FeatureCards";
import SocialProof from "@/components/landing/SocialProof";
import PricingSection from "@/components/landing/PricingSection";
import FinalCTA from "@/components/landing/FinalCTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <span className="text-xl font-bold text-gray-900">
              CLAWER<span className="text-orange-500">.AI</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link 
              href="#features" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Features
            </Link>
            <Link 
              href="#teams" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              AI Teams
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Blog
            </Link>
            <Link 
              href="/use-cases" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Use Cases
            </Link>
            <Link 
              href="/sign-in" 
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-orange-500 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-orange-600 transition-all hover:shadow-lg hover:shadow-orange-500/25"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile CTA */}
          <div className="flex md:hidden">
            <Link
              href="/sign-up"
              className="bg-orange-500 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-600 transition-colors"
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

      {/* AI Teams */}
      <div id="teams">
        <TeamTemplates />
      </div>

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
      <footer className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🦞</span>
                <span className="text-lg font-bold text-gray-900">
                  CLAWER<span className="text-orange-500">.AI</span>
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Deploy AI teams across any channel in seconds. Your agents, always on duty.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link href="#features" className="hover:text-orange-500 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#teams" className="hover:text-orange-500 transition-colors">
                    AI Teams
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-orange-500 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="hover:text-orange-500 transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link href="/about" className="hover:text-orange-500 transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-orange-500 transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-orange-500 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <a 
                    href="https://github.com/openclaw/openclaw" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-orange-500 transition-colors"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li>
                  <Link href="/privacy" className="hover:text-orange-500 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-orange-500 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-orange-500 transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <a 
                    href="mailto:support@clawer.ai" 
                    className="hover:text-orange-500 transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © 2026 Clawer.ai. Built on{' '}
              <a 
                href="https://github.com/openclaw/openclaw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 transition-colors"
              >
                OpenClaw
              </a>
              .
            </p>
            <div className="flex items-center gap-6">
              <a 
                href="https://twitter.com/clawer_ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                𝕏
              </a>
              <a 
                href="https://github.com/openclaw/openclaw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                GitHub
              </a>
              <a 
                href="https://discord.gg/openclaw" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
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
