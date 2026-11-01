
// Input validators for PGMate forms
// Returns error string if invalid, empty string if valid

export const validators = {
  email(value) {
    if (!value) return "Email is required.";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(value)) {
      return "Enter a valid email.";
    }

    return "";
  },

  password(value) {
    if (!value) return "Password is required.";

    if (value.length < 8) {
      return "Password must be at least 8 characters.";
    }

    return "";
  },

  passwordMatch(password, confirm) {
    if (password !== confirm) {
      return "Passwords do not match.";
    }

    return "";
  },

  budget(value) {
    if (value === "" || value === null) {
      return "Max budget is required.";
    }

    const num = Number(value);

    if (isNaN(num) || num < 0) {
      return "Budget must be a non-negative number.";
    }

    if (num > 1000000) {
      return "Budget must be <= 1,000,000.";
    }

    return "";
  },

  location(value) {
    if (!value || !value.trim()) {
      return "Location is required.";
    }

    if (value.length > 100) {
      return "Location must be <= 100 characters.";
    }

    return "";
  },

  confirmationCode(value) {
    if (!value) {
      return "Confirmation code is required.";
    }

    if (!/^\d{6}$/.test(value)) {
      return "Enter a 6-digit code.";
    }

    return "";
  },

  message(value) {
    if (!value || !value.trim()) {
      return "Message cannot be empty.";
    }

    if (value.length > 1000) {
      return "Message must be <= 1,000 characters.";
    }

    return "";
  },

  searchParams({ location, maxBudget }) {
    if (location === null || location === undefined) {
      location = "";
    }

    if (location.length > 100) {
      return "Location must be <= 100 characters.";
    }

    const budget = Number(maxBudget);

    if (isNaN(budget) || budget < 0) {
      return "Budget must be a non-negative number.";
    }

    if (budget > 1000000) {
      return "Budget must be <= 1,000,000.";
    }

    return "";
  },
};

export function getValidationError(errors, field) {
  return errors[field] || "";
}

export function isValidationError(error) {
  return error && typeof error === "string";
}
