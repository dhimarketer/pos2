import React from 'react';

function Suppliers() {
  return (
    <div>
      <h1>Suppliers</h1>
      <table>
        <thead>
          <tr>
            <th>Supplier Name</th>
            <th>Contact</th>
            <th>Address</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Supplier 1</td>
            <td>123-456-7890</td>
            <td>123 Main St</td>
          </tr>
          <tr>
            <td>Supplier 2</td>
            <td>456-789-0123</td>
            <td>456 Elm St</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default Suppliers;
