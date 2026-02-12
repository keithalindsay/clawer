'use client';

import { usePathname } from 'next/navigation';
import { FeedbackWidget } from './FeedbackWidget';

/**
 * Wrapper that only shows FeedbackWidget on authenticated pages
 * (dashboard, chat, admin, settings) but not on landing/marketing pages
 */
export function FeedbackWidgetWrapper() {
  const pathname = usePathname();
  
  // Show on authenticated pages only
  const showFeedback = pathname.startsWith('/dashboard') ||
                       pathname.startsWith('/chat') ||
                       pathname.startsWith('/admin') ||
                       pathname.includes('/settings');
  
  if (!showFeedback) {
    return null;
  }
  
  return <FeedbackWidget />;
}
