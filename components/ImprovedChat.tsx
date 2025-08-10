import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Search, 
  Paperclip, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  Smile, 
  Reply, 
  MoreVertical,
  Phone,
  Video,
  Info,
  Settings,
  Volume2,
  Download,
  CheckCheck,
  Check,
  Clock,
  Circle,
  MessageSquare,
  ThumbsUp,
  Heart,
  Laugh,
  Frown,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Instructor, ChatMessage, ChatConversation, MessageReaction } from '../types';

interface ImprovedChatProps {
  instructors: Instructor[];
  currentUser: {
    id: string;
    name: string;
    type: 'admin' | 'instructor';
  };
}

// Common emojis for reactions
const commonEmojis = [
  { emoji: '👍', icon: ThumbsUp },
  { emoji: '❤️', icon: Heart },
  { emoji: '😂', icon: Laugh },
  { emoji: '😢', icon: Frown },
  { emoji: '🎉', text: '🎉' },
  { emoji: '💯', text: '💯' }
];

export const ImprovedChat: React.FC<ImprovedChatProps> = ({ instructors, currentUser }) => {
  const { theme, setThemeMode, handleThemeToggle, fontSize, handleFontSizeChange } = useApp();
  
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: ChatMessage[] }>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ [conversationId: string]: string[] }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<{ [messageId: string]: boolean }>({});
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeConversationId]);

  // Initialize conversations from instructors
  useEffect(() => {
    const initialConversations: ChatConversation[] = instructors.map(instructor => ({
      id: `conv-${instructor.id}`,
      participants: [
        {
          id: instructor.id,
          name: instructor.name,
          type: 'instructor' as const,
          isOnline: Math.random() > 0.5, // Random online status for demo
          lastSeen: new Date().toISOString()
        },
        {
          id: currentUser.id,
          name: currentUser.name,
          type: currentUser.type,
          isOnline: true
        }
      ],
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isTyping: []
    }));

    setConversations(initialConversations);
  }, [instructors, currentUser]);

  const activeConversation = conversations.find(conv => conv.id === activeConversationId);
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];
  const replyingToMessage = replyingTo ? activeMessages.find(msg => msg.id === replyingTo) : null;

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      mediaRecorder.start();
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          const audioUrl = URL.createObjectURL(event.data);
          sendVoiceMessage(audioUrl, recordingTime);
        }
      };
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const sendVoiceMessage = (audioUrl: string, duration: number) => {
    if (!activeConversationId) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderType: currentUser.type,
      content: '',
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id],
      type: 'voice',
      status: 'sent',
      voiceData: {
        duration,
        url: audioUrl
      }
    };

    setMessages(prev => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), message]
    }));
  };

  // File handling
  const handleFileUpload = useCallback((files: FileList) => {
    if (!activeConversationId || files.length === 0) return;

    Array.from(files).forEach(file => {
      const message: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderType: currentUser.type,
        content: file.name,
        timestamp: new Date().toISOString(),
        readBy: [currentUser.id],
        type: file.type.startsWith('image/') ? 'image' : 'file',
        status: 'sent',
        fileData: {
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        }
      };

      setMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), message]
      }));
    });
  }, [activeConversationId, currentUser]);

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) {
      setDragActive(true);
    }
  }, [dragActive]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragActive to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  // Message reactions
  const addReaction = (messageId: string, emoji: string) => {
    if (!activeConversationId) return;

    setMessages(prev => ({
      ...prev,
      [activeConversationId]: prev[activeConversationId]?.map(msg => {
        if (msg.id === messageId) {
          const reactions = msg.reactions || [];
          const existingReaction = reactions.find(r => r.userId === currentUser.id && r.emoji === emoji);
          
          if (existingReaction) {
            return {
              ...msg,
              reactions: reactions.filter(r => !(r.userId === currentUser.id && r.emoji === emoji))
            };
          } else {
            return {
              ...msg,
              reactions: [...reactions, {
                userId: currentUser.id,
                userName: currentUser.name,
                emoji,
                timestamp: new Date().toISOString()
              }]
            };
          }
        }
        return msg;
      }) || []
    }));
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !activeConversationId) return;

    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderType: currentUser.type,
      content: newMessage,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id],
      type: 'text',
      status: 'sent',
      replyTo: replyingTo || undefined
    };

    setMessages(prev => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), message]
    }));

    setNewMessage('');
    setReplyingTo(null);
  };

  // Search messages
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearchMode(false);
      return;
    }

    const allMessages = Object.values(messages).flat() as ChatMessage[];
    const results = allMessages.filter(msg =>
      msg.content.toLowerCase().includes(query.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
    setIsSearchMode(true);
  };

  // Get message status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-text-tertiary" />;
      case 'sent':
        return <Check className="w-3 h-3 text-text-tertiary" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-text-tertiary" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-brand-primary" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="flex h-full w-full bg-surface-main transition-colors duration-200"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragActive && (
        <div className="absolute inset-0 bg-brand-primary/20 border-2 border-dashed border-brand-primary flex items-center justify-center z-50">
          <div className="text-center">
            <Paperclip className="w-12 h-12 mb-4 mx-auto text-brand-primary" />
            <div className="text-lg font-semibold text-brand-primary">Drop files here to share</div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-80 border-r border-surface-border bg-surface-card flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-surface-border flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Messages</h2>
            <div className="flex items-center space-x-2">
              <button
                className="p-2 rounded-lg transition-colors hover:bg-surface-hover"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-text-secondary" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-surface-border bg-surface-input text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => {
            const otherParticipant = conversation.participants.find(p => p.id !== currentUser.id);
            const lastMessage = messages[conversation.id]?.slice(-1)[0];
            
            return (
              <div
                key={conversation.id}
                onClick={() => setActiveConversationId(conversation.id)}
                className={`p-4 cursor-pointer border-b border-surface-border transition-colors hover:bg-surface-hover ${
                  activeConversationId === conversation.id ? 'bg-brand-primary-light' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {otherParticipant?.name.charAt(0) || '?'}
                      </span>
                    </div>
                    {otherParticipant?.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-status-green border-2 border-surface-card rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-text-primary truncate">
                        {otherParticipant?.name || 'Unknown'}
                      </h3>
                      {lastMessage && (
                        <span className="text-xs text-text-tertiary">
                          {new Date(lastMessage.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-text-secondary truncate">
                        {lastMessage ? (
                          lastMessage.type === 'voice' ? '🎵 Voice message' :
                          lastMessage.type === 'image' ? '📷 Image' :
                          lastMessage.type === 'file' ? '📎 File' :
                          lastMessage.content
                        ) : 'No messages yet'}
                      </p>
                      
                      {conversation.unreadCount > 0 && (
                        <div className="bg-brand-primary text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                    
                    {typingUsers[conversation.id]?.length > 0 && (
                      <div className="flex items-center space-x-1 mt-1">
                        <div className="flex space-x-1">
                          <Circle className="w-2 h-2 text-brand-primary animate-bounce" />
                          <Circle className="w-2 h-2 text-brand-primary animate-bounce delay-100" />
                          <Circle className="w-2 h-2 text-brand-primary animate-bounce delay-200" />
                        </div>
                        <span className="text-xs text-text-tertiary">typing...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-surface-main">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-surface-border bg-surface-header flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {activeConversation.participants.find(p => p.id !== currentUser.id)?.name.charAt(0) || '?'}
                    </span>
                  </div>
                  {activeConversation.participants.find(p => p.id !== currentUser.id)?.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-status-green border-2 border-surface-header rounded-full"></div>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-text-primary">
                    {activeConversation.participants.find(p => p.id !== currentUser.id)?.name || 'Unknown'}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {activeConversation.participants.find(p => p.id !== currentUser.id)?.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-lg transition-colors hover:bg-surface-hover">
                  <Phone className="w-4 h-4 text-text-secondary" />
                </button>
                <button className="p-2 rounded-lg transition-colors hover:bg-surface-hover">
                  <Video className="w-4 h-4 text-text-secondary" />
                </button>
                <button className="p-2 rounded-lg transition-colors hover:bg-surface-hover">
                  <Info className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </div>

            {/* Reply Banner */}
            {replyingToMessage && (
              <div className="p-3 border-b border-surface-border bg-surface-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-1 h-8 bg-brand-primary rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        Replying to {replyingToMessage.senderName}
                      </p>
                      <p className="text-xs text-text-secondary truncate max-w-xs">
                        {replyingToMessage.content}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 hover:bg-surface-hover rounded"
                  >
                    <X className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeMessages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'} group`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                      message.senderId === currentUser.id
                        ? 'bg-brand-primary text-text-on-color ml-auto'
                        : 'bg-surface-card text-text-primary'
                    }`}
                  >
                    {/* Reply reference */}
                    {message.replyTo && (
                      <div className="mb-2 p-2 border-l-2 border-brand-secondary bg-brand-primary-light rounded">
                        <p className="text-xs text-text-secondary">
                          {activeMessages.find(m => m.id === message.replyTo)?.content || 'Original message'}
                        </p>
                      </div>
                    )}

                    {/* Message content */}
                    <div className="space-y-2">
                      {message.type === 'voice' && message.voiceData ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // Toggle play/pause
                              const audio = new Audio(message.voiceData!.url);
                              if (isPlaying[message.id]) {
                                audio.pause();
                                setIsPlaying(prev => ({...prev, [message.id]: false}));
                              } else {
                                audio.play();
                                setIsPlaying(prev => ({...prev, [message.id]: true}));
                                audio.onended = () => setIsPlaying(prev => ({...prev, [message.id]: false}));
                              }
                            }}
                            className="p-2 rounded-full bg-surface-hover"
                          >
                            {isPlaying[message.id] ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                          <div className="flex-1">
                            <div className="w-20 h-1 bg-surface-border rounded-full">
                              <div className="w-4 h-1 bg-brand-primary rounded-full"></div>
                            </div>
                          </div>
                          <span className="text-xs">
                            {Math.floor(message.voiceData.duration / 60)}:{(message.voiceData.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      ) : message.type === 'image' && message.fileData ? (
                        <div className="space-y-2">
                          <img
                            src={message.fileData.url}
                            alt={message.fileData.name}
                            className="max-w-full h-auto rounded"
                          />
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ) : message.type === 'file' && message.fileData ? (
                        <div className="flex items-center space-x-2 p-2 bg-surface-input rounded">
                          <Paperclip className="w-4 h-4" />
                          <span className="text-sm flex-1">{message.fileData.name}</span>
                          <button className="p-1 hover:bg-surface-hover rounded">
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                    </div>

                    {/* Message actions */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-text-tertiary">
                        {new Date(message.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        {/* Quick reactions */}
                        <div className="flex space-x-1">
                          {message.reactions?.map((reaction, idx) => (
                            <button
                              key={idx}
                              onClick={() => addReaction(message.id, reaction.emoji)}
                              className="text-xs px-1 py-0.5 bg-surface-hover rounded"
                            >
                              {reaction.emoji}
                            </button>
                          ))}
                        </div>

                        {/* Message actions */}
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setReplyingTo(message.id)}
                            className="p-1 hover:bg-surface-hover rounded"
                          >
                            <Reply className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setShowEmojiPicker(showEmojiPicker === message.id ? null : message.id)}
                            className="p-1 hover:bg-surface-hover rounded"
                          >
                            <Smile className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Status indicator */}
                        {message.senderId === currentUser.id && getStatusIcon(message.status || 'sent')}
                      </div>

                      {/* Emoji picker */}
                      {showEmojiPicker === message.id && (
                        <div className="absolute bottom-full right-0 mb-2 p-2 bg-surface-card border border-surface-border rounded-lg shadow-lg z-10">
                          <div className="flex space-x-1">
                            {commonEmojis.map((emojiData) => (
                              <button
                                key={emojiData.emoji}
                                onClick={() => {
                                  addReaction(message.id, emojiData.emoji);
                                  setShowEmojiPicker(null);
                                }}
                                className="p-1 hover:bg-surface-hover rounded"
                              >
                                {emojiData.text || <emojiData.icon className="w-4 h-4" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {typingUsers[activeConversationId]?.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-surface-card px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-surface-border bg-surface-header">
              <div className="flex items-end space-x-2">
                {/* Attachment button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-5 h-5 text-text-secondary" />
                </button>

                {/* Voice message button */}
                <button
                  onClick={() => isRecording ? stopRecording() : startRecording()}
                  className={`p-2 rounded-lg transition-colors ${
                    isRecording ? 'bg-status-red text-white' : 'hover:bg-surface-hover text-text-secondary'
                  }`}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice message'}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Recording indicator */}
                {isRecording && (
                  <div className="flex items-center space-x-2 px-3 py-2 bg-status-red text-white rounded-lg">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm">
                      {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}

                {/* Message input */}
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-surface-border bg-surface-input text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  />
                  
                  {/* Emoji button */}
                  <button
                    onClick={() => {}}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-surface-hover transition-colors"
                  >
                    <Smile className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>

                {/* Send button */}
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-2 rounded-lg bg-brand-primary text-white hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-surface-main">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">Welcome to Chat</h3>
              <p className="text-text-secondary">Select a conversation to start messaging with enhanced features</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
    </div>
  );
};
