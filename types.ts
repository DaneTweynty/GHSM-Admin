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
  time: string;
  notes?: string;
  status: 'scheduled' | 'deleted';
}

export interface Billing {
  id:string;
  studentId: string;
  studentName: string;
  amount: number;
  status: 'paid' | 'unpaid';
  sessionsCovered: number;
  dateIssued: string;
}

export type View = 'dashboard' | 'students' | 'billing' | 'enrollment' | 'teachers' | 'trash';
export type CalendarView = 'year' | 'month' | 'week' | 'day';