

import type { Student, Instructor, Lesson } from '../types';
import { DAYS_OF_WEEK, DAYS_OF_WEEK_FULL, TIME_SLOTS, ROOM_COUNT, toYYYYMMDD, LUNCH_BREAK_TIME } from '../constants';
import { addMinutes } from '../utils/time';

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const generateSchedules = (
  students: Student[],
  instructors: Instructor[]
): { lessons: Lesson[]; students: Student[] } => {
  
  const studentsWithInstructors = students.map((student, index) => ({
    ...student,
    instructorId: instructors[index % instructors.length].id,
  }));

  let allWeeklySlots: { day: string; time: string; }[] = [];
  for (const day of DAYS_OF_WEEK) {
    for (const time of TIME_SLOTS) {
      if (time === LUNCH_BREAK_TIME) continue;
      allWeeklySlots.push({ day, time });
    }
  }

  allWeeklySlots = shuffleArray(allWeeklySlots);

  const lessons: Lesson[] = [];
  const instructorSchedule: Record<string, boolean> = {}; // { "instructorId-day-time": true }
  const roomSchedule: Record<string, number> = {}; // { "day-time": count }
  const studentDaySchedule: Record<string, boolean> = {}; // { "studentId-day": true }

  for (const student of studentsWithInstructors) {
    let slotFound = false;
    for (const slot of allWeeklySlots) {
      const instructorId = student.instructorId!;
      const timeKey = `${slot.day}-${slot.time}`;
      const instructorKey = `${instructorId}-${timeKey}`;
      const roomCountForSlot = roomSchedule[timeKey] || 0;
      const studentDayKey = `${student.id}-${slot.day}`;

      if (!instructorSchedule[instructorKey] && roomCountForSlot < ROOM_COUNT && !studentDaySchedule[studentDayKey]) {
        instructorSchedule[instructorKey] = true;
        roomSchedule[timeKey] = roomCountForSlot + 1;
        studentDaySchedule[studentDayKey] = true;
        const roomId = roomCountForSlot + 1;

        // Generate lessons for the next 12 weeks
        const today = new Date();
        for (let week = 0; week < 12; week++) {
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const lessonDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (week * 7) + dayOffset);
            if (DAYS_OF_WEEK_FULL[lessonDate.getDay()] === slot.day) {
              const dateString = toYYYYMMDD(lessonDate);
              lessons.push({
                id: `lesson-${student.id}-${dateString}-${slot.time}`,
                studentId: student.id,
                instructorId,
                roomId,
                date: dateString,
                time: slot.time,
                endTime: addMinutes(slot.time, 60),
                notes: '',
                status: 'scheduled',
              });
              break; // Found the right day in this week, move to next week
            }
          }
        }
        
        slotFound = true;
        break; 
      }
    }

    if (!slotFound) {
      console.warn(`Could not find a schedule slot for student ${student.name}`);
    }
  }

  return { lessons, students: studentsWithInstructors };
};
