/**
 * Validation utilities for form fields
 * Provides reusable validation functions and regex patterns
 */

// Regex patterns
export const VALIDATION_PATTERNS = {
  // Email: standard email format
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Phone: Thai format 0XX-XXX-XXXX or 08X-XXX-XXXX
  PHONE_THAI: /^0[0-9]{1,2}-[0-9]{3,4}-[0-9]{4}$/,
  
  // Phone: International format with +
  PHONE_INTL: /^\+?[1-9]\d{1,14}$/,
  
  // URL: Basic URL format
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
};

// Validation functions
export const validations = {
  /**
   * Validate email format
   * @param email - Email address to validate
   * @returns true if email is valid
   */
  email: (email: string): boolean => {
    return VALIDATION_PATTERNS.EMAIL.test(email);
  },

  /**
   * Validate Thai phone number format
   * @param phone - Phone number to validate (format: 0XX-XXX-XXXX)
   * @returns true if phone is valid
   */
  phoneThai: (phone: string): boolean => {
    return VALIDATION_PATTERNS.PHONE_THAI.test(phone);
  },

  /**
   * Validate international phone number
   * @param phone - Phone number to validate
   * @returns true if phone is valid
   */
  phoneIntl: (phone: string): boolean => {
    return VALIDATION_PATTERNS.PHONE_INTL.test(phone);
  },

  /**
   * Validate phone number (Thai or International)
   * @param phone - Phone number to validate
   * @returns true if phone is valid in either format
   */
  phone: (phone: string): boolean => {
    return validations.phoneThai(phone) || validations.phoneIntl(phone);
  },

  /**
   * Validate URL format
   * @param url - URL to validate
   * @returns true if URL is valid
   */
  url: (url: string): boolean => {
    return VALIDATION_PATTERNS.URL.test(url);
  },

  /**
   * Validate text length
   * @param text - Text to validate
   * @param min - Minimum length (optional)
   * @param max - Maximum length (optional)
   * @returns true if text length is within range
   */
  textLength: (text: string, min?: number, max?: number): boolean => {
    const length = text.trim().length;
    if (min !== undefined && length < min) return false;
    if (max !== undefined && length > max) return false;
    return length > 0;
  },

  /**
   * Validate number is in range
   * @param num - Number to validate
   * @param min - Minimum value (optional)
   * @param max - Maximum value (optional)
   * @returns true if number is in range
   */
  numberRange: (num: number, min?: number, max?: number): boolean => {
    if (min !== undefined && num < min) return false;
    if (max !== undefined && num > max) return false;
    return true;
  },

  /**
   * Validate date is not in the past
   * @param dateString - Date string in YYYY-MM-DD format
   * @returns true if date is today or in future
   */
  dateNotPast: (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  },

  /**
   * Validate date is not in the future
   * @param dateString - Date string in YYYY-MM-DD format
   * @returns true if date is today or in past
   */
  dateNotFuture: (dateString: string): boolean => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date <= today;
  },

  /**
   * Validate date range (from <= to)
   * @param fromDate - Start date in YYYY-MM-DD format
   * @param toDate - End date in YYYY-MM-DD format
   * @returns true if from date is before or equal to to date
   */
  dateRange: (fromDate: string, toDate: string): boolean => {
    return new Date(fromDate) <= new Date(toDate);
  },

  /**
   * Validate time format HH:MM
   * @param time - Time string in HH:MM format
   * @returns true if time format is valid
   */
  time: (time: string): boolean => {
    const pattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return pattern.test(time);
  },

  /**
   * Validate time range (fromTime <= toTime)
   * @param fromTime - Start time in HH:MM format
   * @param toTime - End time in HH:MM format
   * @returns true if from time is before or equal to to time
   */
  timeRange: (fromTime: string, toTime: string): boolean => {
    const [fromH, fromM] = fromTime.split(':').map(Number);
    const [toH, toM] = toTime.split(':').map(Number);
    const fromTotalMinutes = fromH * 60 + fromM;
    const toTotalMinutes = toH * 60 + toM;
    return fromTotalMinutes <= toTotalMinutes;
  },
};

// React Hook Form validation objects for easy reuse
export const formValidations = {
  /**
   * Email field validation rules
   */
  email: {
    required: 'กรุณากรอกอีเมล',
    pattern: {
      value: VALIDATION_PATTERNS.EMAIL,
      message: 'กรุณากรอกอีเมลที่ถูกต้อง',
    },
  },

  /**
   * Phone field validation rules (Thai format)
   */
  phoneThai: {
    required: 'กรุณากรอกเบอร์โทรศัพท์',
    pattern: {
      value: VALIDATION_PATTERNS.PHONE_THAI,
      message: 'กรุณากรอกเบอร์โทรในรูปแบบ 0XX-XXX-XXXX',
    },
  },

  /**
   * Phone field validation rules (Thai or International)
   */
  phone: {
    required: 'กรุณากรอกเบอร์โทรศัพท์',
    validate: (value: string) => {
      if (validations.phone(value)) return true;
      return 'กรุณากรอกเบอร์โทรศัพท์ที่ถูกต้อง (0XX-XXX-XXXX หรือ +66...)';
    },
  },

  /**
   * Required field validation
   */
  required: (fieldName: string) => ({
    required: `กรุณากรอก${fieldName}`,
  }),

  /**
   * Text length validation
   */
  textLength: (fieldName: string, min: number, max: number) => ({
    required: `กรุณากรอก${fieldName}`,
    minLength: {
      value: min,
      message: `${fieldName}ต้องมีความยาวอย่างน้อย ${min} ตัวอักษร`,
    },
    maxLength: {
      value: max,
      message: `${fieldName}ต้องมีความยาวไม่เกิน ${max} ตัวอักษร`,
    },
  }),

  /**
   * Number range validation
   */
  numberRange: (fieldName: string, min: number, max: number) => ({
    required: `กรุณากรอก${fieldName}`,
    min: {
      value: min,
      message: `${fieldName}ต้องมีค่าอย่างน้อย ${min}`,
    },
    max: {
      value: max,
      message: `${fieldName}ต้องมีค่าไม่เกิน ${max}`,
    },
  }),

  /**
   * Date not past validation
   */
  dateNotPast: (fieldName: string) => ({
    required: `กรุณาเลือก${fieldName}`,
    validate: (value: string) => {
      if (validations.dateNotPast(value)) return true;
      return `${fieldName}ต้องเป็นวันนี้หรือวันข้างหน้า`;
    },
  }),

  /**
   * Date not future validation
   */
  dateNotFuture: (fieldName: string) => ({
    required: `กรุณาเลือก${fieldName}`,
    validate: (value: string) => {
      if (validations.dateNotFuture(value)) return true;
      return `${fieldName}ต้องเป็นวันนี้หรือวันที่ผ่านมา`;
    },
  }),

  /**
   * Time format validation
   */
  time: (fieldName: string) => ({
    validate: (value: string) => {
      if (!value || validations.time(value)) return true;
      return `${fieldName}ต้องเป็นรูปแบบ HH:MM`;
    },
  }),
};

export default {
  VALIDATION_PATTERNS,
  validations,
  formValidations,
};
