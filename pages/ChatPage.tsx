import React from 'react';
import { ImprovedChat } from '../components/ImprovedChat';
import type { Instructor } from '../types';

interface ChatPageProps {
  instructors: Instructor[];
}

// For now, we'll assume the current user is admin
// In a real app, this would come from authentication context
const CURRENT_USER = {
  id: 'admin-1',
  name: 'Admin',
  type: 'admin' as const
};

export const ChatPage: React.FC<ChatPageProps> = ({ instructors }) => {
  return (
    <ImprovedChat instructors={instructors} currentUser={CURRENT_USER} />
  );
};
