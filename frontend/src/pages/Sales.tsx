import React from 'react';

function Sales() {
  return (
    <div>
      <h1>Sales</h1>
      <form>
        <label>
          Item Name:
          <input type="text" name="itemName" />
        </label>
        <br />
        <label>
          Quantity:
          <input type="number" name="quantity" />
        </label>
        <br />
        <button type="submit">Add to Sale</button>
      </form>
    </div>
  );
}

export default Sales;
