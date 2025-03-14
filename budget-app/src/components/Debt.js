import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useUserCurrency } from '../hooks/useUserCurrency'; // Custom hook to fetch currency
import { formatCurrency } from '../utils/formatCurrency'; // Utility to format monetary values
import './Debt.css';

export default function Debt() {
  const [debts, setDebts] = useState([]);
  const [newDebt, setNewDebt] = useState({
    lenderName: '',
    initialAmount: '',
    currentBalance: '',
    interestRate: '',
    monthlyPayment: '',
    dueDate: '',
    notes: '',
    category: 'personal'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [showCompleted, setShowCompleted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);

  const { currency, loading: currencyLoading } = useUserCurrency(); // Fetch user's currency

  useEffect(() => {
    if (!auth.currentUser) {
      setError('Please log in to view your debts.');
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'debts'), where('userId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const debtsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDebts(debtsData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching debts:', err);
        setError('Failed to load debts: ' + err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Wait for currency to load
  if (currencyLoading) {
    return <div>Loading currency...</div>;
  }

  const formatDateForStorage = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      throw new Error('Invalid date format');
    }
  };

  const addDebt = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      setError('Please log in to add a debt.');
      return;
    }

    try {
      const formattedDueDate = formatDateForStorage(newDebt.dueDate);
      const debtData = {
        ...newDebt,
        userId: auth.currentUser.uid,
        initialAmount: parseFloat(newDebt.initialAmount) || 0,
        currentBalance: parseFloat(newDebt.currentBalance) || 0,
        interestRate: parseFloat(newDebt.interestRate) || 0,
        monthlyPayment: parseFloat(newDebt.monthlyPayment) || 0,
        dueDate: formattedDueDate,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'debts'), debtData);
      setNewDebt({
        lenderName: '',
        initialAmount: '',
        currentBalance: '',
        interestRate: '',
        monthlyPayment: '',
        dueDate: '',
        notes: '',
        category: 'personal'
      });
      setError(null);
      setSuccessMessage('Debt added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAddDebtModal(false);
    } catch (error) {
      console.error('Error adding debt:', error);
      setError('Failed to add debt: ' + error.message);
    }
  };

  const handlePayment = async (debtId, monthlyPayment, currentBalance, dueDate) => {
    const newBalance = currentBalance - monthlyPayment;
    const debtRef = doc(db, 'debts', debtId);
    try {
      if (newBalance <= 0) {
        await updateDoc(debtRef, {
          currentBalance: 0,
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        setSuccessMessage('Debt fully paid off! Congratulations!');
      } else {
        const currentDueDate = new Date(dueDate);
        currentDueDate.setMonth(currentDueDate.getMonth() + 1);
        const newDueDateFormatted = formatDateForStorage(currentDueDate);

        await updateDoc(debtRef, {
          currentBalance: newBalance,
          dueDate: newDueDateFormatted,
          lastPaymentDate: new Date().toISOString()
        });
        setSuccessMessage('Payment recorded successfully!');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating debt:', error);
      setError('Failed to update debt: ' + error.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const calculateDebtSummary = () => {
    const activeDebts = debts.filter(debt => debt.status === 'active');
    const totalDebt = activeDebts.reduce((sum, debt) => sum + debt.currentBalance, 0);
    const totalMonthlyPayments = activeDebts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
    let debtFreeDate = new Date();
    if (totalMonthlyPayments > 0) {
      const monthsToPayoff = Math.ceil(totalDebt / totalMonthlyPayments);
      debtFreeDate.setMonth(debtFreeDate.getMonth() + monthsToPayoff);
    } else {
      debtFreeDate = null;
    }
    return { totalDebt, totalMonthlyPayments, debtFreeDate, totalDebts: activeDebts.length };
  };

  const getSortedFilteredDebts = () => {
    let filteredDebts;
    if (showCompleted) {
      filteredDebts = debts.filter(debt => debt.status === 'completed');
    } else {
      filteredDebts = debts.filter(debt => debt.status === 'active');
    }
    
    if (filter !== 'all') {
      filteredDebts = filteredDebts.filter(debt => debt.category === filter);
    }
    
    return filteredDebts.sort((a, b) => {
      if (sortBy === 'dueDate') return new Date(a.dueDate) - new Date(b.dueDate);
      if (sortBy === 'amount') return b.currentBalance - a.currentBalance;
      if (sortBy === 'interest') return b.interestRate - a.interestRate;
      return 0;
    });
  };

  const calculateProgress = (debt) => {
    const paid = debt.initialAmount - debt.currentBalance;
    return (paid / debt.initialAmount) * 100;
  };

  const isDueSoon = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const debtSummary = calculateDebtSummary();
  const sortedFilteredDebts = getSortedFilteredDebts();

  return (
    <div className="debt-container">
      <h1>Debt Management Dashboard</h1>
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your debts...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <>
          {successMessage && <div className="success-message">{successMessage}</div>}
          <div className="debt-summary">
            <div className="summary-card total-debt">
              <h3>Total Debt</h3>
              <div className="summary-value">{formatCurrency(debtSummary.totalDebt, currency)}</div>
            </div>
            <div className="summary-card monthly-payments">
              <h3>Monthly Payments</h3>
              <div className="summary-value">{formatCurrency(debtSummary.totalMonthlyPayments, currency)}</div>
            </div>
            <div className="summary-card debt-free-date">
              <h3>Est. Debt-Free Date</h3>
              <div className="summary-value">
                {debtSummary.debtFreeDate ? debtSummary.debtFreeDate.toLocaleDateString('en-IN', {
                  month: 'long',
                  year: 'numeric'
                }) : 'N/A'}
              </div>
            </div>
          </div>
          <div className="debt-page-content">
            <div className="debt-list-container">
              <div className="debt-list-header">
                <h2>Your Debts ({sortedFilteredDebts.length})</h2>
                <div className="debt-list-controls">
                  <div className="control-group">
                    <label>Filter:</label>
                    <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                      <option value="all">All Categories</option>
                      <option value="personal">Personal</option>
                      <option value="credit">Credit Card</option>
                      <option value="student">Student Loan</option>
                      <option value="mortgage">Mortgage</option>
                      <option value="auto">Auto Loan</option>
                      <option value="medical">Medical</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="control-group">
                    <label>Sort By:</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="dueDate">Due Date</option>
                      <option value="amount">Amount</option>
                      <option value="interest">Interest Rate</option>
                    </select>
                  </div>
                  <div className="control-group checkbox-group">
                    <label>
                      <input type="checkbox" checked={showCompleted} onChange={(e) => setShowCompleted(e.target.checked)} />
                      Show Completed
                    </label>
                  </div>
                </div>
              </div>
              <div className="debt-list">
                {sortedFilteredDebts.length > 0 ? (
                  sortedFilteredDebts.map(debt => (
                    <div key={debt.id} className={`debt-item ${debt.status === 'completed' ? 'completed-debt' : ''}`}>
                      <div className="debt-item-header">
                        <h3>{debt.lenderName}</h3>
                        {debt.status === 'completed' && <span className="status-badge completed">PAID OFF</span>}
                        {isDueSoon(debt.dueDate) && debt.status !== 'completed' && <span className="status-badge due-soon">DUE SOON</span>}
                      </div>
                      <div className="debt-item-category">{debt.category || 'uncategorized'}</div>
                      <div className="progress-container">
                        <div className="progress-bar-container">
                          <div className="progress-bar" style={{ width: `${calculateProgress(debt)}%` }}></div>
                        </div>
                        <div className="progress-text">
                          {Math.round(calculateProgress(debt))}% Paid (
                          {formatCurrency(debt.initialAmount - debt.currentBalance, currency)} of 
                          {formatCurrency(debt.initialAmount, currency)})
                        </div>
                      </div>
                      <div className="debt-details">
                        <div className="detail-row">
                          <span className="detail-label">Balance:</span>
                          <span className="detail-value amount">{formatCurrency(debt.currentBalance, currency)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Interest:</span>
                          <span className="detail-value">
                            {debt.interestRate}%
                            {debt.interestRate > 10 && <span className="tag high-interest">High</span>}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Payment:</span>
                          <span className="detail-value">{formatCurrency(debt.monthlyPayment, currency)}/mo</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Due:</span>
                          <span className="detail-value">
                            {new Date(debt.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {debt.status !== 'completed' && (
                        <button 
                          className="pay-button" 
                          onClick={() => handlePayment(debt.id, debt.monthlyPayment, debt.currentBalance, debt.dueDate)}
                        >
                          Payed ({formatCurrency(debt.monthlyPayment, currency)})
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">🎉</div>
                    <p>No debts to display. {showCompleted ? 'You have no completed debts.' : 'Add a new debt to start tracking!'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button className="add-debt-button" onClick={() => setShowAddDebtModal(true)}>Add Debt</button>
          {showAddDebtModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Add New Debt</h2>
                <form onSubmit={addDebt}>
                  <div className="form-group">
                    <label htmlFor="lenderName">Lender Name</label>
                    <input 
                      id="lenderName" 
                      type="text" 
                      placeholder="e.g., HDFC Bank" 
                      value={newDebt.lenderName} 
                      onChange={(e) => setNewDebt({ ...newDebt, lenderName: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <select 
                      id="category" 
                      value={newDebt.category} 
                      onChange={(e) => setNewDebt({ ...newDebt, category: e.target.value })}
                    >
                      <option value="personal">Personal Loan</option>
                      <option value="credit">Credit Card</option>
                      <option value="student">Student Loan</option>
                      <option value="mortgage">Mortgage</option>
                      <option value="auto">Auto Loan</option>
                      <option value="medical">Medical Debt</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="initialAmount">Initial Amount ({currency})</label>
                      <input 
                        id="initialAmount" 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g., 10000.00" 
                        value={newDebt.initialAmount} 
                        onChange={(e) => setNewDebt({ ...newDebt, initialAmount: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="currentBalance">Current Balance ({currency})</label>
                      <input 
                        id="currentBalance" 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g., 10000.00" 
                        value={newDebt.currentBalance} 
                        onChange={(e) => setNewDebt({ ...newDebt, currentBalance: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="interestRate">Interest Rate (%)</label>
                      <input 
                        id="interestRate" 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g., 5.5" 
                        value={newDebt.interestRate} 
                        onChange={(e) => setNewDebt({ ...newDebt, interestRate: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="monthlyPayment">Monthly Payment ({currency})</label>
                      <input 
                        id="monthlyPayment" 
                        type="number" 
                        step="0.01" 
                        placeholder="e.g., 250.00" 
                        value={newDebt.monthlyPayment} 
                        onChange={(e) => setNewDebt({ ...newDebt, monthlyPayment: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="dueDate">Next Due Date</label>
                    <input 
                      id="dueDate" 
                      type="date" 
                      value={newDebt.dueDate} 
                      onChange={(e) => setNewDebt({ ...newDebt, dueDate: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="notes">Notes</label>
                    <textarea 
                      id="notes" 
                      placeholder="Additional details (optional)" 
                      value={newDebt.notes} 
                      onChange={(e) => setNewDebt({ ...newDebt, notes: e.target.value })} 
                      rows="4"
                    ></textarea>
                  </div>
                  <button type="submit">Add Debt</button>
                  <button type="button" className="close-modal-button" onClick={() => setShowAddDebtModal(false)}>Close</button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}