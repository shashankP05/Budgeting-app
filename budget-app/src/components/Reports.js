// import React, { useEffect, useState } from 'react';
// import { collection, query, where, onSnapshot } from 'firebase/firestore';
// import { db, auth } from '../firebase';
// import SpendingChart from './SpendingChart';
// import './Reports.css';

// export default function Reports() {
//   const [expenses, setExpenses] = useState([]);
//   const [chartType, setChartType] = useState('pie'); // Default to Pie Chart

//   // Fetch expenses from Firestore
//   useEffect(() => {
//     const q = query(
//       collection(db, 'expenses'),
//       where('userId', '==', auth.currentUser.uid)
//     );
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       console.log('Expenses:', expensesData); // Log expenses
//       setExpenses(expensesData);
//     });
//     return unsubscribe;
//   }, []);

//   return (
//     <div className="reports-container">
//       <h1>Reports</h1>

//       {/* Chart Type Selector */}
//       <div className="chart-selector">
//         <label>Select Chart Type:</label>
//         <select value={chartType} onChange={(e) => setChartType(e.target.value)}>
//           <option value="pie">Pie Chart</option>
//           <option value="bar">Bar Chart</option>
//         </select>
//       </div>

//       {/* Display Chart */}
//       {expenses.length > 0 ? (
//         <SpendingChart expenses={expenses} chartType={chartType} />
//       ) : (
//         <p>No expenses found.</p>
//       )}
//     </div>
//   );
// }
