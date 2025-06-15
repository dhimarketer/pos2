import React from 'react';

function PurchaseOrders() {
  return (
    <div>
      <h1>Purchase Orders</h1>
      <table>
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Supplier</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Item 1</td>
            <td>100</td>
            <td>Supplier 1</td>
          </tr>
          <tr>
            <td>Item 2</td>
            <td>200</td>
            <td>Supplier 2</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default PurchaseOrders;
