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
      <nav className={`sidebar  ₹{isSidebarActive ? 'active' : ''}`}>
        <div className="sidebar-header">
          <h3>Budget App</h3>
          <p>{currentUser?.email}</p>
        </div>
        <ul className="sidebar-menu">
          <li><Link to="/dashboard/overview">Overview</Link></li>
          <li><Link to="/dashboard/expenses">Expenses</Link></li>
          <li><Link to="/dashboard/budgets">Budgets</Link></li>
          <li><Link to="/dashboard/Debt">Debt</Link></li>
          <li><Link to="/dashboard/profile">Profile</Link></li>
        </ul>
      </nav>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isSidebarActive ? '✕' : '☰'}
      </button>
    </>
  );
}