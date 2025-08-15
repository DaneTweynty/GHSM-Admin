// =============================================
// TEACHER CHAT HOOK
// Manages chat functionality for teacher mobile app
// =============================================
// @ts-nocheck

import { useState, useEffect, useCallback } from 'react';
import { teacherService } from '../services/teacherService';
import { useTeacherAuth } from './useTeacherAuth';
import type { 
  InstructorConversation, 
  ChatMessageWithSender, 
  ChatMessageForm,
  ChatMessageType 
} from '../types/database.types';

export interface UseTeacherChatReturn {
  // Chat Data
  conversations: InstructorConversation[];
  activeConversation: InstructorConversation | null;
  messages: ChatMessageWithSender[];
  
  // Loading States
  isLoading: boolean;
  isLoadingMessages: boolean;
  isSending: boolean;
  isUploading: boolean;
  
  // Error States
  error: string | null;
  
  // Actions
  fetchConversations: () => Promise<void>;
  setActiveConversation: (conversation: InstructorConversation | null) => void;
  fetchMessages: (conversationId: string, limit?: number, offset?: number) => Promise<void>;
  sendMessage: (content: string, type?: ChatMessageType) => Promise<{ success: boolean; error: string | null }>;
  sendFileMessage: (file: File, content?: string) => Promise<{ success: boolean; error: string | null }>;
  markMessagesAsRead: (conversationId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  
  // Real-time
  subscribeToMessages: (conversationId: string) => () => void;
  
  // Utility Methods
  clearError: () => void;
  getUnreadCount: () => number;
  getTotalUnreadCount: () => number;
  formatFileSize: (bytes: number) => string;
  validateMessage: (formData: ChatMessageForm) => { isValid: boolean; errors: string[] };
  isImageFile: (file: File) => boolean;
  isAudioFile: (file: File) => boolean;
}

export function useTeacherChat(): UseTeacherChatReturn {
  const { profile, isAuthenticated } = useTeacherAuth();
  
  // State
  const [conversations, setConversations] = useState<InstructorConversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<InstructorConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessageWithSender[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated || !profile?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await teacherService.getInstructorConversations(profile.id);
      setConversations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Set active conversation
  const setActiveConversation = useCallback((conversation: InstructorConversation | null) => {
    setActiveConversationState(conversation);
    setMessages([]);
    setMessagesOffset(0);
    setHasMoreMessages(true);
    
    if (conversation) {
      fetchMessages(conversation.conversation_id);
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async (
    conversationId: string, 
    limit = 50, 
    offset = 0
  ) => {
    if (!isAuthenticated || !profile?.id) return;

    try {
      setIsLoadingMessages(true);
      setError(null);

      const data = await teacherService.getChatMessages(conversationId, limit, offset);
      
      if (offset === 0) {
        setMessages(data.reverse().map(msg => ({
          ...msg,
          conversation_id: '',
          file_size: null,
          file_type: null,
          metadata: null,
          created_by: msg.sender_id,
          version: 1,
          parent_message_id: null,
          edited_at: null,
          deleted_at: null,
          read_by: []
        }))); // Reverse to show newest at bottom
      } else {
        setMessages(prev => [...data.reverse(), ...prev]);
      }

      setHasMoreMessages(data.length === limit);
      setMessagesOffset(offset + data.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [isAuthenticated, profile?.id]);

  // Send message
  const sendMessage = useCallback(async (
    content: string, 
    type: ChatMessageType = 'text'
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!isAuthenticated || !profile?.id || !activeConversation) {
      return { success: false, error: 'Not authenticated or no active conversation' };
    }

    if (!content.trim()) {
      return { success: false, error: 'Message content cannot be empty' };
    }

    try {
      setIsSending(true);
      setError(null);

      const message = await teacherService.sendMessage({
        conversationId: activeConversation.conversation_id,
        senderId: profile.id,
        content: content.trim(),
        type
      });

      // Add message to local state
      const newMessage: ChatMessageWithSender = {
        ...message,
        sender: {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          email: profile.email,
          role: 'instructor',
          phone: profile.phone,
          is_active: profile.is_active,
          last_login_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      setMessages(prev => [...prev, newMessage]);

      return { success: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Failed to send message:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsSending(false);
    }
  }, [isAuthenticated, profile, activeConversation]);

  // Send file message
  const sendFileMessage = useCallback(async (
    file: File, 
    content = ''
  ): Promise<{ success: boolean; error: string | null }> => {
    if (!isAuthenticated || !profile?.id || !activeConversation) {
      return { success: false, error: 'Not authenticated or no active conversation' };
    }

    // Validate file
    const validation = validateMessage({ content, type: 'file', file });
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    try {
      setIsUploading(true);
      setError(null);

      // Upload file
      const fileUrl = await teacherService.uploadChatFile(file, activeConversation.conversation_id);

      // Determine message type
      let messageType: ChatMessageType = 'file';
      if (isImageFile(file)) {
        messageType = 'image';
      } else if (isAudioFile(file)) {
        messageType = 'audio';
      }

      // Send message with file
      const message = await teacherService.sendMessage({
        conversationId: activeConversation.conversation_id,
        senderId: profile.id,
        content: content || file.name,
        type: messageType,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Add message to local state
      const newMessage: ChatMessageWithSender = {
        ...message,
        sender: {
          id: profile.id,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          email: profile.email,
          role: 'instructor',
          phone: profile.phone,
          is_active: profile.is_active,
          last_login_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      setMessages(prev => [...prev, newMessage]);

      return { success: true, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send file';
      setError(errorMessage);
      console.error('Failed to send file:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
    }
  }, [isAuthenticated, profile, activeConversation]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (conversationId: string) => {
    if (!isAuthenticated || !profile?.id) return;

    try {
      await teacherService.markMessagesAsRead(conversationId, profile.id);

      // Update local state
      setConversations(prev =>
        prev.map(conv =>
          conv.conversation_id === conversationId
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [isAuthenticated, profile?.id]);

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation || !hasMoreMessages || isLoadingMessages) return;
    
    await fetchMessages(activeConversation.conversation_id, 50, messagesOffset);
  }, [activeConversation, hasMoreMessages, isLoadingMessages, messagesOffset, fetchMessages]);

  // Subscribe to real-time messages
  const subscribeToMessages = useCallback((conversationId: string) => {
    const subscription = teacherService.subscribeToChatMessages(conversationId, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as ChatMessageWithSender;
        
        // Only add if it's not from current user (to avoid duplicates)
        if (newMessage.sender_id !== profile?.id) {
          setMessages(prev => [...prev, newMessage]);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [profile?.id]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get unread count for active conversation
  const getUnreadCount = useCallback((): number => {
    return Number(activeConversation?.unread_count || 0);
  }, [activeConversation?.unread_count]);

  // Get total unread count
  const getTotalUnreadCount = useCallback((): number => {
    return conversations.reduce((total, conv) => total + Number(conv.unread_count || 0), 0);
  }, [conversations]);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Validate message
  const validateMessage = useCallback((formData: ChatMessageForm): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validate content
    if (!formData.content?.trim() && formData.type === 'text') {
      errors.push('Message content cannot be empty');
    }

    // Validate file
    if (formData.file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (formData.file.size > maxSize) {
        errors.push('File size cannot exceed 10MB');
      }

      // Check file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'audio/mpeg', 'audio/wav', 'audio/ogg',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(formData.file.type)) {
        errors.push('File type not supported');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Check if file is image
  const isImageFile = useCallback((file: File): boolean => {
    return file.type.startsWith('image/');
  }, []);

  // Check if file is audio
  const isAudioFile = useCallback((file: File): boolean => {
    return file.type.startsWith('audio/');
  }, []);

  // Initial data fetch when authenticated
  useEffect(() => {
    if (isAuthenticated && profile?.id) {
      fetchConversations();
    }
  }, [isAuthenticated, profile?.id, fetchConversations]);

  return {
    // Chat Data
    conversations,
    activeConversation,
    messages,
    
    // Loading States
    isLoading,
    isLoadingMessages,
    isSending,
    isUploading,
    
    // Error States
    error,
    
    // Actions
    fetchConversations,
    setActiveConversation,
    fetchMessages,
    sendMessage,
    sendFileMessage,
    markMessagesAsRead,
    loadMoreMessages,
    
    // Real-time
    subscribeToMessages,
    
    // Utility Methods
    clearError,
    getUnreadCount,
    getTotalUnreadCount,
    formatFileSize,
    validateMessage,
    isImageFile,
    isAudioFile
  };
}
