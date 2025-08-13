// Avatar generation utilities for students
// Uses DiceBear API to generate consistent, beautiful avatars

export interface AvatarOptions {
  seed: string;
  style?: 'pixel-art' | 'lorelei' | 'notionists' | 'personas' | 'thumbs';
  size?: number;
  backgroundColor?: string[];
}

/**
 * Generates a consistent avatar URL based on student name
 * Uses DiceBear API pixel-art style to match existing student/teacher avatars
 */
export const generateAvatarUrl = (name: string, options?: Partial<AvatarOptions>): string => {
  const defaultOptions: AvatarOptions = {
    seed: name.toLowerCase().replace(/\s+/g, ''),
    style: 'pixel-art', // Same style as existing students/teachers
    size: 100,
    backgroundColor: []
  };

  const finalOptions = { ...defaultOptions, ...options };
  
  // Build DiceBear URL - same format as existing avatars
  const baseUrl = 'https://api.dicebear.com/8.x'; // Same version as existing avatars
  
  return `${baseUrl}/${finalOptions.style}/svg?seed=${finalOptions.seed}`;
};

/**
 * Generates multiple avatar options for a student
 * Uses different DiceBear styles that work well together
 */
export const generateAvatarOptions = (name: string): { style: string; url: string; preview: string }[] => {
  const styles = [
    { style: 'pixel-art', name: 'Pixel Art', description: 'Retro pixel-style avatars (default)' },
    { style: 'lorelei', name: 'Portrait', description: 'Beautiful illustrated portraits' },
    { style: 'notionists', name: 'Modern', description: 'Clean modern geometric style' },
    { style: 'personas', name: 'Character', description: 'Friendly character avatars' },
    { style: 'thumbs', name: 'Simple', description: 'Simple minimalist style' }
  ];

  return styles.map(({ style, name: styleName, description }) => ({
    style: styleName,
    url: generateAvatarUrl(name, { style: style as any }),
    preview: description
  }));
};

/**
 * Fallback avatar generation using initials and colored backgrounds
 * Used when DiceBear service is unavailable
 */
export const generateFallbackAvatar = (name: string): { initials: string; colorClass: string; textColorClass: string } => {
  const getInitials = (fullName: string) => {
    const names = fullName.split(' ').filter(Boolean);
    if (names.length === 0) return 'ST';
    if (names.length === 1) return names[0]!.charAt(0).toUpperCase();
    return (names[0]!.charAt(0) + names[names.length - 1]!.charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  
  // Color combinations that work well together
  const colorCombinations = [
    { bg: 'bg-red-100', text: 'text-red-800' },
    { bg: 'bg-blue-100', text: 'text-blue-800' },
    { bg: 'bg-green-100', text: 'text-green-800' },
    { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    { bg: 'bg-purple-100', text: 'text-purple-800' },
    { bg: 'bg-pink-100', text: 'text-pink-800' },
    { bg: 'bg-indigo-100', text: 'text-indigo-800' },
    { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    { bg: 'bg-orange-100', text: 'text-orange-800' },
    { bg: 'bg-teal-100', text: 'text-teal-800' }
  ];

  // Simple hash for consistent color selection
  const colorIndex = (name.charCodeAt(0) || 0) % colorCombinations.length;
  const colors = colorCombinations[colorIndex];

  return {
    initials,
    colorClass: colors.bg,
    textColorClass: colors.text
  };
};

/**
 * Check if an avatar URL is accessible
 * Used to validate generated avatar URLs
 */
export const validateAvatarUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Utility to update student avatar after enrollment
 * Can be used to refresh avatars or allow students to change them
 */
export const updateStudentAvatar = (studentId: string, avatarUrl: string, students: any[], setStudents: any) => {
  setStudents((prev: any[]) => 
    prev.map(student => 
      student.id === studentId 
        ? { ...student, profilePictureUrl: avatarUrl }
        : student
    )
  );
};

export default {
  generateAvatarUrl,
  generateAvatarOptions,
  generateFallbackAvatar,
  validateAvatarUrl,
  updateStudentAvatar
};
