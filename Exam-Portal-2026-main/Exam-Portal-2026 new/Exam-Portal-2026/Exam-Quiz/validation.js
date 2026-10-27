/* Validation utilities */
const Validate = {
  email(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim()); },
  password(v) { return typeof v === 'string' && v.length >= 6; },
  required(v) { return v !== undefined && v !== null && String(v).trim().length > 0; },
};
