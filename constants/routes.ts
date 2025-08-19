// Route constants for the application
export const ROUTES = {
  // Main navigation routes
  DASHBOARD: '/',
  ENROLLMENT: '/enrollment',
  TEACHERS: '/teachers',
  TEACHER_DETAIL: '/teachers/:id',
  STUDENTS: '/students', 
  STUDENT_DETAIL: '/students/:id',
  BILLING: '/billing',
  CHAT: '/chat',
  CHAT_CONVERSATION: '/chat/:conversationId',
  TRASH: '/trash',
  
  // Admin routes
  ADMIN: '/admin',
  
  // API routes (if needed)
  API: {
    STUDENTS: '/api/students',
    TEACHERS: '/api/teachers',
    LESSONS: '/api/lessons',
    BILLING: '/api/billing',
    CHAT: '/api/chat',
  }
} as const;

// Route parameter types
export interface RouteParams {
  id?: string;
  conversationId?: string;
}

// Navigation helper functions
export const createRoute = (route: string, params?: Record<string, string>) => {
  let path = route;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, value);
    });
  }
  return path;
};

// Route validation
export const isValidRoute = (path: string): boolean => {
  const allRoutes = Object.values(ROUTES).filter(route => typeof route === 'string');
  return allRoutes.some(route => {
    // Convert route patterns to regex for matching
    const pattern = route.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(path);
  });
};

// Extract route parameters
export const extractParams = (pattern: string, path: string): Record<string, string> => {
  const params: Record<string, string> = {};
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');
  
  patternParts.forEach((part, index) => {
    if (part.startsWith(':')) {
      const paramName = part.slice(1);
      params[paramName] = pathParts[index] || '';
    }
  });
  
  return params;
};
