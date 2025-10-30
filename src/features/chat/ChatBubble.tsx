import React from 'react';
import { cn } from '@/lib/utils';

type ChatBubbleProps = {
  who?: 'bot' | 'user';
  text: string;
  actions?: React.ReactNode;
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ who = 'bot', text, actions }) => (
  <div className={cn('flex', who === 'user' ? 'justify-end' : 'justify-start')}>
    <div
      className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm',
        who === 'user' ? 'bg-[#3296C8] text-white' : 'bg-white border border-line'
      )}
    >
      <div className="whitespace-pre-wrap leading-relaxed">{text}</div>
      {actions && <div className="mt-2 flex flex-wrap gap-2">{actions}</div>}
    </div>
  </div>
);

export default ChatBubble;
