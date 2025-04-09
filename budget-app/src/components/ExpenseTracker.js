import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './ExpenseTracker.css';
import { useUserCurrency } from '../hooks/useUserCurrency';
import { formatCurrency } from '../utils/formatCurrency';

export default function ExpenseTracker() {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('expense');
  const [transactions, setTransactions] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'expense', 'income'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  const { currency } = useUserCurrency();

  // Form states
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  // Fetch transactions from Firestore
  useEffect(() => {
    if (!auth.currentUser) return;

    const collections = [
      { name: 'expenses', type: 'expense' },
      { name: 'income', type: 'income' },
    ];

    const unsubscribes = collections.map(({ name, type }) => {
      const q = query(collection(db, name), where('userId', '==', auth.currentUser.uid));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          type,
          ...doc.data(),
        }));
        setTransactions(prev => {
          const otherTypeData = prev.filter(t => t.type !== type);
          return [...otherTypeData, ...data];
        });
      }, (error) => console.error(`Error fetching ${name}:`, error));
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  // Sorted and filtered transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions;
    if (filter !== 'all') {
      result = transactions.filter(t => t.type === filter);
    }
    return result.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [transactions, filter, sortOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');

      const data = {
        amount: parseFloat(amount),
        date: date || new Date().toISOString().split('T')[0],
        userId: auth.currentUser.uid,
        category,
        description,
      };

      await addDoc(collection(db, formType === 'expense' ? 'expenses' : 'income'), data);

      setAmount('');
      setCategory('');
      setDate('');
      setDescription('');
      setShowForm(false);
    } catch (error) {
      console.error(`Error adding ${formType}:`, error);
    }
  };

  const handleDelete = async (id, type) => {
    try {
      await deleteDoc(doc(db, type === 'expense' ? 'expenses' : 'income', id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const openForm = (type) => {
    setFormType(type);
    setShowForm(true);
  };

  return (
    <div className="expense-tracker-container">
      {/* <header className="header">
        <h1>Transaction History</h1>
        <p>Track your financial past</p>
      </header> */}

      <div className="controls">
        <div className="filter-group">
          <label htmlFor="filter">Filter:</label>
          <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="sort-group">
          <label htmlFor="sort">Sort by Date:</label>
          <select id="sort" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <p className="no-transactions">No transactions found.</p>
        ) : (
          filteredTransactions.map((transaction) => (
            <div
              key={`${transaction.type}-${transaction.id}`}
              className={`transaction-item ${transaction.type}`}
              role="listitem"
            >
              <div className="transaction-info">
                <h3>{transaction.category}</h3>
                <p>{transaction.description || 'No description'}</p>
                <p className="transaction-date">{formatDate(transaction.date)}</p>
              </div>
              <div className="transaction-actions">
                <p className="transaction-amount">
                  {transaction.type === 'expense' ? '-' : '+'}
                  {formatCurrency(transaction.amount, currency)}
                </p>
                <button
                  className="delete-button"
                  onClick={() => setConfirmDelete({ id: transaction.id, type: transaction.type })}
                  aria-label={`Delete ${transaction.type}`}
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

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

      {showForm && (
        <div className="modal-overlay" role="dialog" aria-labelledby="form-title">
          <div className="modal-content">
            <h3 id="form-title">Add {formType === 'expense' ? 'Expense' : 'Income'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="amount">Amount ({currency})</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">{formType === 'expense' ? 'Category' : 'Source'}</label>
                <input
                  id="category"
                  type="text"
                  placeholder={formType === 'expense' ? 'Category' : 'Source'}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <input
                  id="description"
                  type="text"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-button" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className={formType === 'expense' ? 'submit-button' : 'income-submit-button'}>
                  Add {formType === 'expense' ? 'Expense' : 'Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" role="dialog" aria-labelledby="delete-title">
          <div className="modal-content delete-confirmation">
            <h3 id="delete-title">Confirm Delete</h3>
            <p>Are you sure you want to delete this {confirmDelete.type}?</p>
            <div className="form-actions">
              <button className="cancel-button" onClick={() => setConfirmDelete(null)}>
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