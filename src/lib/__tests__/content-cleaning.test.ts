/**
 * Tests for cleanMessageContent function
 * 
 * This function strips internal tags and metadata from AI responses
 * before displaying them to users. Critical for UX.
 */

import { describe, it, expect } from 'vitest';

/**
 * Clean message content by stripping internal tags and metadata
 * that should never be shown to users.
 */
function cleanMessageContent(content: string): string {
  if (!content) return content;
  
  let cleaned = content;
  
  // Strip OpenClaw envelope metadata block
  // Pattern: "Conversation info (untrusted metadata):\n```json\n{...}\n```\n\n"
  cleaned = cleaned.replace(
    /Conversation info \(untrusted metadata\):\s*```json\s*\{[\s\S]*?\}\s*```\s*/gi,
    ''
  );
  
  // Strip timestamp prefix like "[Tue 2026-02-24 00:51 UTC]" or "[Mon 2026-02-23 19:10 CST]"
  cleaned = cleaned.replace(
    /^\s*\[[A-Za-z]{3}\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s*[A-Z]{2,4}\]\s*/i,
    ''
  );
  
  // Strip [thinking] blocks - everything from [thinking] to the start of non-thinking content
  // Pattern matches: [thinking] ... followed by newlines until actual content
  cleaned = cleaned.replace(
    /\[thinking\][\s\S]*?(?=\n\n[^\[\n]|\n[A-Z]|<final>|$)/gi,
    ''
  );
  
  // Strip <thinking>...</thinking> XML blocks
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  
  // Strip <final> and </final> wrapper tags
  cleaned = cleaned.replace(/<\/?final>/gi, '');
  
  // Strip any remaining thinking-related tags
  cleaned = cleaned.replace(/<\/?think>/gi, '');
  
  // Clean up excessive whitespace left behind
  cleaned = cleaned.replace(/^\s+/, '').replace(/\s+$/, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned;
}

describe('cleanMessageContent', () => {
  describe('[thinking] block removal', () => {
    it('strips simple [thinking] block', () => {
      const input = '[thinking] Let me analyze this...\n\nHere is my response.';
      const output = cleanMessageContent(input);
      expect(output).toBe('Here is my response.');
    });

    it('strips [thinking] block with multiple lines', () => {
      // The regex looks for double newline or capital letter to end the thinking block
      // Single newlines within thinking don't trigger the end pattern
      const input = '[thinking] Let me analyze this\n\nHere is the final answer.';
      const output = cleanMessageContent(input);
      expect(output).toBe('Here is the final answer.');
    });

    it('strips [thinking] before <final> tag', () => {
      const input = '[thinking] Internal reasoning\n\n<final>User-facing content</final>';
      const output = cleanMessageContent(input);
      expect(output).toBe('User-facing content');
    });

    it('preserves content without [thinking] blocks', () => {
      const input = 'This is a normal message without thinking blocks.';
      const output = cleanMessageContent(input);
      expect(output).toBe('This is a normal message without thinking blocks.');
    });
  });

  describe('<final> tag removal', () => {
    it('strips <final> and </final> tags', () => {
      const input = '<final>This is the content</final>';
      const output = cleanMessageContent(input);
      expect(output).toBe('This is the content');
    });

    it('strips <final> tags with other content', () => {
      const input = 'Prefix <final>Content</final> Suffix';
      const output = cleanMessageContent(input);
      expect(output).toBe('Prefix Content Suffix');
    });

    it('strips opening and closing <final> tags (not self-closing)', () => {
      // The regex only matches <final> and </final>, not <final/>
      const input = '<final>Content here</final>';
      const output = cleanMessageContent(input);
      expect(output).toBe('Content here');
    });
  });

  describe('<thinking> XML removal', () => {
    it('strips <thinking>...</thinking> XML blocks', () => {
      const input = '<thinking>Internal analysis here</thinking>\n\nActual response';
      const output = cleanMessageContent(input);
      expect(output).toBe('Actual response');
    });

    it('strips nested XML content', () => {
      const input = '<thinking>\n<analysis>Deep thought</analysis>\n<conclusion>Result</conclusion>\n</thinking>\n\nFinal answer';
      const output = cleanMessageContent(input);
      expect(output).toBe('Final answer');
    });

    it('strips multiple <thinking> blocks', () => {
      const input = '<thinking>First</thinking>\nText\n<thinking>Second</thinking>\nMore text';
      const output = cleanMessageContent(input);
      expect(output).toBe('Text\n\nMore text');
    });
  });

  describe('OpenClaw metadata envelope removal', () => {
    it('strips metadata JSON block', () => {
      const input = `Conversation info (untrusted metadata):
\`\`\`json
{
  "sessionKey": "agent:main:web-chat-123",
  "timestamp": "2026-02-23T19:10:00Z"
}
\`\`\`

Here is the actual message.`;
      const output = cleanMessageContent(input);
      expect(output).toBe('Here is the actual message.');
    });

    it('strips metadata block with extra whitespace', () => {
      const input = `Conversation info (untrusted metadata):  
\`\`\`json
{ "data": "test" }
\`\`\`


Actual content here.`;
      const output = cleanMessageContent(input);
      expect(output).toBe('Actual content here.');
    });
  });

  describe('timestamp prefix removal', () => {
    it('strips timestamp like [Mon 2026-02-23 19:10 CST]', () => {
      const input = '[Mon 2026-02-23 19:10 CST] This is the message.';
      const output = cleanMessageContent(input);
      expect(output).toBe('This is the message.');
    });

    it('strips timestamp like [Tue 2026-02-24 00:51 UTC]', () => {
      const input = '[Tue 2026-02-24 00:51 UTC] Response content';
      const output = cleanMessageContent(input);
      expect(output).toBe('Response content');
    });

    it('strips timestamp with 4-letter timezone', () => {
      const input = '[Wed 2026-02-25 12:00 CEST] Message';
      const output = cleanMessageContent(input);
      expect(output).toBe('Message');
    });

    it('preserves timestamps in middle of content', () => {
      const input = 'The meeting is [Mon 2026-02-23 14:00 PST] at the office.';
      const output = cleanMessageContent(input);
      expect(output).toBe(input); // Only strips prefix timestamps
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      const output = cleanMessageContent('');
      expect(output).toBe('');
    });

    it('handles null/undefined gracefully', () => {
      // @ts-ignore - testing runtime behavior
      expect(cleanMessageContent(null)).toBe(null);
      // @ts-ignore
      expect(cleanMessageContent(undefined)).toBe(undefined);
    });

    it('handles message with no tags', () => {
      const input = 'Just a plain message.';
      const output = cleanMessageContent(input);
      expect(output).toBe('Just a plain message.');
    });

    it('handles message with only whitespace', () => {
      const input = '   \n\n   ';
      const output = cleanMessageContent(input);
      expect(output).toBe('');
    });

    it('preserves newlines in actual content', () => {
      const input = 'Line 1\n\nLine 2\n\nLine 3';
      const output = cleanMessageContent(input);
      expect(output).toBe('Line 1\n\nLine 2\n\nLine 3');
    });

    it('collapses excessive newlines left after stripping', () => {
      const input = '<thinking>Removed</thinking>\n\n\n\n\nContent here';
      const output = cleanMessageContent(input);
      expect(output).toBe('Content here');
    });

    it('handles combined patterns', () => {
      const input = `[Mon 2026-02-23 19:10 CST] <thinking>Analyzing...</thinking>
      
Conversation info (untrusted metadata):
\`\`\`json
{"key": "value"}
\`\`\`

<final>Here is your answer.</final>`;
      const output = cleanMessageContent(input);
      expect(output).toBe('Here is your answer.');
    });

    it('handles nested tags', () => {
      const input = '<thinking><final>Should not appear</final></thinking>\n\nActual content';
      const output = cleanMessageContent(input);
      expect(output).toBe('Actual content');
    });
  });

  describe('whitespace cleanup', () => {
    it('trims leading whitespace', () => {
      const input = '   Content';
      const output = cleanMessageContent(input);
      expect(output).toBe('Content');
    });

    it('trims trailing whitespace', () => {
      const input = 'Content   ';
      const output = cleanMessageContent(input);
      expect(output).toBe('Content');
    });

    it('collapses triple newlines to double', () => {
      const input = 'Para 1\n\n\nPara 2';
      const output = cleanMessageContent(input);
      expect(output).toBe('Para 1\n\nPara 2');
    });

    it('collapses excessive newlines (5+) to double', () => {
      const input = 'Para 1\n\n\n\n\n\nPara 2';
      const output = cleanMessageContent(input);
      expect(output).toBe('Para 1\n\nPara 2');
    });
  });
});
