import React from 'react';
import { BillingList } from '../components/BillingList';
import { useStudents, useBillings } from '../hooks/useSupabase';
import { mapBillingsToUi } from '../utils/mappers';

export const BillingPage: React.FC = () => {
  // Use proper Supabase queries instead of context
  const { data: students = [] } = useStudents();
  const { data: dbBillings = [] } = useBillings();
  
  // Convert database types to UI types
  const studentNameMap = students.reduce((acc, student) => {
    acc[student.id] = student.name;
    return acc;
  }, {} as Record<string, string>);
  
  const billings = mapBillingsToUi(dbBillings, studentNameMap);
  
  return <BillingList students={students} billings={billings} />;
};
