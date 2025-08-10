import type { ChatMessage, ChatConversation, ChatPreferences, ChatAnalytics } from '../types';
import { ChatCache, PerformanceMonitor, analyzeMessage, compressMessage } from '../utils/chatUtils';

class ChatService {
  private static instance: ChatService;
  private cache = ChatCache.getInstance();
  private eventListeners = new Map<string, Set<Function>>();
  
  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  // Event system
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach(callback => callback(data));
  }

  // Message operations
  async sendMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'status'>): Promise<ChatMessage> {
    const stopTimer = PerformanceMonitor.startTimer('sendMessage');
    
    try {
      const fullMessage: ChatMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        status: 'sending'
      };

      // Analyze message
      const analysis = analyzeMessage(fullMessage);
      fullMessage.sentiment = analysis.sentiment;

      // Compress if needed
      const compressedMessage = compressMessage(fullMessage);

      // Cache the message
      this.cache.set(`message-${fullMessage.id}`, compressedMessage);

      // Emit event
      this.emit('messageSent', { conversationId, message: compressedMessage });

      // Simulate sending
      setTimeout(() => {
        compressedMessage.status = 'sent';
        this.emit('messageStatusUpdate', { messageId: fullMessage.id, status: 'sent' });
        
        setTimeout(() => {
          compressedMessage.status = 'delivered';
          this.emit('messageStatusUpdate', { messageId: fullMessage.id, status: 'delivered' });
        }, 1000);
      }, 500);

      return compressedMessage;
    } finally {
      stopTimer();
    }
  }

  async editMessage(messageId: string, newContent: string): Promise<void> {
    const cachedMessage = this.cache.get(`message-${messageId}`);
    if (cachedMessage) {
      cachedMessage.content = newContent;
      cachedMessage.edited = true;
      cachedMessage.editedAt = new Date().toISOString();
      this.cache.set(`message-${messageId}`, cachedMessage);
      this.emit('messageEdited', { messageId, newContent });
    }
  }

  async deleteMessage(messageId: string, permanent: boolean = false): Promise<void> {
    if (permanent) {
      this.cache.set(`message-${messageId}`, null);
      this.emit('messageDeleted', { messageId, permanent: true });
    } else {
      const cachedMessage = this.cache.get(`message-${messageId}`);
      if (cachedMessage) {
        cachedMessage.isDeleted = true;
        cachedMessage.deletedAt = new Date().toISOString();
        this.cache.set(`message-${messageId}`, cachedMessage);
        this.emit('messageDeleted', { messageId, permanent: false });
      }
    }
  }

  async forwardMessage(messageId: string, targetConversationId: string): Promise<ChatMessage> {
    const originalMessage = this.cache.get(`message-${messageId}`);
    if (!originalMessage) throw new Error('Message not found');

    return this.sendMessage(targetConversationId, {
      ...originalMessage,
      forwardedFrom: messageId,
      content: `Forwarded message: ${originalMessage.content}`
    });
  }

  async scheduleMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp' | 'status'>, sendAt: Date): Promise<string> {
    const scheduledMessage: ChatMessage = {
      ...message,
      id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      status: 'sending',
      scheduledFor: sendAt.toISOString()
    };

    // Store scheduled message
    this.cache.set(`scheduled-${scheduledMessage.id}`, { conversationId, message: scheduledMessage, sendAt });

    // Set timer for sending
    const delay = sendAt.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(async () => {
        await this.sendMessage(conversationId, message);
        this.cache.set(`scheduled-${scheduledMessage.id}`, null);
        this.emit('scheduledMessageSent', { messageId: scheduledMessage.id });
      }, delay);
    }

    return scheduledMessage.id;
  }

  // Conversation operations
  async pinConversation(conversationId: string): Promise<void> {
    this.emit('conversationPinned', { conversationId, pinned: true, pinnedAt: new Date().toISOString() });
  }

  async unpinConversation(conversationId: string): Promise<void> {
    this.emit('conversationPinned', { conversationId, pinned: false });
  }

  async archiveConversation(conversationId: string): Promise<void> {
    this.emit('conversationArchived', { conversationId, archived: true, archivedAt: new Date().toISOString() });
  }

  async unarchiveConversation(conversationId: string): Promise<void> {
    this.emit('conversationArchived', { conversationId, archived: false });
  }

  async muteConversation(conversationId: string, until?: Date): Promise<void> {
    this.emit('conversationMuted', { conversationId, muted: true, mutedUntil: until?.toISOString() });
  }

  async unmuteConversation(conversationId: string): Promise<void> {
    this.emit('conversationMuted', { conversationId, muted: false });
  }

  // Search operations
  async searchMessages(query: string, conversationId?: string): Promise<ChatMessage[]> {
    const stopTimer = PerformanceMonitor.startTimer('searchMessages');
    
    try {
      // In a real app, this would query a backend service
      const results: ChatMessage[] = [];
      
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.emit('searchCompleted', { query, results, conversationId });
      return results;
    } finally {
      stopTimer();
    }
  }

  // File operations
  async uploadFile(file: File, conversationId: string): Promise<string> {
    const stopTimer = PerformanceMonitor.startTimer('uploadFile');
    
    try {
      // Simulate file upload
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const url = URL.createObjectURL(file);
      
      this.cache.set(`file-${fileId}`, {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url,
        uploadedAt: new Date().toISOString()
      });

      this.emit('fileUploaded', { fileId, conversationId, url });
      return url;
    } finally {
      stopTimer();
    }
  }

  // Voice operations
  async recordVoice(): Promise<MediaRecorder | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      this.emit('voiceRecordingStarted', { recorder });
      return recorder;
    } catch (error) {
      this.emit('voiceRecordingError', { error });
      return null;
    }
  }

  async stopVoiceRecording(recorder: MediaRecorder): Promise<Blob> {
    return new Promise((resolve) => {
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        this.emit('voiceRecordingStopped', { audioBlob });
        resolve(audioBlob);
      };
      
      recorder.stop();
      recorder.stream.getTracks().forEach(track => track.stop());
    });
  }

  // Screen sharing
  async startScreenShare(): Promise<MediaStream | null> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true, 
        audio: true 
      });
      this.emit('screenShareStarted', { stream });
      return stream;
    } catch (error) {
      this.emit('screenShareError', { error });
      return null;
    }
  }

  async stopScreenShare(stream: MediaStream): Promise<void> {
    stream.getTracks().forEach(track => track.stop());
    this.emit('screenShareStopped', {});
  }

  // Analytics
  async getAnalytics(conversationId?: string): Promise<ChatAnalytics> {
    const stopTimer = PerformanceMonitor.startTimer('getAnalytics');
    
    try {
      // Simulate analytics calculation
      const analytics: ChatAnalytics = {
        totalMessages: 0,
        totalConversations: 0,
        avgResponseTime: 0,
        messagesByType: {},
        activeHours: {},
        sentiment: { positive: 0, negative: 0, neutral: 0 },
        topContacts: []
      };

      this.emit('analyticsGenerated', { analytics, conversationId });
      return analytics;
    } finally {
      stopTimer();
    }
  }

  // Backup operations
  async backupConversation(conversationId: string): Promise<string> {
    // In a real app, this would create a backup on the server
    const backupId = `backup-${Date.now()}-${conversationId}`;
    this.emit('conversationBackedUp', { conversationId, backupId });
    return backupId;
  }

  async restoreConversation(backupId: string): Promise<void> {
    this.emit('conversationRestored', { backupId });
  }

  // Language operations
  async translateMessage(messageId: string, targetLanguage: string): Promise<string> {
    // In a real app, use a translation service
    const message = this.cache.get(`message-${messageId}`);
    if (!message) return '';
    
    // Simulate translation
    const translated = `[${targetLanguage.toUpperCase()}] ${message.content}`;
    
    if (!message.translation) {
      message.translation = {};
    }
    message.translation[targetLanguage] = translated;
    
    this.cache.set(`message-${messageId}`, message);
    this.emit('messageTranslated', { messageId, targetLanguage, translated });
    
    return translated;
  }

  // Preferences
  async updatePreferences(preferences: Partial<ChatPreferences>): Promise<void> {
    this.cache.set('preferences', preferences);
    this.emit('preferencesUpdated', { preferences });
  }

  async getPreferences(): Promise<ChatPreferences> {
    const cached = this.cache.get('preferences');
    if (cached) return cached;

    // Default preferences
    const defaultPrefs: ChatPreferences = {
      notifications: {
        enabled: true,
        sound: 'default',
        quietHours: { start: '22:00', end: '08:00' },
        priority: true,
        desktop: true,
        email: false
      },
      accessibility: {
        highContrast: false,
        fontSize: 'medium',
        screenReader: false,
        keyboardShortcuts: true,
        colorBlindFriendly: false
      },
      privacy: {
        readReceipts: true,
        typingIndicators: true,
        onlineStatus: true,
        encryptionEnabled: false
      },
      performance: {
        messageCaching: true,
        imageCompression: true,
        lazyLoading: true,
        offlineSupport: true
      },
      language: {
        primary: 'en',
        autoTranslate: false,
        autoDetect: false
      }
    };

    this.cache.set('preferences', defaultPrefs);
    return defaultPrefs;
  }

  // Performance metrics
  getPerformanceMetrics() {
    return PerformanceMonitor.getAllMetrics();
  }

  // Cleanup
  cleanup(): void {
    this.cache.clear();
    this.eventListeners.clear();
  }
}

export default ChatService;
