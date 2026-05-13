/**
 * KYC Components - Shared constants and utilities
 */

export const KYC_STEPS = ['Intro', 'Personal', 'ID Upload', 'Selfie'];

export const ID_TYPES = [
  { value: 'International Passport', label: 'International Passport' },
  { value: 'Drivers Licence', label: "Driver's Licence" },
  { value: 'Voters Card', label: "Voter's Card" },
  { value: 'NIN', label: 'NIN' },
  { value: 'BVN', label: 'BVN' },
];

/**
 * Validate personal info step
 */
export const validatePersonalInfo = (form) => {
  const errors = {};

  if (!form.full_name?.trim()) {
    errors.full_name = 'Full name is required.';
  }

  if (form.date_of_birth) {
    const dob = new Date(form.date_of_birth);
    if (isNaN(dob.getTime())) {
      errors.date_of_birth = 'Invalid date.';
    } else {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const hasHadBirthdayThisYear =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
      if (!hasHadBirthdayThisYear) age -= 1;
      if (age < 18) {
        errors.date_of_birth = 'You must be at least 18 years old.';
      }
    }
  }

  if (form.bvn && !/^\d{11}$/.test(form.bvn.trim())) {
    errors.bvn = 'BVN must be exactly 11 digits.';
  }

  if (form.nin && !/^\d{11}$/.test(form.nin.trim())) {
    errors.nin = 'NIN must be exactly 11 digits.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/**
 * Validate ID document step
 */
export const validateIdDocument = (form) => {
  const errors = {};

  if (!form.id_type) {
    errors.id_type = 'Please select an ID type.';
  }

  if (!form.id_number?.trim()) {
    errors.id_number = 'ID number is required.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/**
 * Validate selfie step
 */
export const validateSelfie = (form) => {
  const errors = {};

  if (!form.selfie_url) {
    errors.selfie_url = 'Please upload a selfie photo.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
};
