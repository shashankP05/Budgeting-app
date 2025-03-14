import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SplashScreen.css';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/auth'), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <div className="loading-spinner"></div>
      <h1>Budget Tracker</h1>
    </div>
  );
}