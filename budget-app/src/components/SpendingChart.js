import React from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function SpendingChart({ expenses, chartType }) {
  // Aggregate expenses by category
  const categoryData = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  // Data for Pie Chart
  const pieData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#E7E9ED'
        ],
      },
    ],
  };

  // Data for Bar Chart
  const barData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        label: 'Spending by Category',
        data: Object.values(categoryData),
        backgroundColor: '#36A2EB',
      },
    ],
  };

  return (
    <div className="chart-container">
      <h3>Spending by Category</h3>
      {chartType === 'pie' ? (
        <Pie data={pieData} />
      ) : (
        <Bar data={barData} />
      )}
    </div>
  );
}