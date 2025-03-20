import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { currentUser } = useAuth();
  const [isSidebarActive, setIsSidebarActive] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarActive(!isSidebarActive);
  };

  return (
    <>
      <nav className={`sidebar ${isSidebarActive ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Budget App</h3>
          <p>{currentUser?.email}</p>
        </div>
        <ul className="sidebar-menu">
          <li><Link to="/dashboard/overview" onClick={() => setIsSidebarActive(false)}>Overview</Link></li>
          <li><Link to="/dashboard/expenses" onClick={() => setIsSidebarActive(false)}>Expenses</Link></li>
          <li><Link to="/dashboard/budgets" onClick={() => setIsSidebarActive(false)}>Budgets</Link></li>
          <li><Link to="/dashboard/debt" onClick={() => setIsSidebarActive(false)}>Debt</Link></li>
          <li><Link to="/dashboard/profile" onClick={() => setIsSidebarActive(false)}>Profile</Link></li>
        </ul>
      </nav>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isSidebarActive ? '✕' : '☰'}
      </button>
    </>
  );
}