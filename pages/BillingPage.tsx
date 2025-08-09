import React from 'react';
import { BillingList } from '../components/BillingList';
import { useApp } from '../context/AppContext';

export const BillingPage: React.FC = () => {
  const { students, billings, handleRecordPayment } = useApp();
  return <BillingList students={students} billings={billings} onMarkAsPaid={id=>{}} onRecordPayment={handleRecordPayment} />;
};
