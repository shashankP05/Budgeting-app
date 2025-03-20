import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}