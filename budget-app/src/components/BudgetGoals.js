import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useUserCurrency } from '../hooks/useUserCurrency';
import { formatCurrency } from '../utils/formatCurrency';
import './BudgetGoals.css';

export default function BudgetGoals() {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [newBudget, setNewBudget] = useState({ category: '', limit: '' });
  const { currency, loading: currencyLoading } = useUserCurrency();

  useEffect(() => {
    if (!auth.currentUser) return;

    const qBudgets = query(
      collection(db, 'budgets'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeBudgets = onSnapshot(qBudgets, (snapshot) => {
      setBudgets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const qExpenses = query(
      collection(db, 'expenses'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeBudgets();
      unsubscribeExpenses();
    };
  }, []);

  const addBudget = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'budgets'), {
      category: newBudget.category,
      limit: parseFloat(newBudget.limit),
      userId: auth.currentUser.uid,
    });
    setNewBudget({ category: '', limit: '' });
  };

  const deleteBudget = async (id) => {
    await deleteDoc(doc(db, 'budgets', id));
  };

  if (currencyLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="budget-goals">
      <h2>Budget Management</h2>
      <form onSubmit={addBudget} className="budget-form">
        <input
          type="text"
          placeholder="Category"
          value={newBudget.category}
          onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.01"
          placeholder="Budget Limit"
          value={newBudget.limit}
          onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
          required
        />
        <button type="submit">Add Budget</button>
      </form>
      
      <div className="budget-list">
        {budgets.map(budget => {
          const spent = expenses
            .filter(expense => expense.category === budget.category)
            .reduce((sum, expense) => sum + expense.amount, 0);
          const percentage = budget.limit > 0 ? ((spent / budget.limit) * 100).toFixed(0) : 0;

          return (
            <div key={budget.id} className="budget-item">
              <h4>{budget.category}</h4>
              <div className="progress-container">
                <progress
                  className={spent > budget.limit ? 'over-budget' : ''}
                  value={spent}
                  max={budget.limit}
                />
                <div className="budget-labels">
                  <span>{formatCurrency(spent, currency)}</span>
                  <span>{formatCurrency(budget.limit, currency)}</span>
                </div>
                {spent > budget.limit ? (
                  <div className="over-budget-message">
                    Over budget by {formatCurrency(spent - budget.limit, currency)}
                  </div>
                ) : (
                  <div className="remaining-budget">
                    Remaining: {formatCurrency(budget.limit - spent, currency)}
                  </div>
                )}
                <div className="progress-text">
                  {percentage}% of budget used
                </div>
              </div>
              <button onClick={() => deleteBudget(budget.id)} className="delete-button">
                Delete
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}