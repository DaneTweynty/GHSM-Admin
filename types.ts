export interface Student {
  id: string;
  studentIdNumber: string;
  name: string;
  instrument: string;
  sessionsAttended: number;
  sessionsBilled: number;
  creditBalance?: number; // positive PHP balance carried forward
  instructorId?: string;
  age?: number;
  email?: string;
  contactNumber?: string;
  guardianName?: string;
  guardianFullName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianFacebook?: string;
  facebook?: string; // Student's Facebook account or link
  gender?: 'Male' | 'Female';
  status: 'active' | 'inactive';
  profilePictureUrl?: string;
  lastAttendanceMarkedAt?: number;
  parentStudentId?: string; // Links to original student for multi-instrument tracking
}

export interface Instructor {
  id: string;
  name: string;
  specialty: string[];
  availability?: {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
    slots: { start: string; end: string }[];
  }[];
  color: string;
  profilePictureUrl?: string;
  status: 'active' | 'inactive';
  email?: string;
  phone?: string;
  bio?: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  instructorId: string;
  roomId: number;
  date: string; // ISO String: 'YYYY-MM-DD'
  time: string; // start time HH:MM
  endTime?: string; // optional end time HH:MM for flexible durations
  notes?: string;
  status: 'scheduled' | 'deleted';
}

export interface BillingItem {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number; // price per unit
}

export type PaymentMethod = 'Cash' | 'BDO' | 'GCash' | 'Other' | 'Credit';

export interface Payment {
  id: string;
  billingId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string; // OR number / transaction no.
  note?: string;
  overpayHandling?: 'next' | 'hold';
  date: string; // ISO
}

export interface Billing {
  id:string;
  studentId: string;
  studentName: string;
  amount: number;
  status: 'paid' | 'unpaid';
  sessionsCovered: number;
  dateIssued: string;
  // Optional line items for invoice breakdown
  items?: BillingItem[];
  // Payments made towards this invoice
  payments?: Payment[];
  // Convenience cached sum of payments (derived but stored for listing ease)
  paidAmount?: number;
}

export type View = 'dashboard' | 'students' | 'billing' | 'enrollment' | 'teachers' | 'trash' | 'chat';
export type CalendarView = 'year' | 'month' | 'week' | 'day';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'admin' | 'instructor';
  content: string;
  timestamp: string; // ISO string
  readBy: string[]; // Array of user IDs who have read this message
  edited?: boolean;
  editedAt?: string;
  type: 'text' | 'file' | 'voice' | 'image' | 'video';
  reactions?: MessageReaction[];
  replyTo?: string; // ID of the message being replied to
  status: 'sending' | 'sent' | 'delivered' | 'read';
  formatting?: MessageFormatting;
  fileData?: FileData;
  voiceData?: VoiceData;
  scheduledFor?: string; // ISO string for scheduled messages
  isDeleted?: boolean;
  deletedAt?: string;
  forwardedFrom?: string; // Original message ID if forwarded
  pinned?: boolean;
  pinnedAt?: string;
  encrypted?: boolean;
  translation?: { [language: string]: string };
  sentiment?: 'positive' | 'negative' | 'neutral';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface MessageFormatting {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  mentions?: string[];
  links?: Array<{ text: string; url: string }>;
}

export interface FileData {
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  preview?: string; // For document previews
  compressed?: boolean;
  dimensions?: { width: number; height: number };
}

export interface VoiceData {
  duration: number;
  url: string;
  waveform?: number[];
  transcription?: string;
  language?: string;
}

export interface ChatConversation {
  id: string;
  participants: {
    id: string;
    name: string;
    type: 'admin' | 'instructor';
    isOnline?: boolean;
    lastSeen?: string;
    avatar?: string;
  }[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  isTyping?: string[]; // User IDs who are currently typing
  pinned?: boolean;
  pinnedAt?: string;
  archived?: boolean;
  archivedAt?: string;
  muted?: boolean;
  mutedUntil?: string;
  labels?: string[];
  encryptionEnabled?: boolean;
  backup?: {
    lastBackup: string;
    autoBackup: boolean;
  };
  analytics?: {
    messageCount: number;
    avgResponseTime: number;
    lastActivity: string;
  };
  settings?: {
    autoResponses: Array<{
      trigger: string;
      response: string;
      enabled: boolean;
    }>;
    templates: Array<{
      name: string;
      content: string;
      shortcut: string;
    }>;
  };
}

export interface ChatState {
  conversations: ChatConversation[];
  messages: { [conversationId: string]: ChatMessage[] };
  activeConversationId: string | null;
  currentUser: {
    id: string;
    name: string;
    type: 'admin' | 'instructor';
  } | null;
  searchResults?: ChatMessage[];
  typingUsers: { [conversationId: string]: string[] };
  preferences: ChatPreferences;
  cache: { [key: string]: any };
  analytics: ChatAnalytics;
}

export interface ChatPreferences {
  notifications: {
    enabled: boolean;
    sound: string;
    quietHours: { start: string; end: string };
    priority: boolean;
    desktop: boolean;
    email: boolean;
  };
  accessibility: {
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
    screenReader: boolean;
    keyboardShortcuts: boolean;
    colorBlindFriendly: boolean;
  };
  privacy: {
    readReceipts: boolean;
    typingIndicators: boolean;
    onlineStatus: boolean;
    encryptionEnabled: boolean;
  };
  performance: {
    messageCaching: boolean;
    imageCompression: boolean;
    lazyLoading: boolean;
    offlineSupport: boolean;
  };
  language: {
    primary: string;
    autoTranslate: boolean;
    autoDetect: boolean;
  };
}

export interface ChatAnalytics {
  totalMessages: number;
  totalConversations: number;
  avgResponseTime: number;
  messagesByType: { [type: string]: number };
  activeHours: { [hour: number]: number };
  sentiment: { positive: number; negative: number; neutral: number };
  topContacts: Array<{ id: string; name: string; messageCount: number }>;
}

export interface ChatCommand {
  name: string;
  description: string;
  usage: string;
  handler: (args: string[], context: any) => void;
  permissions?: string[];
}

export interface ChatPlugin {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
  commands?: ChatCommand[];
  hooks?: {
    beforeSend?: (message: ChatMessage) => ChatMessage;
    afterReceive?: (message: ChatMessage) => ChatMessage;
    onConversationOpen?: (conversation: ChatConversation) => void;
  };
}

declare module './types' {}