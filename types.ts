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
}

export interface Instructor {
  id: string;
  name: string;
  specialty: string;
  color: string;
  profilePictureUrl?: string;
  status: 'active' | 'inactive';
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

export type View = 'dashboard' | 'students' | 'billing' | 'enrollment' | 'teachers' | 'trash';
export type CalendarView = 'year' | 'month' | 'week' | 'day';

declare module './types' {}