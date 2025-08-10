import React from 'react';
import { EnhancedChat } from '../components/EnhancedChat';

export const EnhancedChatDemo: React.FC = () => {
  return (
    <div className="h-screen bg-surface-50 dark:bg-surface-900">
      <div className="container mx-auto h-full max-w-4xl">
        <div className="h-full border-l border-r border-surface-200 dark:border-surface-700">
          <EnhancedChat conversationId="demo-conversation" />
        </div>
      </div>
    </div>
  );
};
