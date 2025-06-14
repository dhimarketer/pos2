import React from 'react';
import '../App.css';

function Suppliers() {
  return (
    <div className="page">
      <h1>Suppliers</h1>
      <p>This is the suppliers page. You can manage your suppliers here.</p>
      <ul>
        <li>Add new suppliers</li>
        <li>View existing suppliers</li>
        <li>Update supplier information</li>
        <li>Delete suppliers</li>
      </ul>
    </div>
  );
}

export default Suppliers;
