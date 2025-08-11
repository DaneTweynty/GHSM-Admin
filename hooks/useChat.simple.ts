import { useState, useCallback } from 'react';
import type { ChatMessage, ChatConversation, ChatAnalytics } from '../types';

// Simplified chat hook to make the project buildable
export const useChat = (conversationId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);

  // Mock analytics
  const analytics: ChatAnalytics = {
    totalMessages: 0,
    totalConversations: 0,
    avgResponseTime: 0,
    messagesByType: {},
    activeHours: {},
    sentiment: { positive: 0, negative: 0, neutral: 0 },
    topContacts: []
  };

  // Simplified methods
  const sendMessage = useCallback(async (content: string, type = 'text', _attachments?: any[]) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: 'user',
      senderName: 'User',
      senderType: 'admin',
      content,
      timestamp: new Date().toISOString(),
      readBy: [],
      type: type as any,
      status: 'sent'
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: newContent, edited: true, editedAt: new Date().toISOString() }
        : msg
    ));
  }, []);

  const deleteMessage = useCallback(async (messageId: string, _permanent = false) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  }, []);

  const selectMessage = useCallback((messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  }, []);

  const selectAllMessages = useCallback(() => {
    setSelectedMessages(messages.map(msg => msg.id));
  }, [messages]);

  const clearSelection = useCallback(() => {
    setSelectedMessages([]);
  }, []);

  const uploadFile = useCallback(async (_file: File) => {
    // Stub implementation
    console.log('File upload not implemented');
  }, []);

  const scheduleMessage = useCallback(async (_content: string, _sendAt: Date) => {
    // Stub implementation
    console.log('Message scheduling not implemented');
  }, []);

  const startScreenShare = useCallback(() => {
    setIsScreenSharing(true);
  }, []);

  const stopScreenShare = useCallback(() => {
    setIsScreenSharing(false);
  }, []);

  const setTyping = useCallback((_isTyping: boolean) => {
    // Stub implementation
  }, []);

  const updatePreferences = useCallback((_preferences: any) => {
    // Stub implementation
  }, []);

  return {
    // State
    messages,
    conversations,
    isRecording,
    isScreenSharing,
    searchQuery,
    selectedMessages,
    analytics,
    
    // Methods
    sendMessage,
    editMessage,
    deleteMessage,
    selectMessage,
    selectAllMessages,
    clearSelection,
    uploadFile,
    scheduleMessage,
    startScreenShare,
    stopScreenShare,
    setTyping,
    updatePreferences,
    
    // Additional properties that components might expect
    isTyping: false,
    isLoading: false,
    error: null
  };
};
