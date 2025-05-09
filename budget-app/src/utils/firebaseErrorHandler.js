/**
 * Converts Firebase authentication error codes to user-friendly messages
 * @param {Error} error - The error object from Firebase
 * @returns {string} - User-friendly error message
 */
export const getFirebaseAuthErrorMessage = (error) => {
    // Extract the error code from Firebase error
    const errorCode = error?.code || '';
    
    // Map of Firebase error codes to user-friendly messages
    const errorMessages = {
      // Authentication errors
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/user-not-found': 'No account found with this email. Please check your email or create a new account.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/email-already-in-use': 'This email is already registered. Please use a different email or try logging in.',
      'auth/weak-password': 'Password is too weak. Please use at least 6 characters with a mix of letters, numbers, and symbols.',
      'auth/operation-not-allowed': 'This login method is not enabled. Please contact support.',
      'auth/account-exists-with-different-credential': 'An account already exists with the same email but different sign-in credentials. Try signing in using a different method.',
      'auth/requires-recent-login': 'This operation requires a more recent login. Please log out and log back in to continue.',
      'auth/popup-closed-by-user': 'Login popup was closed before completing the sign in. Please try again.',
      'auth/popup-blocked': 'Login popup was blocked by your browser. Please allow popups for this website and try again.',
      'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later or reset your password.',
      'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
      'auth/internal-error': 'An error occurred. Please try again later.',
      'auth/invalid-verification-code': 'Invalid verification code. Please try again.',
      'auth/invalid-verification-id': 'Invalid verification. Please request a new verification code.',
      'auth/missing-verification-code': 'Please enter the verification code.',
      'auth/missing-verification-id': 'Verification information is missing. Please try again.',
      'auth/quota-exceeded': 'Service quota exceeded. Please try again later.',
      'auth/timeout': 'The operation has timed out. Please try again.',
      'auth/user-token-expired': 'Your session has expired. Please log in again.',
      'auth/web-storage-unsupported': 'Web storage is not supported by your browser. Please enable cookies or try a different browser.',
      'auth/invalid-password': 'Password must be at least 6 characters long.',
      'auth/invalid-phone-number': 'Please enter a valid phone number.',
      
      // Generic fallback
      'default': 'An error occurred during authentication. Please try again.'
    };
    
    // Return appropriate message or default message if error code is not mapped
    return errorMessages[errorCode] || errorMessages.default;
  };