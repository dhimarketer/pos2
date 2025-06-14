import React from 'react';
import '../App.css';

function Customers() {
  return (
    <div className="page">
      <h1>Customers</h1>
      <p>This is the customers page. You can manage your customers here.</p>
      <ul>
        <li>Add new customers</li>
        <li>View existing customers</li>
        <li>Update customer information</li>
        <li>Delete customers</li>
      </ul>
    </div>
  );
}

export default Customers;
