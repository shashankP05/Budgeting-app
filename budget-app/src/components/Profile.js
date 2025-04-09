import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { FaEdit, FaSave, FaTimes, FaUser, FaEnvelope, FaSignOutAlt, FaMoneyBillWave } from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const navigate = useNavigate();

  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'];

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError('Please sign in to view your profile');
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(userData);
          setName(userData.name || '');
          setEmail(userData.email || currentUser.email || '');
          setCurrency(userData.currency || '');
        } else {
          const newUserData = {
            name: '',
            email: currentUser.email || '',
            currency: '',
            createdAt: new Date(),
          };
          await setDoc(userDocRef, newUserData);
          setUser(newUserData);
          setName(newUserData.name);
          setEmail(newUserData.email);
          setCurrency(newUserData.currency);
        }

        // Fetch expense data
        const expensesQuery = query(
          collection(db, 'expenses'),
          where('userId', '==', currentUser.uid)
        );
        const expensesSnapshot = await getDocs(expensesQuery);
        const expenses = expensesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate total expenses
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        setTotalExpenses(total);

        // Calculate monthly average
        if (expenses.length > 0) {
          const earliestDate = new Date(
            Math.min(...expenses.map(expense => new Date(expense.date).getTime()))
          );
          const currentDate = new Date();
          const monthsDiff =
            (currentDate.getFullYear() - earliestDate.getFullYear()) * 12 +
            (currentDate.getMonth() - earliestDate.getMonth()) +
            1;
          const average = total / (monthsDiff || 1);
          setMonthlyAverage(average);
        } else {
          setMonthlyAverage(0);
        }
      } catch (error) {
        setError('Failed to load profile or expenses: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('Please sign in to update your profile');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, { 
        name, 
        email, 
        currency 
      });
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      setUser((prevUser) => ({
        ...prevUser,
        name,
        email,
        currency,
      }));
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      setError('Failed to update profile: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/auth');
    } catch (error) {
      setError('Failed to logout: ' + error.message);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="skeleton-loader" aria-label="Loading profile data" />
      </div>
    );
  }

  return (
    <div className="profile-page" role="main">
      {/* <header className="profile-header" aria-label="Profile header">
        <h1>Profile</h1>
        <p className="subtitle">Manage your personal information</p>
      </header> */}

      <section className="profile-card" aria-label="Profile details">
        <div
          className="avatar-placeholder"
          aria-label={`User avatar with initial ${name ? name[0].toUpperCase() : 'U'}`}
        >
          {name ? name[0].toUpperCase() : 'U'}
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="success-message" role="alert">
            {success}
          </div>
        )}

        {editMode ? (
          <form onSubmit={handleUpdateProfile} className="edit-form" noValidate>
            <div className="form-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                aria-required="true"
              />
            </div>
            <div className="form-field1">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                aria-required="true"
                disabled
              />
            </div>
            <div className="form-field">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                required
                aria-required="true"
              >
                <option value="">Select a currency</option>
                {supportedCurrencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setEditMode(false)}
                aria-label="Cancel editing profile"
              >
                <FaTimes /> Cancel
              </button>
              <button type="submit" className="save-btn" aria-label="Save profile changes">
                <FaSave /> Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details" aria-label="View profile details">
            <div className="detail-item highlighted">
              <span className="label" aria-label="Name label">
                <FaUser /> Name
              </span>
              <span className="value" aria-label="Name value">
                {user?.name || 'Not set'}
              </span>
            </div>
            <div className="detail-item highlighted">
              <span className="label" aria-label="Email label">
                <FaEnvelope /> Email
              </span>
              <span className="value" aria-label="Email value">
                {user?.email || 'Not set'}
              </span>
            </div>
            <div className="detail-item highlighted">
              <span className="label" aria-label="Currency label">
                <FaMoneyBillWave /> Currency
              </span>
              <span className="value" aria-label="Currency value">
                {user?.currency || 'Not set'}
              </span>
            </div>
            <div className="button-group">
              <button
                className="edit-btn"
                onClick={() => setEditMode(true)}
                aria-label="Edit profile"
              >
                <FaEdit /> Edit Profile
              </button>
              <button
                className="logout-btn"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        )}
      </section>

      {totalExpenses > 0 && (
        <section className="stats-card" aria-label="Expense statistics">
          <h2>Expense Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item" aria-label="Total expenses">
              <span className="stat-label">Total Expenses</span>
              <span className="stat-value">{formatCurrency(totalExpenses)}</span>
            </div>
            <div className="stat-item" aria-label="Monthly average">
              <span className="stat-label">Monthly Average</span>
              <span className="stat-value">{formatCurrency(monthlyAverage)}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Profile;