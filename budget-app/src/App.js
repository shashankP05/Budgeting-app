import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import SplashScreen from './components/SplashScreen';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ExpenseTracker from './components/ExpenseTracker';
import BudgetGoals from './components/BudgetGoals';
// import Reports from './components/Reports'; 
import Debt from './components/Debt'; 
import Profile from './components/Profile'; 
import Overview from './components/Overview';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Default route */}
          <Route path="/" element={<SplashScreen />} />

          {/* Authentication route */}
          <Route path="/auth" element={<Auth />} />

          {/* Dashboard route */}
          <Route path="/dashboard" element={<Dashboard />}>
            <Route index element={<Navigate to="overview" />} /> {/* Default route for /dashboard */}
            <Route path="overview" element={<Overview />} />
            <Route path="expenses" element={<ExpenseTracker />} />
            <Route path="budgets" element={<BudgetGoals />} />
            {/* <Route path="reports" element={<Reports />} /> */}
            <Route path="debt" element={<Debt />} />
            <Route path="profile" element={<Profile />} />{/* Fixed route path to lowercase */}
          </Route>

          {/* Redirect to /dashboard/overview if no matching route is found */}
          <Route path="*" element={<Navigate to="/dashboard/overview" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;