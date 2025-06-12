CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL
);

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(255),
  cost_price DECIMAL(10, 2) NOT NULL,
  packaging_unit VARCHAR(255),
  stock INTEGER NOT NULL,
  multi_level_pricing JSONB,
  status VARCHAR(255),
  max_sale_qty INTEGER,
  price_change_history TEXT
);

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_info VARCHAR(255),
  address TEXT,
  purchase_history TEXT
);

CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(255),
  email VARCHAR(255),
  address TEXT,
  payment_terms VARCHAR(255)
);

CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  item_id INTEGER REFERENCES items(id),
  quantity INTEGER NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  order_date DATE NOT NULL
);

CREATE TABLE sales_transactions (
  id SERIAL PRIMARY KEY,
  item_id INTEGER REFERENCES items(id),
  customer_id INTEGER REFERENCES customers(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  sale_date DATE NOT NULL,
  payment_type VARCHAR(255) NOT NULL
);

CREATE TABLE audit_trail (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  description TEXT,
  timestamp TIMESTAMP NOT NULL
);
