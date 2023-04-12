export const generateSessionId = () => {
  return `session-${Date.now()}`;
};

export const generateUserId = () => {
    return `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  };