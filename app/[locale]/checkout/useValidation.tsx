// Validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Allow only digits, optionally with + at start, spaces, or dashes
  const phoneRegex = /^\+?[\d\s-]+$/;
  return phoneRegex.test(phone) && phone.replace(/[\s-]/g, "").length >= 6;
};

export const validateName = (name: string): boolean => {
  // Disallow special characters like §$%&/?*+°^><#
  const invalidCharsRegex = /[§$%&/?*+°^><#]/;
  return !invalidCharsRegex.test(name);
};