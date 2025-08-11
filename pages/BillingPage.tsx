import React from 'react';
import BillingList from '../components/BillingList';
import { useApp } from '../context/AppContext';

export const BillingPage: React.FC = () => {
  const { students, billings } = useApp();
  // No prop handlers - BillingList will use AppContext handlers directly
  return <BillingList students={students} billings={billings} />;
};
