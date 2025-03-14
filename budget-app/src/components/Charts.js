import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import './Charts.css';

ChartJS.register(ArcElement, Tooltip, Legend);

export function CategoryPieChart({ expenses }) {
  const categoryData = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const data = {
    labels: Object.keys(categoryData),
    datasets: [{
      data: Object.values(categoryData),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#E7E9ED'
      ],
    }]
  };

  return (
    <div className="chart-container">
      <h3>Spending by Category</h3>
      <Pie data={data} />
    </div>
  );
}

// Add similar components for Bar charts and Heatmaps