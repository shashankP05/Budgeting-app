import React, { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { useUserCurrency } from '../hooks/useUserCurrency'; // Custom hook to fetch currency
import { formatCurrency } from '../utils/formatCurrency'; // Utility to format monetary values
import './Overview.css';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Overview() {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // Default to current month
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const chartRef = useRef(null);

  const { currency, loading: currencyLoading } = useUserCurrency(); // Fetch user's currency

  // Handle window resize
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
    
    window.addEventListener('resize', handleResize);
    
    // Trigger an initial resize event after component mounts
    const resizeTimer = setTimeout(() => {
      handleResize();
      
      // Force chart resize if it exists
      if (chartRef.current && chartRef.current.chartInstance) {
        chartRef.current.chartInstance.resize();
      }
    }, 100);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Format date for display
  const formatMonthYear = (dateString) => {
    return new Date(dateString).toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  // Fetch expenses, income, and debts for the selected month
  useEffect(() => {
    if (!auth.currentUser) {
      setError('Please log in to view your financial overview.');
      setLoading(false);
      return;
    }

    let completedFetches = 0;
    const totalFetches = 3;

    const checkAllFetchesComplete = () => {
      completedFetches++;
      if (completedFetches === totalFetches) {
        setLoading(false);
      }
    };

    const startDate = `${selectedMonth}-01`;
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${selectedMonth}-${lastDay}`;

    const expensesCollection = collection(db, 'expenses');
    const qExpenses = query(expensesCollection, where('userId', '==', auth.currentUser.uid));
    const unsubscribeExpenses = onSnapshot(
      qExpenses,
      (snapshot) => {
        const fetchedExpenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const filteredExpenses = fetchedExpenses.filter(
          (expense) => expense.date >= startDate && expense.date <= endDate
        );
        setExpenses(filteredExpenses);
        checkAllFetchesComplete();
      },
      (err) => {
        setError((prev) => (prev ? `${prev}; Expenses: ${err.message}` : `Expenses: ${err.message}`));
        checkAllFetchesComplete();
      }
    );

    const incomeCollection = collection(db, 'income');
    const qIncome = query(incomeCollection, where('userId', '==', auth.currentUser.uid));
    const unsubscribeIncome = onSnapshot(
      qIncome,
      (snapshot) => {
        const fetchedIncome = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const filteredIncome = fetchedIncome.filter(
          (inc) => inc.date >= startDate && inc.date <= endDate
        );
        setIncome(filteredIncome);
        checkAllFetchesComplete();
      },
      (err) => {
        setError((prev) => (prev ? `${prev}; Income: ${err.message}` : `Income: ${err.message}`));
        checkAllFetchesComplete();
      }
    );

    const qDebts = query(collection(db, 'debts'), where('userId', '==', auth.currentUser.uid));
    const unsubscribeDebts = onSnapshot(
      qDebts,
      (snapshot) => {
        const debtsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDebts(debtsData);
        checkAllFetchesComplete();
      },
      (err) => {
        setError((prev) => (prev ? `${prev}; Debts: ${err.message}` : `Debts: ${err.message}`));
        checkAllFetchesComplete();
      }
    );

    return () => {
      unsubscribeExpenses();
      unsubscribeIncome();
      unsubscribeDebts();
    };
  }, [selectedMonth]);

  if (currencyLoading) {
    return <div>Loading currency...</div>;
  }

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const activeDebts = debts.filter((debt) => debt.status === 'active');
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const totalIncome = income.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  const netSavings = totalIncome - totalExpenses;
  const totalDebt = activeDebts.reduce((sum, debt) => sum + (debt.currentBalance || 0), 0);

  const upcomingDebts = activeDebts.filter((debt) => {
    if (!debt.dueDate) return false;
    try {
      const dueDate = new Date(debt.dueDate);
      const today = new Date();
      if (isNaN(dueDate.getTime())) return false;
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    } catch (error) {
      console.error(`Error processing due date for debt ${debt.id}:`, error);
      return false;
    }
  });

  const barData = {
    labels: ['Expenses', 'Income', 'Net Savings', 'Debt'],
    datasets: [
      {
        label: `Amount (${currency})`,
        data: [totalExpenses, totalIncome, netSavings, totalDebt],
        backgroundColor: ['#FF6384', '#36A2EB', '#27ae60', '#FFCE56'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // Allow the chart to adjust its size
    plugins: {
      legend: { 
        position: 'top',
        display: windowSize.width > 480, // Hide legend on small mobile devices
      },
      title: { 
        display: true, 
        text: 'Financial Summary',
        font: {
          size: windowSize.width <= 480 ? 14 : 16
        }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            label += formatCurrency(context.parsed.y, currency);
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return formatCurrency(value, currency);
          },
          font: {
            size: windowSize.width <= 480 ? 10 : 12
          }
        },
      },
      x: {
        ticks: {
          font: {
            size: windowSize.width <= 480 ? 10 : 12
          }
        }
      }
    },
  };

  const predictFutureSavings = () => {
    const months = 6;
    const averageSavings = netSavings;
    const futureSavings = [];
    const currentDate = new Date(selectedMonth);

    for (let i = 1; i <= months; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setMonth(currentDate.getMonth() + i);
      futureSavings.push({
        month: futureDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        savings: averageSavings * i,
        cumulativeSavings: averageSavings * i,
      });
    }
    return futureSavings;
  };

  const futureSavings = predictFutureSavings();

  return (
    <div className="overview-container">
      <h1>Financial Overview</h1>

      <div className="month-selector">
        <div className="month-wrapper">
          <label htmlFor="month">Select Month: </label>
          <input
            type="month"
            id="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="month-input"
          />
        </div>
        <div className="current-month">
          <h2>{formatMonthYear(selectedMonth)}</h2>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading financial data...</p>
        </div>
      ) : (
        <>
          {error && <p className="error-message">{error}</p>}

          <div className="totals-container">
            <div className="total-card">
              <h3>Total Expenses</h3>
              <p className="expense-amount">{formatCurrency(totalExpenses, currency)}</p>
            </div>
            <div className="total-card">
              <h3>Total Income</h3>
              <p className="income-amount">{formatCurrency(totalIncome, currency)}</p>
            </div>
            <div className="total-card">
              <h3>Net Savings</h3>
              <p className={netSavings >= 0 ? 'positive-amount' : 'negative-amount'}>
                {formatCurrency(netSavings, currency)}
              </p>
            </div>
            <div className="total-card">
              <h3>Total Debt</h3>
              <p className="debt-amount">{formatCurrency(totalDebt, currency)}</p>
            </div>
          </div>

          <div className="financial-sections">
            <div className="chart-due-dates-container">
              <div className="chart-container">
                <h2>Financial Summary</h2>
                <div className="chart-wrapper">
                  <Bar 
                    ref={chartRef}
                    data={barData} 
                    options={chartOptions} 
                    key={`chart-${windowSize.width}-${windowSize.height}`} // Force re-render on window resize
                  />
                </div>
              </div>
              <div className="upcoming-debts">
                <h2>Upcoming Due Dates</h2>
                {upcomingDebts.length > 0 ? (
                  <ul className="debts-list">
                    {upcomingDebts.map((debt) => (
                      <li key={debt.id} className="debt-item">
                        <div className="debt-name">{debt.lenderName || 'Unknown Lender'}</div>
                        <div className="debt-details">
                          <span className="debt-date">
                            Due on {new Date(debt.dueDate).toLocaleDateString()}
                          </span>
                          {debt.currentBalance && (
                            <span className="debt-amount">
                              {formatCurrency(debt.currentBalance, currency)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-debts-message">No upcoming due dates within the next 7 days.</p>
                )}
              </div>
            </div>

            <div className="predictive-analysis">
              <div className="projection-container">
                <h2>Savings Projection</h2>
                <p>Based on your current savings trend, here's a projection for the next 6 months:</p>
                <div className="projection-grid">
                  {futureSavings.map((fs, index) => (
                    <div key={index} className="projection-card">
                      <div className="projection-month">{fs.month}</div>
                      <div className="projection-amount">{formatCurrency(fs.savings, currency)}</div>
                      <div
                        className={
                          fs.savings >= 0 ? 'projection-indicator positive' : 'projection-indicator negative'
                        }
                      ></div>
                    </div>
                  ))}
                </div>
                <div className="projection-note">
                  <p>
                    <strong>Note:</strong> This projection is based on your current month's savings pattern and assumes
                    consistent income and expenses in the future.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}