CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  payer TEXT NOT NULL,
  amount_jpy REAL NOT NULL,
  original_amount REAL NOT NULL,
  original_currency TEXT NOT NULL,
  category TEXT NOT NULL,
  note TEXT,
  split_with TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_created_at
ON expenses(created_at);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  day TEXT NOT NULL,
  time TEXT,
  title TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_day_order
ON plans(day, order_index);

CREATE INDEX IF NOT EXISTS idx_plans_created_at
ON plans(created_at);
