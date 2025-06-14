import React from 'react';
import '../App.css';

function PurchaseOrders() {
  return (
    <div className="page">
      <h1>Purchase Orders</h1>
      <p>This is the purchase orders page. You can manage your purchase orders here.</p>
      <ul>
        <li>Create new purchase orders</li>
        <li>View existing purchase orders</li>
        <li>Update purchase order information</li>
        <li>Delete purchase orders</li>
      </ul>
    </div>
  );
}

export default PurchaseOrders;
