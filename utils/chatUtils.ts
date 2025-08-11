import type { ChatMessage, ChatConversation, ChatPreferences } from '../types';

// Encryption utilities (simplified for demo)
export const encryptMessage = (content: string, key: string = 'demo-key'): string => {
  // In a real app, use proper encryption like AES
  return btoa(content);
};

export const decryptMessage = (encryptedContent: string, key: string = 'demo-key'): string => {
  try {
    return atob(encryptedContent);
  } catch {
    return encryptedContent;
  }
};

// Message compression
export const compressMessage = (message: ChatMessage): ChatMessage => {
  const compressed = { ...message };
  
  // Compress file data if needed
  if (compressed.fileData && compressed.fileData.size > 1024 * 1024) { // > 1MB
    compressed.fileData.compressed = true;
  }
  
  return compressed;
};

// Cache management
export class ChatCache {
  private static instance: ChatCache;
  private cache = new Map<string, any>();
  private maxSize = 1000;

  static getInstance(): ChatCache {
    if (!ChatCache.instance) {
      ChatCache.instance = new ChatCache();
    }
    return ChatCache.instance;
  }

  set(key: string, value: any): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string): any {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if expired (1 hour)
    if (Date.now() - item.timestamp > 3600000) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Message analytics
export const analyzeMessage = (message: ChatMessage): { sentiment: 'positive' | 'negative' | 'neutral'; keywords: string[] } => {
  const content = message.content.toLowerCase();
  
  // Simple sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'love', 'like', 'happy', 'pleased'];
  const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed'];
  
  const positiveCount = positiveWords.filter(word => content.includes(word)).length;
  const negativeCount = negativeWords.filter(word => content.includes(word)).length;
  
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (positiveCount > negativeCount) sentiment = 'positive';
  else if (negativeCount > positiveCount) sentiment = 'negative';
  
  // Extract keywords (simple approach)
  const words = content.split(/\s+/).filter(word => word.length > 3);
  const keywords = [...new Set(words)].slice(0, 5);
  
  return { sentiment, keywords };
};

// Language detection (simplified)
export const detectLanguage = (text: string): string => {
  // In a real app, use a proper language detection library
  const patterns = {
    es: /\b(el|la|de|que|y|un|es|se|no|te|lo|le|da|su|por|son|con|para|al|una|sur|sus|les|me|todo|pero|más|hay|muy|han|puede|sus|tiempo|hace|cada|vez|dos|años|gobierno|estado|país|nacional|desarrollo|parte|sistema|vida|trabajo|mundo|familia|programa|día|casa|lugar|área|forma|proceso|manera|grupo|tanto|empresa|hacer|nivel|tipo|cualquier|cambio|servicio|acción|centro|base|política|nueva|mayor|general|local|hombre|mujer|momento)\b/gi,
    fr: /\b(le|de|et|à|un|il|être|et|en|avoir|que|pour|dans|ce|son|une|sur|avec|ne|se|pas|tout|mais|par|plus|dire|me|bien|ou|y|aller|lui|deux|voir|grand|si|te|vous|faire|comme|là|nous|je|là|temps|très|où|déjà|depuis|encore|même|ici|alors|maintenant|toujours|pourquoi|comment|autres|chaque|quelque|chose|gens|vie|jour|moment|après|avant|puis|parce|entre|peut|sans|sous|contre|tous|aussi|beaucoup|autre|pendant|leur|ces|ceux|celle|celui|cette|celles)\b/gi
  };
  
  let maxMatches = 0;
  let detectedLang = 'en';
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern) || [];
    if (matches.length > maxMatches) {
      maxMatches = matches.length;
      detectedLang = lang;
    }
  }
  
  return detectedLang;
};

// Message scheduling
export const scheduleMessage = (message: ChatMessage, sendAt: Date): void => {
  const delay = sendAt.getTime() - Date.now();
  
  if (delay > 0) {
    setTimeout(() => {
      // In a real app, this would send the message through the chat service
      console.log('Sending scheduled message:', message);
    }, delay);
  }
};

// Backup utilities
export const exportConversation = (conversation: ChatConversation, messages: ChatMessage[]): string => {
  const data = {
    conversation,
    messages: messages.filter(msg => !msg.isDeleted),
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  
  return JSON.stringify(data, null, 2);
};

export const importConversation = (data: string): { conversation: ChatConversation; messages: ChatMessage[] } | null => {
  try {
    const parsed = JSON.parse(data);
    return {
      conversation: parsed.conversation,
      messages: parsed.messages
    };
  } catch {
    return null;
  }
};

// Keyboard shortcuts
export const chatKeyboardShortcuts = {
  'ctrl+enter': 'Send message',
  'ctrl+b': 'Bold text',
  'ctrl+i': 'Italic text',
  'ctrl+k': 'Insert link',
  'ctrl+f': 'Search messages',
  'ctrl+r': 'Reply to message',
  'esc': 'Cancel reply/edit',
  'ctrl+d': 'Delete message',
  'ctrl+e': 'Edit message',
  'ctrl+shift+p': 'Pin conversation',
  'ctrl+shift+a': 'Archive conversation',
  'ctrl+shift+m': 'Mute conversation',
  'up': 'Navigate up in conversation list',
  'down': 'Navigate down in conversation list',
  'enter': 'Open selected conversation'
};

// Message templates
export const defaultTemplates = [
  {
    name: 'Meeting Reminder',
    content: 'Hi! Just a reminder about our meeting scheduled for {time}. See you there!',
    shortcut: '/meeting'
  },
  {
    name: 'Thank You',
    content: 'Thank you for your message. I\'ll get back to you shortly.',
    shortcut: '/thanks'
  },
  {
    name: 'Schedule Request',
    content: 'Could we schedule a time to discuss this? I\'m available {availability}.',
    shortcut: '/schedule'
  },
  {
    name: 'Follow Up',
    content: 'Following up on our previous conversation about {topic}.',
    shortcut: '/followup'
  }
];

// Auto-responses
export const processAutoResponse = (message: ChatMessage, autoResponses: Array<{trigger: string; response: string; enabled: boolean}>): string | null => {
  const content = message.content.toLowerCase();
  
  for (const autoResponse of autoResponses) {
    if (autoResponse.enabled && content.includes(autoResponse.trigger.toLowerCase())) {
      return autoResponse.response;
    }
  }
  
  return null;
};

// File validation
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }
  
  return { valid: true };
};

// Image/Video editing utilities
export const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

// Voice transcription (simplified)
export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  // In a real app, use Web Speech API or external service
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('Transcription not available in demo');
    }, 1000);
  });
};

// Performance monitoring
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  
  static startTimer(operation: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      const existing = this.metrics.get(operation) || [];
      existing.push(duration);
      
      // Keep only last 100 measurements
      if (existing.length > 100) {
        existing.shift();
      }
      
      this.metrics.set(operation, existing);
    };
  }
  
  static getAverageTime(operation: string): number {
    const times = this.metrics.get(operation) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }
  
  static getAllMetrics(): { [operation: string]: { avg: number; count: number } } {
    const result: { [key: string]: { avg: number; count: number } } = {};
    
    for (const [operation, times] of this.metrics.entries()) {
      result[operation] = {
        avg: times.reduce((a, b) => a + b, 0) / times.length,
        count: times.length
      };
    }
    
    return result;
  }
}
