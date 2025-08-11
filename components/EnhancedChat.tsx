import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../types';
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Image, 
  File, 
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
  Monitor
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
  'Thanks for the information!',
  'Could you please clarify?',
  'I\'ll get back to you shortly.',
  'Meeting scheduled for tomorrow.',
  'Please find the attached file.',
  'Let me know if you need help.'
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

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
  }, [showEmojiPicker, chat]);

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
        return <Clock className="w-3 h-3 text-surface-600 dark:text-surface-400" />;
      case 'sent':
        return <Check className="w-3 h-3 text-surface-600 dark:text-surface-400" />;
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-surface-600 dark:text-surface-400" />;
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
  const currentConversation = chat.conversations.find(conv => conv.id === conversationId);
  const messages = chat.messages || [];

  return (
    <div className={`flex flex-col h-full bg-surface-main ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-border bg-surface-header">
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

        <div className="flex items-center space-x-2">
          {/* Search */}
          <button
            className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            title="Search messages"
          >
            <Search className="w-4 h-4 text-surface-600 dark:text-surface-400" />
          </button>

          {/* Video call */}
          <button
            onClick={chat.isScreenSharing ? chat.stopScreenShare : chat.startScreenShare}
            className={`p-2 rounded-lg transition-colors ${
              chat.isScreenSharing 
                ? 'bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-400'
                : 'hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
            }`}
            title={chat.isScreenSharing ? 'Stop screen sharing' : 'Start screen sharing'}
          >
            {chat.isScreenSharing ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-surface-600 dark:text-surface-400" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-4 ${
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

        {messages.map((msg: ChatMessage) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl relative group ${
                msg.senderType === 'admin'
                  ? 'bg-blue-500 text-white'
                  : 'bg-surface-200 dark:bg-surface-700 text-surface-900 dark:text-surface-100'
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
                    <div className="mt-2 p-2 rounded bg-surface-100 dark:bg-surface-800">
                      <div className="flex items-center space-x-2">
                        {msg.fileData.type.startsWith('image/') ? (
                          <Image className="w-4 h-4" />
                        ) : (
                          <File className="w-4 h-4" />
                        )}
                        <span className="text-xs">{msg.fileData.name}</span>
                        <a
                          href={msg.fileData.url}
                          download={msg.fileData.name}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Download className="w-3 h-3" />
                        </a>
                      </div>
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
                      {msg.reactions.map((reaction: any, index: number) => (
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
                msg.senderType === 'admin' ? 'text-blue-100' : 'text-surface-500 dark:text-surface-400'
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
            <div className="grid grid-cols-2 gap-2">
              {MESSAGE_TEMPLATES.map((template, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setMessage(template);
                    setShowTemplates(false);
                    messageInputRef.current?.focus();
                  }}
                  className="p-2 text-left text-sm bg-surface-100 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-600 rounded transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
        )}

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
              className="w-full px-4 py-3 pr-12 rounded-xl border border-surface-border bg-surface-input text-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
              rows={1}
              style={{ minHeight: '48px' }}
            />

            {/* Emoji picker button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
              title="Add emoji"
            >
              <Smile className="w-4 h-4 text-surface-600 dark:text-surface-400" />
            </button>

            {/* Emoji picker */}
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full right-0 mb-2 bg-surface-100 dark:bg-surface-800 rounded-lg shadow-lg p-3 grid grid-cols-8 gap-2 z-10"
              >
                {['😀', '😂', '😍', '🤔', '😢', '😡', '👍', '👎', '❤️', '🎉', '🔥', '💯', '😎', '🤗', '😴', '🤝'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                      messageInputRef.current?.focus();
                    }}
                    className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded text-lg"
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

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 w-80 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-surface-900 dark:text-surface-100">Chat Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Theme Settings */}
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2">Theme</h4>
              <div className="space-y-2">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    theme === 'light' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-sm">Light</span>
                </button>
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    theme === 'dark' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-sm">Dark</span>
                </button>
                <button
                  onClick={() => setThemeMode('comfort')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    theme === 'comfort' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm">Comfort</span>
                </button>
                <button
                  onClick={() => setThemeMode('system')}
                  className={`w-full flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    theme === 'system' ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-surface-200 dark:hover:bg-surface-700'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-sm">System</span>
                </button>
              </div>
            </div>

            {/* Accessibility */}
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2">Accessibility</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">High contrast mode</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Large text</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Keyboard shortcuts</span>
                </label>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2">Notifications</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Desktop notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Sound notifications</span>
                </label>
              </div>
            </div>

            {/* Privacy */}
            <div>
              <h4 className="font-medium text-surface-900 dark:text-surface-100 mb-2">Privacy</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Read receipts</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Typing indicators</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">End-to-end encryption</span>
                </label>
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
