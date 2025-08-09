export interface Student {
  id: string;
  studentIdNumber: string;
  name: string;
  instrument: string;
  sessionsAttended: number;
  sessionsBilled: number;
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
}

export type View = 'dashboard' | 'students' | 'billing' | 'enrollment' | 'teachers' | 'trash';
export type CalendarView = 'year' | 'month' | 'week' | 'day';