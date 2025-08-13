import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useChat } from '../hooks/useChat';
import type { ChatMessage, MessageReaction } from '../types';
import toast from 'react-hot-toast';
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Image, 
  File, 
  FileText,
  FileSpreadsheet,
  Smile, 
  Search,
  Pin,
  Trash2,
  Edit3,
  Forward,
  Reply,
  Volume2,
  Settings,
  Shield,
  Eye,
  Calendar,
  Download,
  Upload,
  Zap,
  Heart,
  ThumbsUp,
  Laugh,
  Angry,
  Frown,
  X,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
  Phone,
  Info,
  Users,
  MessageSquare,
  PhoneOff,
  Bell
} from 'lucide-react';

interface EnhancedChatProps {
  conversationId?: string;
  onConversationSelect?: (id: string) => void;
  className?: string;
}

const REACTIONS = [
  { emoji: '👍', icon: ThumbsUp, label: 'Like' },
  { emoji: '❤️', icon: Heart, label: 'Love' },
  { emoji: '😂', icon: Laugh, label: 'Laugh' },
  { emoji: '😮', icon: AlertCircle, label: 'Wow' },
  { emoji: '😢', icon: Frown, label: 'Sad' },
  { emoji: '😡', icon: Angry, label: 'Angry' }
];

const MESSAGE_TEMPLATES = [
  {
    name: 'Thank You',
    content: 'Thanks for the information!',
    category: 'courtesy',
    shortcut: '/thanks'
  },
  {
    name: 'Clarification Request',
    content: 'Could you please clarify this for me?',
    category: 'inquiry',
    shortcut: '/clarify'
  },
  {
    name: 'Follow Up',
    content: 'I\'ll get back to you shortly with more details.',
    category: 'response',
    shortcut: '/followup'
  },
  {
    name: 'Meeting Scheduled',
    content: 'Meeting scheduled for tomorrow at {time}. Looking forward to it!',
    category: 'scheduling',
    shortcut: '/meeting'
  },
  {
    name: 'File Attachment',
    content: 'Please find the attached file for your review.',
    category: 'files',
    shortcut: '/attach'
  },
  {
    name: 'Assistance Offer',
    content: 'Let me know if you need any help with this.',
    category: 'support',
    shortcut: '/help'
  },
  {
    name: 'Payment Reminder',
    content: 'Friendly reminder: Your payment is due on {date}.',
    category: 'billing',
    shortcut: '/payment'
  },
  {
    name: 'Class Reminder',
    content: 'Your lesson is scheduled for {time} today. See you then!',
    category: 'lessons',
    shortcut: '/lesson'
  }
];

// Mock conversation history for demonstration
const MOCK_CONVERSATION_HISTORY = [
  {
    id: 'msg-001',
    senderId: 'ai-assistant',
    senderName: 'AI Assistant',
    senderType: 'instructor' as const,
    content: 'Hello! I\'m here to help you with any questions about student management.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    readBy: ['current-user'],
    type: 'text' as const,
    status: 'read' as const
  },
  {
    id: 'msg-002',
    senderId: 'current-user',
    senderName: 'Admin User',
    senderType: 'admin' as const,
    content: 'Can you help me understand the billing system?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 5).toISOString(),
    readBy: ['ai-assistant'],
    type: 'text' as const,
    status: 'read' as const
  },
  {
    id: 'msg-003',
    senderId: 'ai-assistant',
    senderName: 'AI Assistant',
    senderType: 'instructor' as const,
    content: 'Of course! The billing system tracks payments for each student. You can view outstanding balances, generate invoices, and record payments.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60 * 6).toISOString(),
    readBy: ['current-user'],
    type: 'text' as const,
    status: 'read' as const
  },
  {
    id: 'msg-004',
    senderId: 'ai-assistant',
    senderName: 'AI Assistant',
    senderType: 'instructor' as const,
    content: 'billing-demo.pdf',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    readBy: ['current-user'],
    type: 'file' as const,
    status: 'read' as const,
    fileData: {
      name: 'billing-demo.pdf',
      size: 156789,
      type: 'application/pdf',
      url: '#'
    }
  },
  {
    id: 'msg-005',
    senderId: 'current-user',
    senderName: 'Admin User',
    senderType: 'admin' as const,
    content: 'Perfect! This is very helpful.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    readBy: ['ai-assistant'],
    type: 'text' as const,
    status: 'read' as const,
    reactions: [
      { userId: 'ai-assistant', userName: 'AI Assistant', emoji: '👍', timestamp: new Date().toISOString() }
    ]
  }
];

// File sharing examples
const FILE_SHARING_EXAMPLES = [
  {
    id: 'file-001',
    name: 'Student_Progress_Report.pdf',
    type: 'application/pdf',
    size: 245760,
    url: '#',
    icon: FileText,
    preview: 'Monthly progress report for all students'
  },
  {
    id: 'file-002',
    name: 'Lesson_Schedule.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 89123,
    url: '#',
    icon: FileSpreadsheet,
    preview: 'Weekly lesson schedule spreadsheet'
  },
  {
    id: 'file-003',
    name: 'Student_Photo.jpg',
    type: 'image/jpeg',
    size: 567890,
    url: 'https://via.placeholder.com/300x200/e5e7eb/6b7280?text=Student+Photo',
    icon: Image,
    preview: 'Student identification photo'
  },
  {
    id: 'file-004',
    name: 'Payment_Instructions.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 34567,
    url: '#',
    icon: FileText,
    preview: 'Step-by-step payment process guide'
  }
];

export const EnhancedChat: React.FC<EnhancedChatProps> = ({
  conversationId = 'default',
  onConversationSelect: _onConversationSelect,
  className = ''
}) => {
  const { theme, setThemeMode } = useApp();
  const chat = useChat(conversationId);
  
  // UI State
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Merge mock conversation history with live chat messages for demonstration
  const allMessages = React.useMemo(() => {
    // In a real app, this would come from the backend
    const combinedMessages = [...MOCK_CONVERSATION_HISTORY, ...chat.messages];
    
    // Filter messages based on search query
    if (searchQuery.trim()) {
      return combinedMessages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return combinedMessages;
  }, [chat.messages, searchQuery]);
  
  // Search results analytics
  const searchStats = React.useMemo(() => {
    if (!searchQuery.trim()) return null;
    
    const totalResults = allMessages.length;
    const messageTypes = allMessages.reduce((acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { totalResults, messageTypes };
  }, [allMessages, searchQuery]);
  
  // Call functionality
  const [isOnCall, setIsOnCall] = useState(false);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // Settings state
  const [settings, setSettings] = useState({
    accessibility: {
      highContrast: false,
      largeText: false,
      keyboardShortcuts: true
    },
    notifications: {
      desktop: true,
      sound: true,
      mentions: true,
      reactions: true
    },
    privacy: {
      readReceipts: true,
      typingIndicators: true,
      encryption: false,
      onlineStatus: true
    }
  });
  
  // Static data for conversation info
  const conversationInfo = {
    id: conversationId,
    title: 'AI Assistant',
    participants: [
      {
        id: 'ai-assistant',
        name: 'AI Assistant',
        role: 'Assistant',
        status: 'online',
        avatar: null,
        email: 'ai@ghsm.edu',
        phone: '+63 917 123 4567',
        lastSeen: new Date().toISOString(),
        isTyping: chat.isTyping
      },
      {
        id: 'current-user',
        name: 'Admin User',
        role: 'Administrator',
        status: 'online',
        avatar: null,
        email: 'admin@ghsm.edu',
        phone: '+63 917 987 6543',
        lastSeen: new Date().toISOString(),
        isTyping: false
      }
    ],
    analytics: {
      totalMessages: chat.messages?.length || 0,
      messagesSentToday: 12,
      averageResponseTime: '2 minutes',
      lastActiveTime: new Date().toISOString(),
      commonTopics: ['Schedule', 'Billing', 'Student Progress'],
      messageTypes: {
        text: 85,
        voice: 10,
        files: 5
      }
    },
    settings: {
      notifications: true,
      autoResponses: false,
      messageRetention: '30 days',
      encryption: false
    }
  };

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Call functionality
  const startCall = useCallback((video: boolean = false) => {
    setIsOnCall(true);
    setIsVideoCall(video);
    setCallDuration(0);
    
    // Start call timer
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    // Show toast notification for future feature
    toast.success(
      `${video ? 'Video' : 'Voice'} call feature will be available in future updates!`,
      { 
        duration: 3000,
        icon: video ? '📹' : '📞' 
      }
    );
  }, []);

  const endCall = useCallback(() => {
    setIsOnCall(false);
    setIsVideoCall(false);
    setCallDuration(0);
    
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    // Call ended
  }, []);

  // Settings handlers
  const updateSettings = useCallback((section: string, key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
    
    // In a real app, this would sync with backend - Updated settings
  }, []);

  // Search functionality
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setShowSearchResults(query.length > 0);
  }, []);

  // Enhanced search with results clearing
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSearchResults(false);
  }, []);

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Message handlers
  const handleSendMessage = useCallback(async () => {
    if (!message.trim() && !replyToMessage) return;

    let content = message.trim();
    if (replyToMessage) {
      content = `@${replyToMessage.senderName}: ${content}`;
    }

    if (showScheduler && scheduledDate && scheduledTime) {
      const sendAt = new Date(`${scheduledDate}T${scheduledTime}`);
      await chat.scheduleMessage(content, sendAt);
      setShowScheduler(false);
      setScheduledDate('');
      setScheduledTime('');
    } else {
      await chat.sendMessage(content);
    }

    setMessage('');
    setReplyToMessage(null);
    messageInputRef.current?.focus();
  }, [message, replyToMessage, showScheduler, scheduledDate, scheduledTime, chat]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            handleSendMessage();
            break;
          case 'e':
            event.preventDefault();
            setShowEmojiPicker(!showEmojiPicker);
            break;
          case 'f':
            event.preventDefault();
            // Focus search
            break;
          case 'a':
            event.preventDefault();
            chat.selectAllMessages();
            break;
          case 'Escape':
            event.preventDefault();
            chat.clearSelection();
            setEditingMessageId(null);
            setReplyToMessage(null);
            break;
        }
      }
    };

    if (messageInputRef.current) {
      const currentRef = messageInputRef.current;
      currentRef.addEventListener('keydown', handleKeyDown);
      return () => currentRef.removeEventListener('keydown', handleKeyDown);
    }
    return () => {}; // Return empty cleanup function when ref is not available
  }, [showEmojiPicker, chat, handleSendMessage]);

  const handleEditMessage = useCallback(async (messageId: string) => {
    if (!editingContent.trim()) return;
    
    await chat.editMessage(messageId, editingContent);
    setEditingMessageId(null);
    setEditingContent('');
  }, [editingContent, chat]);

  const handleDeleteMessage = useCallback(async (messageId: string, permanent: boolean = false) => {
    await chat.deleteMessage(messageId, permanent);
  }, [chat]);

  const handleFileUpload = useCallback(async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      await chat.uploadFile(files[i]);
    }
  }, [chat]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Message status icon
  const getStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-text-tertiary dark:text-slate-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-text-tertiary dark:text-slate-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-text-tertiary dark:text-slate-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      default:
        return null;
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get current conversation messages
  const _currentConversation = chat.conversations.find(conv => conv.id === conversationId);
  const _messages = chat.messages || [];

  return (
    <div className={`flex flex-col h-full bg-surface-main dark:bg-slate-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-border dark:border-slate-700 bg-surface-header dark:bg-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-semibold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">
              AI Assistant
            </h3>
            <p className="text-xs text-text-secondary">
              {chat.isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Search */}
          <button
            onClick={() => {
              const query = prompt('Search messages:');
              if (query) handleSearch(query);
            }}
            className="p-2 rounded-lg hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
            title="Search messages"
          >
            <Search className="w-4 h-4 text-text-tertiary dark:text-slate-400" />
          </button>

          {/* Voice call */}
          <button
            onClick={() => startCall(false)}
            disabled={isOnCall}
            className={`p-2 rounded-lg transition-colors ${
              isOnCall && !isVideoCall
                ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                : 'hover:bg-surface-hover dark:hover:bg-slate-700 text-text-tertiary dark:text-slate-400'
            }`}
            title="Start voice call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video call */}
          <button
            onClick={() => startCall(true)}
            disabled={isOnCall}
            className={`p-2 rounded-lg transition-colors ${
              isVideoCall
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                : chat.isScreenSharing 
                ? 'bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-400'
                : 'hover:bg-surface-hover dark:hover:bg-slate-700 text-text-tertiary dark:text-slate-400'
            }`}
            title={chat.isScreenSharing ? 'Stop screen sharing' : 'Start video call'}
          >
            {chat.isScreenSharing ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>

          {/* Info panel */}
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`p-2 rounded-lg transition-colors ${
              showInfoPanel 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                : 'hover:bg-surface-hover dark:hover:bg-slate-700 text-text-tertiary dark:text-slate-400'
            }`}
            title="Chat information"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                : 'hover:bg-surface-hover dark:hover:bg-slate-700 text-text-tertiary dark:text-slate-400'
            }`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Call Status */}
      {isOnCall && (
        <div className="px-4 py-2 bg-green-100 dark:bg-green-900/20 border-b border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isVideoCall ? <Video className="w-4 h-4 text-green-600 dark:text-green-400" /> : <Phone className="w-4 h-4 text-green-600 dark:text-green-400" />}
              <span className="text-sm text-green-700 dark:text-green-300">
                {isVideoCall ? 'Video call' : 'Voice call'} • {formatCallDuration(callDuration)}
              </span>
            </div>
            <button
              onClick={endCall}
              className="p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              title="End call"
            >
              <PhoneOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Results Banner */}
      {showSearchResults && (
        <div className="px-4 py-3 bg-blue-100 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <div>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Searching for "{searchQuery}"
                </span>
                {searchStats && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {searchStats.totalResults} result{searchStats.totalResults !== 1 ? 's' : ''} found
                    {searchStats.totalResults > 0 && (
                      <span className="ml-2">
                        (Text: {searchStats.messageTypes.text || 0}, 
                        Files: {searchStats.messageTypes.file || 0}, 
                        Voice: {searchStats.messageTypes.voice || 0})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded"
              title="Clear search"
            >
              <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto scrollbar-hidden p-4 space-y-4 ${
          dragOver ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-600' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="flex items-center justify-center h-32 text-blue-600 dark:text-blue-400">
            <div className="text-center">
              <Upload className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-medium">Drop files here to upload</p>
            </div>
          </div>
        )}

        {allMessages.map((msg: ChatMessage) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative group ${
                msg.senderType === 'admin'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 comfort:bg-stone-100 text-text-primary dark:text-slate-100 comfort:text-text-primary border border-gray-300 dark:border-slate-600 comfort:border-stone-300'
              } ${
                chat.selectedMessages.includes(msg.id)
                  ? 'ring-2 ring-blue-400 dark:ring-blue-500'
                  : ''
              } ${
                msg.isDeleted
                  ? 'opacity-50 italic'
                  : ''
              }`}
              onClick={() => chat.selectMessage(msg.id)}
            >
              {/* Reply indicator */}
              {msg.replyTo && (
                <div className={`text-xs mb-2 p-2 rounded-lg ${
                  msg.senderType === 'admin'
                    ? 'bg-blue-400/30'
                    : 'bg-surface-300 dark:bg-surface-600'
                }`}>
                  <Reply className="w-3 h-3 inline mr-1" />
                  Replying to message
                </div>
              )}

              {/* Editing mode */}
              {editingMessageId === msg.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="w-full p-2 rounded bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 text-sm"
                    rows={2}
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditMessage(msg.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingMessageId(null);
                        setEditingContent('');
                      }}
                      className="px-3 py-1 bg-surface-500 text-white rounded text-xs hover:bg-surface-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Message content */}
                  <div className="text-sm">
                    {msg.isDeleted ? (
                      <span className="italic">This message was deleted</span>
                    ) : (
                      <>
                        {msg.content}
                        {msg.edited && (
                          <span className="ml-2 text-xs opacity-75">(edited)</span>
                        )}
                      </>
                    )}
                  </div>

                  {/* File attachment */}
                  {msg.type === 'file' && msg.fileData && (
                    <div className="mt-2 p-3 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {msg.fileData.type.startsWith('image/') ? (
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                              <Image className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                          ) : msg.fileData.type.includes('pdf') ? (
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                          ) : msg.fileData.type.includes('sheet') || msg.fileData.name.endsWith('.xlsx') || msg.fileData.name.endsWith('.csv') ? (
                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                              <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                              <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-surface-900 dark:text-surface-100 truncate">
                            {msg.fileData.name}
                          </div>
                          <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                            {(msg.fileData.size / 1024).toFixed(1)} KB
                            {msg.fileData.type.startsWith('image/') && (
                              <span className="ml-2">• Image</span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {msg.fileData.type.startsWith('image/') && msg.fileData.url !== '#' && (
                            <button
                              onClick={() => window.open(msg.fileData!.url, '_blank')}
                              className="p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
                              title="Preview image"
                            >
                              <Eye className="w-4 h-4 text-surface-600 dark:text-surface-400" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // In a real app, this would handle file download
                              // Downloading file: ${msg.fileData!.name}
                            }}
                            className="p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-lg transition-colors"
                            title="Download file"
                          >
                            <Download className="w-4 h-4 text-surface-600 dark:text-surface-400" />
                          </button>
                        </div>
                      </div>
                      {/* Image preview for image files */}
                      {msg.fileData.type.startsWith('image/') && msg.fileData.url !== '#' && (
                        <div className="mt-3">
                          <img
                            src={msg.fileData.url}
                            alt={msg.fileData.name}
                            className="max-w-full h-auto rounded-lg border border-surface-200 dark:border-surface-700"
                            style={{ maxHeight: '200px' }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Voice message */}
                  {msg.type === 'voice' && msg.voiceData && (
                    <div className="mt-2 flex items-center space-x-2">
                      <button className="p-1 rounded-full bg-surface-100 dark:bg-surface-800">
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <div className="flex-1 h-1 bg-surface-300 dark:bg-surface-600 rounded-full">
                        <div className="h-full w-1/3 bg-blue-400 rounded-full"></div>
                      </div>
                      <span className="text-xs">{msg.voiceData.duration}s</span>
                    </div>
                  )}

                  {/* Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {msg.reactions.map((reaction: MessageReaction, index: number) => (
                        <span
                          key={index}
                          className="text-xs bg-surface-100 dark:bg-surface-800 rounded-full px-2 py-1"
                        >
                          {reaction.emoji} {reaction.userId === 'user' ? 'You' : reaction.userName}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Message timestamp and status */}
              <div className={`flex items-center justify-between mt-2 text-xs ${
                msg.senderType === 'admin' ? 'text-blue-200 dark:text-blue-300' : 'text-surface-600 dark:text-surface-300'
              }`}>
                <span>{formatTime(msg.timestamp)}</span>
                <div className="flex items-center space-x-1">
                  {msg.pinned && <Pin className="w-3 h-3" />}
                  {msg.encrypted && <Shield className="w-3 h-3" />}
                  {msg.senderType === 'admin' && getStatusIcon(msg.status)}
                </div>
              </div>

              {/* Message actions (shown on hover) */}
              <div className="absolute -top-2 -right-2 bg-surface-100 dark:bg-surface-800 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity p-1 flex space-x-1">
                <button
                  onClick={() => setReplyToMessage(msg)}
                  className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded"
                  title="Reply"
                >
                  <Reply className="w-3 h-3" />
                </button>
                
                <button
                  onClick={() => setShowReactions(showReactions === msg.id ? null : msg.id)}
                  className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded"
                  title="React"
                >
                  <Smile className="w-3 h-3" />
                </button>

                {msg.senderType === 'admin' && (
                  <button
                    onClick={() => {
                      setEditingMessageId(msg.id);
                      setEditingContent(msg.content);
                    }}
                    className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded"
                    title="Edit"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}

                <button
                  onClick={() => chat.forwardMessage(msg.id, 'other-conversation')}
                  className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded"
                  title="Forward"
                >
                  <Forward className="w-3 h-3" />
                </button>

                <button
                  onClick={() => handleDeleteMessage(msg.id)}
                  className="p-1 hover:bg-red-200 dark:hover:bg-red-800 text-red-600 dark:text-red-400 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>

              {/* Reaction picker */}
              {showReactions === msg.id && (
                <div className="absolute top-full left-0 mt-2 bg-surface-100 dark:bg-surface-800 rounded-lg shadow-lg p-2 flex space-x-2 z-10">
                  {REACTIONS.map((reaction) => (
                    <button
                      key={reaction.emoji}
                      className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded"
                      title={reaction.label}
                    >
                      <reaction.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyToMessage && (
        <div className="px-4 py-2 bg-surface-100 dark:bg-surface-800 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                Replying to {replyToMessage.senderName}
              </span>
              <p className="text-surface-600 dark:text-surface-400 truncate">
                {replyToMessage.content}
              </p>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Selected Messages Actions */}
      {chat.selectedMessages.length > 0 && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {chat.selectedMessages.length} message(s) selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  chat.selectedMessages.forEach(id => chat.forwardMessage(id, 'other-conversation'));
                  chat.clearSelection();
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Forward
              </button>
              <button
                onClick={() => {
                  chat.selectedMessages.forEach(id => handleDeleteMessage(id));
                  chat.clearSelection();
                }}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={chat.clearSelection}
                className="px-3 py-1 bg-surface-500 text-white rounded text-sm hover:bg-surface-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input Area */}
      <div className="p-4 border-t border-surface-border bg-surface-header">
        {/* Scheduler */}
        {showScheduler && (
          <div className="mb-3 p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-surface-600 dark:text-surface-400" />
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="px-2 py-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 text-sm"
              />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="px-2 py-1 rounded bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-100 text-sm"
              />
              <button
                onClick={() => setShowScheduler(false)}
                className="p-1 hover:bg-surface-300 dark:hover:bg-surface-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Templates */}
        {showTemplates && (
          <div className="mb-3 p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-surface-900 dark:text-surface-100 mb-2">Message Templates</h4>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {MESSAGE_TEMPLATES.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setMessage(template.content);
                      setShowTemplates(false);
                      messageInputRef.current?.focus();
                    }}
                    className="p-3 text-left bg-surface-100 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-600 rounded transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-surface-900 dark:text-surface-100">{template.name}</div>
                        <div className="text-xs text-surface-600 dark:text-surface-400 mt-1">{template.content}</div>
                      </div>
                      <span className="text-xs bg-surface-200 dark:bg-surface-700 px-2 py-1 rounded text-surface-500 dark:text-surface-500">
                        {template.shortcut}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* File Sharing Demo Section */}
        <div className="mb-4 p-4 bg-surface-100 dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700">
          <h4 className="text-sm font-medium text-surface-900 dark:text-surface-100 mb-3 flex items-center">
            <File className="w-4 h-4 mr-2" />
            File Sharing Examples
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {FILE_SHARING_EXAMPLES.map((file) => {
              const IconComponent = file.icon;
              return (
                <div
                  key={file.id}
                  className="p-3 bg-surface-50 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors cursor-pointer"
                  onClick={() => {
                    // Simulate sharing this file
                    const fileMessage = `📎 ${file.name}`;
                    setMessage(fileMessage);
                    // Sharing file: ${file.name}
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-surface-900 dark:text-surface-100 truncate">
                        {file.name}
                      </div>
                      <div className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                      <div className="text-xs text-surface-600 dark:text-surface-400 mt-1 line-clamp-2">
                        {file.preview}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-xs text-surface-500 dark:text-surface-400 text-center">
            Click any example to add it to your message
          </div>
        </div>

        <div className="flex items-end space-x-3">
          {/* Attachment button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 text-surface-600 dark:text-surface-400" />
          </button>

          {/* Voice recording */}
          <button
            onClick={chat.isRecording ? chat.stopVoiceRecording : chat.startVoiceRecording}
            className={`p-2 rounded-lg transition-colors ${
              chat.isRecording 
                ? 'bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-400'
                : 'hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
            }`}
            title={chat.isRecording ? 'Stop recording' : 'Start voice recording'}
          >
            {chat.isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Message input */}
          <div className="flex-1 relative">
            <textarea
              ref={messageInputRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                chat.setTyping(e.target.value.length > 0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="w-full px-4 py-3 pr-12 rounded-xl border border-surface-border dark:border-slate-700 bg-surface-input dark:bg-slate-800 text-text-primary dark:text-slate-100 placeholder-text-tertiary dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary resize-none max-h-32"
              rows={1}
              style={{ minHeight: '48px' }}
            />

            {/* Emoji picker button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-surface-hover dark:hover:bg-slate-700 transition-colors"
              title="Add emoji"
            >
              <Smile className="w-4 h-4 text-text-tertiary dark:text-slate-400" />
            </button>

            {/* Emoji picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full right-0 mb-2 bg-surface-card dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-lg shadow-lg p-3 grid grid-cols-8 gap-2 z-10"
              >
                {['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🎉', '🔥', '💯', '😎', '🤗', '😴', '🤝'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                      messageInputRef.current?.focus();
                    }}
                    className="p-1 hover:bg-surface-hover dark:hover:bg-slate-700 rounded text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Additional actions */}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowScheduler(!showScheduler)}
              className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              title="Schedule message"
            >
              <Calendar className="w-5 h-5 text-surface-600 dark:text-surface-400" />
            </button>

            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              title="Message templates"
            >
              <Zap className="w-5 h-5 text-surface-600 dark:text-surface-400" />
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || chat.isLoading}
            className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-surface-300 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Loading indicator */}
        {chat.isLoading && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-surface-600 dark:text-surface-400">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Sending...</span>
          </div>
        )}

        {/* Error message */}
        {chat.error && (
          <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-700 dark:text-red-300">{chat.error}</span>
              <button
                onClick={chat.clearError}
                className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded"
              >
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Panel */}
      {showInfoPanel && (
        <div className="absolute top-16 right-4 w-80 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto scrollbar-hidden">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">Chat Information</h3>
              <button
                onClick={() => setShowInfoPanel(false)}
                className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Participants */}
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Participants ({conversationInfo.participants.length})
              </h4>
              <div className="space-y-3">
                {conversationInfo.participants.map((participant) => (
                  <div key={participant.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {participant.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-100">
                          {participant.name}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${
                          participant.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      <p className="text-xs text-surface-600 dark:text-surface-400">
                        {participant.role}
                      </p>
                      <p className="text-xs text-surface-600 dark:text-surface-400">
                        {participant.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics */}
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2 flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Analytics
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Total Messages:</span>
                  <span className="font-medium text-surface-900 dark:text-surface-100">
                    {conversationInfo.analytics.totalMessages}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Messages Today:</span>
                  <span className="font-medium text-surface-900 dark:text-surface-100">
                    {conversationInfo.analytics.messagesSentToday}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-surface-600 dark:text-surface-400">Avg Response:</span>
                  <span className="font-medium text-surface-900 dark:text-surface-100">
                    {conversationInfo.analytics.averageResponseTime}
                  </span>
                </div>
              </div>

              {/* Message Types Chart */}
              <div className="mt-3">
                <span className="text-xs text-surface-600 dark:text-surface-400 mb-2 block">Message Types:</span>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${conversationInfo.analytics.messageTypes.text}%` }}
                      />
                    </div>
                    <span className="text-xs text-surface-600 dark:text-surface-400 w-12">
                      {conversationInfo.analytics.messageTypes.text}% Text
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${conversationInfo.analytics.messageTypes.voice}%` }}
                      />
                    </div>
                    <span className="text-xs text-surface-600 dark:text-surface-400 w-12">
                      {conversationInfo.analytics.messageTypes.voice}% Voice
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${conversationInfo.analytics.messageTypes.files}%` }}
                      />
                    </div>
                    <span className="text-xs text-surface-600 dark:text-surface-400 w-12">
                      {conversationInfo.analytics.messageTypes.files}% Files
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Common Topics */}
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2">Common Topics</h4>
              <div className="flex flex-wrap gap-1">
                {conversationInfo.analytics.commonTopics.map((topic, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-surface-200 dark:bg-surface-700 rounded-full text-xs text-surface-700 dark:text-surface-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-96 bg-surface-card dark:bg-slate-800 border border-surface-border dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-[500px] overflow-y-auto scrollbar-hidden">
          <div className="p-4 border-b border-surface-border dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-text-primary dark:text-slate-100">Chat Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-surface-hover dark:hover:bg-slate-700 rounded"
              >
                <X className="w-4 h-4 text-text-primary dark:text-slate-300" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Theme Settings */}
            <div>
              <h4 className="font-medium text-text-primary dark:text-slate-100 mb-3 flex items-center">
                <Monitor className="w-4 h-4 mr-2" />
                Theme
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    theme === 'light' ? 'bg-brand-primary-light text-brand-primary' : 'hover:bg-surface-hover dark:hover:bg-slate-700 text-text-primary dark:text-slate-300'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-sm">Light</span>
                  {theme === 'light' && <Check className="w-4 h-4 ml-auto" />}
                </button>
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    theme === 'dark' ? 'bg-brand-primary-light text-brand-primary' : 'hover:bg-surface-hover dark:hover:bg-slate-700 text-text-primary dark:text-slate-300'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-sm">Dark</span>
                  {theme === 'dark' && <Check className="w-4 h-4 ml-auto" />}
                </button>
                <button
                  onClick={() => setThemeMode('comfort')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    theme === 'comfort' ? 'bg-brand-primary-light text-brand-primary' : 'hover:bg-surface-hover dark:hover:bg-slate-700 text-text-primary dark:text-slate-300'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm">Comfort</span>
                  {theme === 'comfort' && <Check className="w-4 h-4 ml-auto" />}
                </button>
                <button
                  onClick={() => setThemeMode('system')}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    theme === 'system' ? 'bg-brand-primary-light text-brand-primary' : 'hover:bg-surface-hover dark:hover:bg-slate-700 text-text-primary dark:text-slate-300'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm">System</span>
                  {theme === 'system' && <Check className="w-4 h-4 ml-auto" />}
                </button>
              </div>
            </div>

            {/* Accessibility Settings */}
            <div>
              <h4 className="font-medium text-text-primary dark:text-slate-100 mb-3 flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Accessibility
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary dark:text-slate-300">High Contrast</span>
                  <input
                    type="checkbox"
                    checked={settings.accessibility.highContrast}
                    onChange={(e) => updateSettings('accessibility', 'highContrast', e.target.checked)}
                    className="rounded border-surface-border text-brand-primary focus:ring-brand-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary dark:text-slate-300">Large Text</span>
                  <input
                    type="checkbox"
                    checked={settings.accessibility.largeText}
                    onChange={(e) => updateSettings('accessibility', 'largeText', e.target.checked)}
                    className="rounded border-surface-border text-brand-primary focus:ring-brand-primary"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-surface-700 dark:text-surface-300">Keyboard Shortcuts</span>
                  <input
                    type="checkbox"
                    checked={settings.accessibility.keyboardShortcuts}
                    onChange={(e) => updateSettings('accessibility', 'keyboardShortcuts', e.target.checked)}
                    className="rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Notification Settings */}
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-3 flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-surface-700 dark:text-surface-300">Desktop Notifications</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications.desktop}
                    onChange={(e) => updateSettings('notifications', 'desktop', e.target.checked)}
                    className="rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-surface-700 dark:text-surface-300">Sound Alerts</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications.sound}
                    onChange={(e) => updateSettings('notifications', 'sound', e.target.checked)}
                    className="rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-surface-700 dark:text-surface-300">Mention Alerts</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications.mentions}
                    onChange={(e) => updateSettings('notifications', 'mentions', e.target.checked)}
                    className="rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-surface-700 dark:text-surface-300">Reaction Alerts</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications.reactions}
                    onChange={(e) => updateSettings('notifications', 'reactions', e.target.checked)}
                    className="rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Privacy
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-surface-700 dark:text-surface-300">Read Receipts</span>
                  <input
                    type="checkbox"
                    checked={settings.privacy.readReceipts}
                    onChange={(e) => updateSettings('privacy', 'readReceipts', e.target.checked)}
                    className="rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-surface-700 dark:text-surface-300">Typing Indicators</span>
                  <input
                    type="checkbox"
                    checked={settings.privacy.typingIndicators}
                    onChange={(e) => updateSettings('privacy', 'typingIndicators', e.target.checked)}
                    className="rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-surface-700 dark:text-surface-300">End-to-End Encryption</span>
                  <input
                    type="checkbox"
                    checked={settings.privacy.encryption}
                    onChange={(e) => updateSettings('privacy', 'encryption', e.target.checked)}
                    className="rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-surface-700 dark:text-surface-300">Online Status</span>
                  <input
                    type="checkbox"
                    checked={settings.privacy.onlineStatus}
                    onChange={(e) => updateSettings('privacy', 'onlineStatus', e.target.checked)}
                    className="rounded border-surface-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </div>
            </div>

            {/* Settings Actions */}
            <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Save settings to localStorage for persistence
                    localStorage.setItem('chatSettings', JSON.stringify(settings));
                    // Settings saved successfully
                    // Show toast notification
                    toast.success('Settings saved successfully');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Save Settings
                </button>
                <button
                  onClick={() => {
                    // Reset to default settings
                    setSettings({
                      accessibility: {
                        highContrast: false,
                        largeText: false,
                        keyboardShortcuts: true
                      },
                      notifications: {
                        desktop: true,
                        sound: true,
                        mentions: true,
                        reactions: true
                      },
                      privacy: {
                        readReceipts: true,
                        typingIndicators: true,
                        encryption: false,
                        onlineStatus: true
                      }
                    });
                    // Settings reset to defaults
                  }}
                  className="flex-1 bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
              <div className="mt-3 text-xs text-surface-500 dark:text-surface-400 text-center">
                Settings are automatically saved to your browser
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
};
