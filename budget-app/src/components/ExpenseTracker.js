import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './ExpenseTracker.css';
import { useUserCurrency } from '../hooks/useUserCurrency';
import { formatCurrency } from '../utils/formatCurrency';

export default function ExpenseTracker() {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('expense'); // 'expense' or 'income'
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Get user's currency preference
  const { currency } = useUserCurrency();

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  // Fetch expenses and income from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch expenses
    const qExpenses = query(
      collection(db, 'expenses'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
    });

    // Fetch income
    const qIncome = query(
      collection(db, 'income'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeIncome = onSnapshot(qIncome, (snapshot) => {
      const incomeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setIncome(incomeData);
    });

    return () => {
      unsubscribeExpenses();
      unsubscribeIncome();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }

      const data = {
        amount: parseFloat(amount),
        date: date || new Date().toISOString().split('T')[0], // Store as string (YYYY-MM-DD)
        userId: auth.currentUser.uid,
        category,
        description,
      };

      // Add to appropriate collection based on form type
      const collectionName = formType === 'expense' ? 'expenses' : 'income';
      await addDoc(collection(db, collectionName), data);

      // Reset form
      setAmount('');
      setCategory('');
      setDate('');
      setDescription('');
      setShowForm(false);
    } catch (error) {
      console.error(`Error adding ${formType}:`, error);
    }
  };

  // Function to delete an expense or income
  const handleDelete = async (id, type) => {
    try {
      await deleteDoc(doc(db, type === 'expense' ? 'expenses' : 'income', id));
      setConfirmDelete(null); // Reset confirmation state
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(); // Format as MM/DD/YYYY
  };

  // Show form with specified type
  const openForm = (type) => {
    setFormType(type);
    setShowForm(true);
  };

  return (
    <div className="expense-tracker-container">
      <header className="header">
        <h1>Expense Tracker</h1>
        <p>Manage your expenses and income efficiently</p>
      </header>

      <div className="dashboard-layout">
        {/* Left side - Expenses List */}
        <div className="expenses-panel">
          <h2>Your Expenses</h2>
          {expenses.length === 0 ? (
            <p className="no-expenses">No expenses added yet.</p>
          ) : (
            <div className="expenses-list">
              {expenses.map((expense) => (
                <div key={expense.id} className="expense-item">
                  <div className="expense-info">
                    <h3>{expense.category}</h3>
                    <p>{expense.description}</p>
                    <p className="expense-date">{formatDate(expense.date)}</p>
                  </div>
                  <div className="expense-actions">
                    <div className="expense-amount">
                      <p>-{formatCurrency(expense.amount, currency)}</p>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => setConfirmDelete({ id: expense.id, type: 'expense' })}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right side - Income List */}
        <div className="income-panel">
          <h2>Your Income</h2>
          {income.length === 0 ? (
            <p className="no-income">No income added yet.</p>
          ) : (
            <div className="income-list">
              {income.map((incomeItem) => (
                <div key={incomeItem.id} className="income-item">
                  <div className="income-info">
                    <h3>{incomeItem.category}</h3>
                    <p>{incomeItem.description}</p>
                    <p className="income-date">{formatDate(incomeItem.date)}</p>
                  </div>
                  <div className="income-actions">
                    <div className="income-amount">
                      <p>+{formatCurrency(incomeItem.amount, currency)}</p>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => setConfirmDelete({ id: incomeItem.id, type: 'income' })}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions Menu */}
      <div className="actions-menu">
        <button className="add-button income-button" onClick={() => openForm('income')}>
          <span className="button-icon">+</span>
          <span className="button-label">Income</span>
        </button>
        <button className="add-button expense-button" onClick={() => openForm('expense')}>
          <span className="button-icon">+</span>
          <span className="button-label">Expense</span>
        </button>
      </div>

      {/* Modal Overlay for Adding Expense/Income */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add {formType === 'expense' ? 'Expense' : 'Income'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  placeholder={formType === 'expense' ? "Category" : "Source"}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className={formType === 'expense' ? "submit-button" : "income-submit-button"}>
                  Add {formType === 'expense' ? 'Expense' : 'Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-content delete-confirmation">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this {confirmDelete.type}?</p>
            <div className="form-actions">
              <button
                className="cancel-button"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="delete-confirm-button"
                onClick={() => handleDelete(confirmDelete.id, confirmDelete.type)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}