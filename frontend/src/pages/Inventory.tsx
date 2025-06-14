import React from 'react';
import '../App.css';

function Inventory() {
  return (
    <div className="page">
      <h1>Inventory</h1>
      <p>This is the inventory page. You can manage your inventory here.</p>
      <ul>
        <li>Add new items</li>
        <li>View existing items</li>
        <li>Update item information</li>
        <li>Delete items</li>
      </ul>
    </div>
  );
}

export default Inventory;
