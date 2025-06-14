import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <nav>
        <ul>
          <li>
            <Link to="/inventory">Inventory</Link>
          </li>
          <li>
            <Link to="/sales">Sales</Link>
          </li>
          <li>
            <Link to="/customers">Customers</Link>
          </li>
          <li>
            <Link to="/suppliers">Suppliers</Link>
          </li>
          <li>
            <Link to="/purchase-orders">Purchase Orders</Link>
          </li>
          <li>
            <Link to="/reports">Reports</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Dashboard;
