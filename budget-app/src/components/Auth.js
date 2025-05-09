import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from '../firebase';
import { getFirebaseAuthErrorMessage } from '../utils/firebaseErrorHandler';
import './Auth.css';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        // Login with email/password
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          setError('Please verify your email before logging in.');
          
          // Option to resend verification email
          const resendConfirm = window.confirm('Email not verified. Would you like to resend the verification email?');
          if (resendConfirm) {
            await sendEmailVerification(user);
            setError('Verification email resent! Please check your inbox.');
          }
          
          await auth.signOut();
          setLoading(false);
          return;
        }
        
        // Successful login
        navigate('/dashboard');
      } else {
        // Register new account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        try {
          // Send verification email
          await sendEmailVerification(user);
          setError('Verification email sent! Please check your inbox and verify your email before logging in.');
          setIsLogin(true); // Switch back to login view
        } catch (verificationError) {
          // This can happen if Firebase thinks the email might be suspicious
          console.error("Email verification error:", verificationError);
          setError(getFirebaseAuthErrorMessage(verificationError));
          
          // Delete the account if we can't verify it
          try {
            await user.delete();
          } catch (deleteError) {
            console.error("Error deleting unverified account:", deleteError);
          }
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      
      // Use the error handler to get a user-friendly message
      setError(getFirebaseAuthErrorMessage(err));
    }
    
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Google sign-in successful
      navigate('/dashboard');
    } catch (err) {
      console.error("Google sign-in error:", err);
      setError(getFirebaseAuthErrorMessage(err));
    }
    
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password');
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent! Check your inbox.');
    } catch (err) {
      console.error("Password reset error:", err);
      setError(getFirebaseAuthErrorMessage(err));
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        
        <div className="divider">
          <span>OR</span>
        </div>
        
        <button 
          className="google-button"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <img 
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" 
            alt="Google"
            className="google-icon" 
          />
          Continue with Google
        </button>
        
        <button 
          className="toggle-auth"
          onClick={() => setIsLogin(!isLogin)}
          disabled={loading}
        >
          {isLogin ? 'Create new account' : 'Already have an account?'}
        </button>
        
        {isLogin && (
          <button 
            className="forgot-password"
            onClick={handlePasswordReset}
            disabled={loading || !email}
          >
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}