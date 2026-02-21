'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const FEEDBACK_CATEGORIES = [
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'bug', label: 'Bug Report' },
  { value: 'skill_request', label: 'Skill Request' },
  { value: 'general', label: 'General Feedback' },
] as const;

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [category, setCategory] = useState<string>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const { user, isLoaded } = useUser();
  
  // Get current page path for context
  const currentPage = typeof window !== 'undefined' ? window.location.pathname : null;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message,
          email: user ? undefined : email,
          page: currentPage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setIsSuccess(true);
      setMessage('');
      setEmail('');
      setCategory('general');
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsSuccess(false);
    setError(null);
  };

  return (
    <>
      {/* Feedback Tab — fixed to right edge */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[70]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-4 rounded-l-lg shadow-lg transition-all duration-200 font-medium text-sm flex items-center gap-2"
          aria-label="Open feedback form"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="[writing-mode:vertical-rl]">Feedback</span>
        </button>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-[60]" onClick={handleClose} />
      )}

      {/* Feedback Panel — must be outside the translated tab div */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-full w-[400px] max-w-[90vw] bg-white shadow-2xl transition-transform duration-300 ease-in-out z-[70] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-orange-500 text-white px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Send Feedback</h2>
            <button
              onClick={handleClose}
              className="hover:bg-orange-600 rounded p-1 transition-colors"
              aria-label="Close feedback form"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isSuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="text-green-600 text-5xl mb-2">✓</div>
                <p className="text-green-800 font-medium">
                  Thanks! We read every submission.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category Dropdown */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    required
                  >
                    {FEEDBACK_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message Textarea */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                    placeholder="Tell us what you think..."
                    required
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {message.length}/2000 characters
                  </p>
                </div>

                {/* Email (only for anonymous users) */}
                {isLoaded && !user && (
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !message.trim()}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
