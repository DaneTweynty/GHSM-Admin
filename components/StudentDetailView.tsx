import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import ThemedSelect from './ThemedSelect';
import { control } from './ui';
import type { Student, Lesson, Billing, Instructor } from '../types';
import { Card } from './Card';
import { useApp } from '../context/AppContext.supabase';
import { ICONS } from '../constants';

interface StudentDetailViewProps {
  student: Student;
  lessons: Lesson[];
  billings: Billing[];
  instructors: Instructor[];
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

const Avatar: React.FC<{ student: Student, size: 'sm' | 'lg' }> = ({ student, size }) => {
    const sizeClasses = size === 'lg' ? 'h-20 w-20' : 'h-9 w-9';
    if (student.profilePictureUrl) {
        return <img src={student.profilePictureUrl} alt={student.name} className={`${sizeClasses} rounded-full object-cover shrink-0 border-4 border-white dark:border-slate-800 shadow-md`} />;
    }
    const initials = getInitials(student.name);
    // Simple hash to get a color
    const colorIndex = (student.name.charCodeAt(0) || 0) % 6;
    const colors = ['bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-purple-200', 'bg-pink-200'];
    const textColors = ['text-red-800', 'text-blue-800', 'text-green-800', 'text-yellow-800', 'text-purple-800', 'text-pink-800'];
    return (
        <div className={`${sizeClasses} rounded-full flex items-center justify-center shrink-0 border-4 border-white dark:border-slate-800 shadow-md ${colors[colorIndex]} ${textColors[colorIndex]}`}>
            <span className={`font-bold ${size === 'lg' ? 'text-3xl' : 'text-xs'}`}>{initials}</span>
        </div>
    );
};

// Helpers
const isUrlish = (v?: string) => !!v && /^(https?:\/\/)/i.test(v.trim());
const toLikelyUrl = (v?: string) => {
  if (!v) return undefined;
  const s = v.trim();
  if (/^(https?:\/\/)/i.test(s)) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  if (/^(facebook\.com\/|m\.facebook\.com\/|fb\.com\/)/i.test(s)) return `https://${s}`;
  return undefined;
};
const normalizePhone = (v?: string) => (v || '').replace(/[^\d]/g, '');
const formatPhone = (v?: string) => {
  const d = normalizePhone(v);
  if (d.length === 11 && d.startsWith('1')) {
    const core = d.slice(1);
    return `+1 (${core.slice(0,3)}) ${core.slice(3,6)}-${core.slice(6,10)}`;
  }
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6,10)}`;
  if (!d) return '';
  return v || d; // fallback show original
};
const isValidPhone = (v?: string) => {
  const d = normalizePhone(v);
  return d.length === 10 || (d.length === 11 && d.startsWith('1'));
};
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const CopyIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);
const _CheckIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const DetailItem: React.FC<{ label: string; value?: string | number; copiable?: boolean; makeUrlIfHttp?: boolean }>
  = ({ label, value, copiable, makeUrlIfHttp }) => {
    if ((!value && value !== 0)) return null;
    const str = String(value ?? '');
    const url = makeUrlIfHttp ? (isUrlish(str) ? str : toLikelyUrl(str)) : undefined;
    const copyValue = copiable ? str : undefined;
    const handleCopy = async () => {
      if (!copyValue) return;
      await copyToClipboard(copyValue);
    };
    return (
        <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-semibold text-text-primary dark:text-slate-200">{label}:</span>
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="ml-2 text-brand-primary hover:underline break-words inline-block align-middle">
                  {str}
                </a>
              ) : (
                <span className="ml-2 text-text-secondary dark:text-slate-400 break-words align-middle inline-block">{label.toLowerCase().includes('phone') ? formatPhone(str) : str}</span>
              )}
            </div>
            {copyValue && (
              <button
                type="button"
                onClick={handleCopy}
                title="Copy"
                className="shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-text-tertiary dark:text-slate-400"
              >
                <CopyIcon />
              </button>
            )}
        </div>
    );
};

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ student, lessons, billings, instructors }) => {
  const { handleMarkAttendance: _handleMarkAttendance, handleUpdateStudentContact } = useApp();
  const [showBreakdown, setShowBreakdown] = React.useState<null | { id: string }>(null);
  const instructorMap = useMemo(() => new Map<string, Instructor>(instructors.map(i => [i.id, i] as [string, Instructor])), [instructors]);

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isEditingGuardian, setIsEditingGuardian] = useState(false);
  const [contactEmail, setContactEmail] = useState(student.email || '');
  const [contactPhone, setContactPhone] = useState(student.contactNumber || '');
  const [contactFacebook, setContactFacebook] = useState(student.facebook || '');
  const [gName, setGName] = useState(student.guardianFullName || student.guardianName || '');
  const [gPhone, setGPhone] = useState(student.guardianPhone || '');
  const [gEmail, setGEmail] = useState(student.guardianEmail || '');
  const [gFacebook, setGFacebook] = useState(student.guardianFacebook || '');
  const [errors, setErrors] = useState<{ contactPhone?: string; gPhone?: string }>({});

  const isMinor = (student.age ?? 0) > 0 && (student.age as number) < 18;
  const _wasAttendedRecently = useMemo(() => {
    if (!student.lastAttendanceMarkedAt) return false;
    const now = Date.now();
    return now - student.lastAttendanceMarkedAt < 24 * 60 * 60 * 1000;
  }, [student.lastAttendanceMarkedAt]);

  // Lessons filtering and pagination
  const [lessonFilter, setLessonFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [lessonPage, setLessonPage] = useState(1);
  const lessonsPerPage = 7; // show at least 7 cards
  const filteredLessons = useMemo(() => {
    const now = new Date();
    const today = new Date(now.toDateString());
    const parse = (d: string) => new Date(d.replace(/-/g, '/')).getTime();
    return lessons
      .filter(l => {
        if (lessonFilter === 'all') return true;
        const t = parse(l.date);
        return lessonFilter === 'upcoming' ? t >= today.getTime() : t < today.getTime();
      })
      .sort((a, b) => parse(b.date) - parse(a.date)); // DESC
  }, [lessons, lessonFilter]);
  const totalLessonPages = Math.max(1, Math.ceil(filteredLessons.length / lessonsPerPage));
  const pagedLessons = filteredLessons.slice((lessonPage - 1) * lessonsPerPage, lessonPage * lessonsPerPage);

  // Billing pagination
  const [billingPage, setBillingPage] = useState(1);
  const billsPerPage = 5;
  const sortedBills = useMemo(() => billings.slice().sort((a,b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime()), [billings]);
  const totalBillingPages = Math.max(1, Math.ceil(sortedBills.length / billsPerPage));
  const pagedBills = sortedBills.slice((billingPage - 1) * billsPerPage, billingPage * billsPerPage);

  const handleSaveContact = () => {
    const nextErrors: typeof errors = {};
    if (contactPhone && !isValidPhone(contactPhone)) nextErrors.contactPhone = 'Enter a valid 10-digit phone (or 1+10).';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    
    try {
      handleUpdateStudentContact(student.id, {
        email: contactEmail.trim() || undefined,
        contactNumber: normalizePhone(contactPhone) || undefined,
        facebook: contactFacebook.trim() || undefined,
      });
      setIsEditingContact(false);
      // Success feedback is handled by the context via transaction system
    } catch {
      toast.error('Failed to update contact information. Please try again.');
    }
  };

  const handleSaveGuardian = () => {
    const nextErrors: typeof errors = {};
    if (gPhone && !isValidPhone(gPhone)) nextErrors.gPhone = 'Enter a valid 10-digit phone (or 1+10).';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    
    try {
      handleUpdateStudentContact(student.id, {
        guardianFullName: gName.trim() || undefined,
        guardianPhone: normalizePhone(gPhone) || undefined,
        guardianEmail: gEmail.trim() || undefined,
        guardianFacebook: gFacebook.trim() || undefined,
      });
      setIsEditingGuardian(false);
      // Success feedback is handled by the context via transaction system
    } catch {
      toast.error('Failed to update guardian information. Please try again.');
    }
  };

  const lastAttendanceLabel = student.lastAttendanceMarkedAt ? new Date(student.lastAttendanceMarkedAt).toLocaleString() : 'N/A';
  const formatPHP = (amount: number) => `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-surface-header dark:bg-slate-900/50 p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      <Card className="p-4 md:col-span-2 lg:col-span-1 flex flex-col items-center text-center h-full">
        <div className="mt-2 mb-3">
            <Avatar student={student} size="lg" />
        </div>
        <h3 className="text-lg font-bold text-text-primary dark:text-slate-100 flex items-center gap-2">
          {student.name}
          {student.nickname && (
            <span className="text-sm font-normal text-text-secondary dark:text-slate-400">"{student.nickname}"</span>
          )}
          {isMinor ? (
            <span className="text-xs px-2 py-0.5 rounded-full bg-status-yellow-light dark:bg-status-yellow/20 text-status-yellow">Minor</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded-full bg-status-green-light dark:bg-status-green/20 text-status-green">Adult</span>
          )}
        </h3>
        <p className="text-sm text-text-secondary dark:text-slate-400 mb-1">ID: {student.studentIdNumber}</p>
        <p className="text-sm text-text-secondary dark:text-slate-400 mb-1">{student.instrument}</p>
        {/* Enhanced Age and Birthdate Information */}
        {student.birthdate ? (
          <div className="text-sm text-text-secondary dark:text-slate-400 mb-2">
            <p>Birthdate: {new Date(student.birthdate).toLocaleDateString()}</p>
            <p>Age: {student.age || 'N/A'} years old</p>
          </div>
        ) : student.age ? (
          <p className="text-sm text-text-secondary dark:text-slate-400 mb-2">Age: {student.age} years old</p>
        ) : null}
        {student.creditBalance && student.creditBalance > 0 && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-status-green-light dark:bg-status-green/20 text-status-green">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 1v22"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              Credit: {formatPHP(student.creditBalance)}
            </span>
          </div>
        )}
        <div className="text-xs text-text-tertiary dark:text-slate-400 mb-4">Last attendance: {lastAttendanceLabel}</div>
        <div className="space-y-2.5 text-sm text-left w-full border-t border-surface-border dark:border-slate-700 pt-4">
            {/* Enhanced Contact Information */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] uppercase tracking-wide text-text-tertiary dark:text-slate-400">Contact Information</div>
              {!isEditingContact ? (
                <button
                  type="button"
                  onClick={() => setIsEditingContact(true)}
                  className="text-xs px-2 py-0.5 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Edit
                </button>
              ) : null}
            </div>
            {!isEditingContact ? (
              <div className="space-y-2">
                <DetailItem label="Gender" value={student.gender} />
                <DetailItem label="Age" value={student.age} />
                <DetailItem label="Email" value={student.email} copiable />
                <DetailItem label="Contact" value={student.contactNumber ? formatPhone(student.contactNumber) : undefined} copiable />
                <DetailItem label="Facebook" value={student.facebook} copiable makeUrlIfHttp />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-text-secondary dark:text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    className={control}
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary dark:text-slate-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className={`${control} ${errors.contactPhone ? 'border-status-red' : ''}`}
                    placeholder="(555) 123-4567"
                  />
                  {errors.contactPhone && <div className="text-xs text-status-red mt-1">{errors.contactPhone}</div>}
                </div>
                <div>
                  <label className="block text-xs text-text-secondary dark:text-slate-400 mb-1">Facebook (name or link)</label>
                  <input
                    type="text"
                    value={contactFacebook}
                    onChange={e => setContactFacebook(e.target.value)}
                    className={control}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveContact}
                    className="text-xs px-3 py-1 rounded-md bg-brand-primary text-text-on-color"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEditingContact(false); setContactEmail(student.email || ''); setContactPhone(student.contactNumber || ''); setContactFacebook(student.facebook || ''); setErrors({ ...errors, contactPhone: undefined }); }}
                    className="text-xs px-3 py-1 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="pt-3 mt-3 border-t border-surface-border dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] uppercase tracking-wide text-text-tertiary dark:text-slate-400">Guardian Details</div>
                {!isEditingGuardian && (
                  <button
                    type="button"
                    onClick={() => setIsEditingGuardian(true)}
                    className="text-xs px-2 py-0.5 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    Edit
                  </button>
                )}
              </div>
              {isMinor && ((!(student.guardianFullName || student.guardianName)) || !student.guardianPhone || !student.guardianEmail) && (
                <div className="mb-3 text-xs px-2 py-1 rounded bg-status-yellow-light dark:bg-status-yellow/20 text-status-yellow">
                  Guardian contact is recommended for minors. Please complete missing fields.
                </div>
              )}
              {!isEditingGuardian ? (
                <div className="space-y-2">
                  <DetailItem label="Guardian Name" value={student.guardianFullName || student.guardianName || 'N/A'} />
                  <DetailItem label="Guardian Phone" value={student.guardianPhone ? formatPhone(student.guardianPhone) : 'N/A'} copiable />
                  <DetailItem label="Guardian Email" value={student.guardianEmail || 'N/A'} copiable />
                  <DetailItem label="Guardian Facebook" value={student.guardianFacebook || 'N/A'} copiable makeUrlIfHttp />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-text-secondary dark:text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={gName}
                      onChange={e => setGName(e.target.value)}
                      className={control}
                      placeholder="Jane D. Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary dark:text-slate-400 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={gPhone}
                      onChange={e => setGPhone(e.target.value)}
                      className={`${control} ${errors.gPhone ? 'border-status-red' : ''}`}
                      placeholder="(555) 123-4567"
                    />
                    {errors.gPhone && <div className="text-xs text-status-red mt-1">{errors.gPhone}</div>}
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary dark:text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      value={gEmail}
                      onChange={e => setGEmail(e.target.value)}
                      className={control}
                      placeholder="guardian@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-secondary dark:text-slate-400 mb-1">Facebook (name or link)</label>
                    <input
                      type="text"
                      value={gFacebook}
                      onChange={e => setGFacebook(e.target.value)}
                      className={control}
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveGuardian}
                      className="text-xs px-3 py-1 rounded-md bg-brand-primary text-text-on-color"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsEditingGuardian(false); setGName(student.guardianFullName || student.guardianName || ''); setGPhone(student.guardianPhone || ''); setGEmail(student.guardianEmail || ''); setGFacebook(student.guardianFacebook || ''); setErrors({ ...errors, gPhone: undefined }); }}
                      className="text-xs px-3 py-1 rounded-md bg-surface-main dark:bg-slate-700/50 border border-surface-border dark:border-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </Card>

      {/* Enhanced Address Information Display */}
      {student.address && (student.address.addressLine1 || student.address.province) && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-text-primary dark:text-slate-100">Address Information</h3>
          </div>
          <div className="space-y-2 text-sm">
            {student.address.addressLine1 && (
              <p className="text-text-primary dark:text-slate-200">
                <span className="font-medium">Street:</span> {student.address.addressLine1}
              </p>
            )}
            {student.address.addressLine2 && (
              <p className="text-text-primary dark:text-slate-200">
                <span className="font-medium">Address Line 2:</span> {student.address.addressLine2}
              </p>
            )}
            {student.address.barangay && (
              <p className="text-text-primary dark:text-slate-200">
                <span className="font-medium">Barangay:</span> {student.address.barangay}
              </p>
            )}
            {student.address.city && (
              <p className="text-text-primary dark:text-slate-200">
                <span className="font-medium">City/Municipality:</span> {student.address.city}
              </p>
            )}
            {student.address.province && (
              <p className="text-text-primary dark:text-slate-200">
                <span className="font-medium">Province:</span> {student.address.province}
              </p>
            )}
            {student.address.country && (
              <p className="text-text-primary dark:text-slate-200">
                <span className="font-medium">Country:</span> {student.address.country}
              </p>
            )}
            {/* Complete Address */}
            <div className="mt-3 p-2 bg-surface-subtle dark:bg-slate-800 rounded-md">
              <p className="text-xs font-medium text-text-secondary dark:text-slate-400 mb-1">Complete Address:</p>
              <p className="text-sm text-text-primary dark:text-slate-200">
                {[
                  student.address.addressLine1,
                  student.address.addressLine2,
                  student.address.barangay && `Barangay ${student.address.barangay}`,
                  student.address.city,
                  student.address.province,
                  student.address.country
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Enhanced Guardian Information Display */}
      {student.secondaryGuardian && (student.secondaryGuardian.fullName || student.secondaryGuardian.phone) && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-text-primary dark:text-slate-100">Secondary Guardian</h3>
          </div>
          <div className="space-y-2 text-sm">
            {student.secondaryGuardian.fullName && (
              <DetailItem label="Name" value={student.secondaryGuardian.fullName} />
            )}
            {student.secondaryGuardian.relationship && (
              <DetailItem label="Relationship" value={student.secondaryGuardian.relationship} />
            )}
            {student.secondaryGuardian.phone && (
              <DetailItem 
                label="Phone" 
                value={student.secondaryGuardian.phone} 
                copiable={true}
              />
            )}
            {student.secondaryGuardian.email && (
              <DetailItem 
                label="Email" 
                value={student.secondaryGuardian.email} 
                copiable={true}
              />
            )}
            {student.secondaryGuardian.facebook && (
              <DetailItem label="Facebook" value={student.secondaryGuardian.facebook} makeUrlIfHttp={true} />
            )}
          </div>
        </Card>
      )}

      <Card className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-text-primary dark:text-slate-100">Scheduled Lessons</h3>
          <div className="flex items-center gap-2">
            <ThemedSelect
              value={lessonFilter}
              onChange={e => { setLessonFilter(e.target.value as 'all' | 'upcoming' | 'past'); setLessonPage(1); }}
              className="text-xs px-2 py-1"
            >
              <option value="all">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </ThemedSelect>
          </div>
        </div>
        {lessons.length > 0 ? (
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hidden">
            {filteredLessons.length === 0 ? (
              <p className="text-sm text-text-secondary dark:text-slate-400">No lessons for this filter.</p>
            ) : (
              <ul className="space-y-2">
                {pagedLessons.map(lesson => {
                  const instructor = instructorMap.get(lesson.instructorId);
                  // Use a regex replace to avoid timezone issues with `new Date()` from ISO string
                  const lessonDate = new Date(lesson.date.replace(/-/g, '/'));
                  return (
                    <li key={lesson.id} className="p-3 bg-surface-main dark:bg-slate-700/50 rounded-md border border-surface-border dark:border-slate-700">
                      <p className="text-sm font-semibold text-text-primary dark:text-slate-200">{lessonDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} at {lesson.time}</p>
                      <p className="text-xs text-text-secondary dark:text-slate-400">Instructor: {instructor?.name || 'N/A'}</p>
                      {lesson.notes && (
                        <p className="text-xs text-text-secondary dark:text-slate-400 mt-1 pt-1 border-t border-surface-border dark:border-slate-600">
                          <span className="font-medium">Note:</span> {lesson.notes}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-secondary dark:text-slate-400">No sessions scheduled.</p>
        )}
        {filteredLessons.length > 0 && (
          <div className="mt-2 flex items-center justify-between text-xs text-text-secondary dark:text-slate-400">
            <span>
              Page {lessonPage} of {totalLessonPages}
            </span>
            <div className="space-x-2">
              <button
                type="button"
                disabled={lessonPage <= 1}
                onClick={() => setLessonPage(p => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded border border-surface-border dark:border-slate-700 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={lessonPage >= totalLessonPages}
                onClick={() => setLessonPage(p => Math.min(totalLessonPages, p + 1))}
                className="px-2 py-0.5 rounded border border-surface-border dark:border-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
      
      <Card className="p-4 flex flex-col h-full">
        <h3 className="text-base font-semibold text-text-primary dark:text-slate-100 mb-3">Payment History</h3>
        {billings.length > 0 ? (
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-surface-border dark:border-slate-700">
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="pb-2 text-left text-xs font-medium text-text-secondary dark:text-slate-400 uppercase tracking-wider">Status / Paid By</th>
                </tr>
              </thead>
              <tbody>
                {pagedBills.map(bill => {
                  return (
                    <tr key={bill.id} className="border-b border-surface-border dark:border-slate-700 last:border-b-0">
                      <td className="py-2 text-sm text-text-secondary dark:text-slate-400">{new Date(bill.dateIssued).toLocaleDateString()}</td>
                      <td className="py-2 text-sm text-text-secondary dark:text-slate-400">{formatPHP(bill.amount)}</td>
                      <td className="py-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${
                            bill.status === 'paid' ? 'bg-status-green-light dark:bg-status-green/20 text-status-green' : 'bg-status-yellow-light dark:bg-status-yellow/20 text-status-yellow'
                          }`}>
                            <span className="capitalize">{bill.status}</span>
                          </span>
                          {bill.status === 'paid' ? (
                            <button
                              type="button"
                              title="View payment breakdown"
                              aria-label="View payment breakdown"
                              onClick={() => setShowBreakdown({ id: bill.id })}
                              className="p-1.5 rounded-full bg-surface-input dark:bg-slate-700 border border-surface-border dark:border-slate-600 text-text-secondary hover:bg-surface-main dark:hover:bg-slate-700/60"
                            >
                              {ICONS.info}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-text-secondary dark:text-slate-400">No billing history found.</p>
        )}
        {sortedBills.length > 0 && (
          <div className="mt-2 flex items-center justify-between text-xs text-text-secondary dark:text-slate-400">
            <span>Page {billingPage} of {totalBillingPages}</span>
            <div className="space-x-2">
              <button
                type="button"
                disabled={billingPage <= 1}
                onClick={() => setBillingPage(p => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded border border-surface-border dark:border-slate-700 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={billingPage >= totalBillingPages}
                onClick={() => setBillingPage(p => Math.min(totalBillingPages, p + 1))}
                className="px-2 py-0.5 rounded border border-surface-border dark:border-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Payment Breakdown Modal */}
      {showBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-label="Payment breakdown" onClick={() => setShowBreakdown(null)}>
          <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="rounded-xl border border-surface-border dark:border-slate-700 bg-surface-card dark:bg-slate-800 shadow-lg">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary dark:text-slate-100">Payment Breakdown</h3>
                    {(() => {
                      const bill = billings.find(b => b.id === showBreakdown.id);
                      return bill ? (
                        <p className="text-sm text-text-secondary dark:text-slate-400 mt-1">Invoice ID: {bill.id} • {new Date(bill.dateIssued).toLocaleDateString()}</p>
                      ) : null;
                    })()}
                  </div>
                  <button onClick={() => setShowBreakdown(null)} className="text-sm px-3 py-1.5 rounded-md bg-surface-input dark:bg-slate-700 border border-surface-border dark:border-slate-600">Close</button>
                </div>
                <div className="mt-4">
                  {(() => {
                    const bill = billings.find(b => b.id === showBreakdown.id);
                    if (!bill || !bill.payments || bill.payments.length === 0) return <div className="text-sm text-text-secondary dark:text-slate-400">No payments recorded.</div>;
                    return (
                      <ul className="divide-y divide-surface-border dark:divide-slate-700">
                        {bill.payments.map(p => (
                          <li key={p.id} className="py-2 flex items-center justify-between text-sm">
                            <div className="space-y-0.5">
                              <div className="font-medium text-text-primary dark:text-slate-100">{p.method}</div>
                              <div className="text-[11px] text-text-tertiary dark:text-slate-400">{new Date(p.date).toLocaleString()}</div>
                              {p.reference ? <div className="text-[11px] text-text-tertiary dark:text-slate-400">Ref: {p.reference}</div> : null}
                              {p.note ? <div className="text-[11px] text-text-tertiary dark:text-slate-400">Note: {p.note}</div> : null}
                            </div>
                            <div className="font-semibold">{formatPHP(Number(p.amount)||0)}</div>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
