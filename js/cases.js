const gameCases = [
    {
        id: 1,
        title: "The Missing Inventory",
        description: "You've been called to investigate a case at TechMart. Several high-value items have gone missing from their inventory. The store manager suspects it might be an inside job. You need to analyze their database to find patterns and identify potential suspects.",
        
        briefing: "First, examine the records to identify which items are missing. Then check which employees had access during the times of the thefts.",
        
        tables: [
            {
                name: "employees",
                createStatement: `CREATE TABLE employees (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    position TEXT NOT NULL,
                    hire_date DATE NOT NULL
                )`,
                insertStatements: [
                    `INSERT INTO employees VALUES (1, 'John Smith', 'Manager', '2019-05-10')`,
                    `INSERT INTO employees VALUES (2, 'Sarah Johnson', 'Sales Associate', '2020-03-15')`,
                    `INSERT INTO employees VALUES (3, 'Michael Brown', 'Security', '2019-11-01')`,
                    `INSERT INTO employees VALUES (4, 'Lisa Davis', 'Inventory Clerk', '2021-01-20')`,
                    `INSERT INTO employees VALUES (5, 'Robert Wilson', 'Sales Associate', '2020-07-05')`
                ]
            },
            {
                name: "inventory",
                createStatement: `CREATE TABLE inventory (
                    item_id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    quantity INTEGER NOT NULL
                )`,
                insertStatements: [
                    `INSERT INTO inventory VALUES (101, 'Smartphone X', 'Electronics', 999.99, 10)`,
                    `INSERT INTO inventory VALUES (102, 'Laptop Pro', 'Electronics', 1499.99, 5)`,
                    `INSERT INTO inventory VALUES (103, 'Wireless Headphones', 'Electronics', 199.99, 20)`,
                    `INSERT INTO inventory VALUES (104, 'Smart Watch', 'Electronics', 299.99, 0)`,
                    `INSERT INTO inventory VALUES (105, 'Tablet Ultra', 'Electronics', 599.99, 3)`,
                    `INSERT INTO inventory VALUES (106, 'Bluetooth Speaker', 'Electronics', 89.99, 0)`
                ]
            },
            {
                name: "shifts",
                createStatement: `CREATE TABLE shifts (
                    shift_id INTEGER PRIMARY KEY,
                    employee_id INTEGER,
                    date DATE NOT NULL,
                    start_time TIME NOT NULL,
                    end_time TIME NOT NULL,
                    FOREIGN KEY (employee_id) REFERENCES employees (id)
                )`,
                insertStatements: [
                    `INSERT INTO shifts VALUES (1, 1, '2023-06-10', '08:00', '16:00')`,
                    `INSERT INTO shifts VALUES (2, 2, '2023-06-10', '10:00', '18:00')`,
                    `INSERT INTO shifts VALUES (3, 3, '2023-06-10', '16:00', '00:00')`,
                    `INSERT INTO shifts VALUES (4, 4, '2023-06-10', '12:00', '20:00')`,
                    `INSERT INTO shifts VALUES (5, 5, '2023-06-10', '08:00', '16:00')`,
                    `INSERT INTO shifts VALUES (6, 1, '2023-06-11', '08:00', '16:00')`,
                    `INSERT INTO shifts VALUES (7, 3, '2023-06-11', '08:00', '16:00')`,
                    `INSERT INTO shifts VALUES (8, 4, '2023-06-11', '12:00', '20:00')`,
                    `INSERT INTO shifts VALUES (9, 2, '2023-06-12', '10:00', '18:00')`,
                    `INSERT INTO shifts VALUES (10, 5, '2023-06-12', '10:00', '18:00')`
                ]
            },
            {
                name: "inventory_changes",
                createStatement: `CREATE TABLE inventory_changes (
                    change_id INTEGER PRIMARY KEY,
                    item_id INTEGER,
                    quantity_change INTEGER NOT NULL,
                    change_date DATE NOT NULL,
                    change_time TIME NOT NULL,
                    employee_id INTEGER,
                    FOREIGN KEY (item_id) REFERENCES inventory (item_id),
                    FOREIGN KEY (employee_id) REFERENCES employees (id)
                )`,
                insertStatements: [
                    `INSERT INTO inventory_changes VALUES (1, 101, -2, '2023-06-10', '14:30', 2)`,
                    `INSERT INTO inventory_changes VALUES (2, 102, -1, '2023-06-10', '15:45', 2)`,
                    `INSERT INTO inventory_changes VALUES (3, 104, -3, '2023-06-11', '13:20', 4)`,
                    `INSERT INTO inventory_changes VALUES (4, 103, -5, '2023-06-11', '14:10', 4)`,
                    `INSERT INTO inventory_changes VALUES (5, 106, -4, '2023-06-12', '11:05', 5)`,
                    `INSERT INTO inventory_changes VALUES (6, 101, 5, '2023-06-09', '09:30', 1)`,
                    `INSERT INTO inventory_changes VALUES (7, 102, 2, '2023-06-09', '09:45', 1)`
                ]
            }
        ],
        
        challenges: [
            {
                question: "Find all items that currently have 0 quantity in inventory",
                hint: "Use the SELECT statement with a WHERE clause to filter items with quantity = 0",
                solution: "SELECT * FROM inventory WHERE quantity = 0",
                validateFn: (result, expectedResult) => {
                    // Both results should have same number of rows
                    if (result.rows.length !== expectedResult.rows.length) return false;
                    
                    // Check if same item_ids are present
                    const resultIds = result.rows.map(r => r.item_id).sort();
                    const expectedIds = expectedResult.rows.map(r => r.item_id).sort();
                    return resultIds.every((id, i) => id === expectedIds[i]);
                }
            },
            {
                question: "Identify which employee was on duty during most of the inventory decreases",
                hint: "Join the inventory_changes and employees tables, then use GROUP BY and COUNT",
                solution: `
                    SELECT e.name, COUNT(*) as change_count 
                    FROM inventory_changes ic 
                    JOIN employees e ON ic.employee_id = e.id 
                    WHERE ic.quantity_change < 0 
                    GROUP BY e.name 
                    ORDER BY change_count DESC
                `,
                validateFn: (result, expectedResult) => {
                    // Check if top employee matches
                    return result.rows[0]?.name === expectedResult.rows[0]?.name &&
                           result.rows[0]?.change_count === expectedResult.rows[0]?.change_count;
                }
            }
        ],
        
        conclusion: "After analyzing the data, it appears that Lisa Davis, the Inventory Clerk, has been involved in suspicious inventory decreases. The investigation should focus on her activities and access patterns."
    },
    
    {
        id: 2,
        title: "The Banking Mystery",
        description: "A local bank has reported unusual transaction patterns. As a detective, you need to analyze their database to identify potential fraudulent activity.",
        
        briefing: "The bank manager has given you access to their transaction database. Look for suspicious patterns in large transactions and account activities.",
        
        tables: [
            {
                name: "customers",
                createStatement: `CREATE TABLE customers (
                    customer_id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE,
                    phone TEXT,
                    join_date DATE NOT NULL
                )`,
                insertStatements: [
                    `INSERT INTO customers VALUES (1, 'Emma Wilson', 'emma.w@email.com', '555-0101', '2018-03-12')`,
                    `INSERT INTO customers VALUES (2, 'James Miller', 'james.m@email.com', '555-0202', '2019-05-23')`,
                    `INSERT INTO customers VALUES (3, 'Olivia Davis', 'olivia.d@email.com', '555-0303', '2017-11-05')`,
                    `INSERT INTO customers VALUES (4, 'William Garcia', 'william.g@email.com', '555-0404', '2020-01-18')`,
                    `INSERT INTO customers VALUES (5, 'Sophia Martinez', 'sophia.m@email.com', '555-0505', '2019-08-30')`
                ]
            },
            {
                name: "accounts",
                createStatement: `CREATE TABLE accounts (
                    account_id INTEGER PRIMARY KEY,
                    customer_id INTEGER,
                    account_type TEXT NOT NULL,
                    balance DECIMAL(12,2) NOT NULL,
                    open_date DATE NOT NULL,
                    FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
                )`,
                insertStatements: [
                    `INSERT INTO accounts VALUES (101, 1, 'Checking', 2540.75, '2018-03-12')`,
                    `INSERT INTO accounts VALUES (102, 1, 'Savings', 15000.00, '2018-03-15')`,
                    `INSERT INTO accounts VALUES (103, 2, 'Checking', 1250.50, '2019-05-23')`,
                    `INSERT INTO accounts VALUES (104, 3, 'Checking', 7800.25, '2017-11-05')`,
                    `INSERT INTO accounts VALUES (105, 3, 'Savings', 28500.00, '2017-12-10')`,
                    `INSERT INTO accounts VALUES (106, 3, 'Investment', 50000.00, '2018-06-22')`,
                    `INSERT INTO accounts VALUES (107, 4, 'Checking', 950.10, '2020-01-18')`,
                    `INSERT INTO accounts VALUES (108, 5, 'Checking', 3200.80, '2019-08-30')`,
                    `INSERT INTO accounts VALUES (109, 5, 'Savings', 12000.00, '2019-09-15')`
                ]
            },
            {
                name: "transactions",
                createStatement: `CREATE TABLE transactions (
                    transaction_id INTEGER PRIMARY KEY,
                    account_id INTEGER,
                    transaction_type TEXT NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    transaction_date DATE NOT NULL,
                    transaction_time TIME NOT NULL,
                    description TEXT,
                    FOREIGN KEY (account_id) REFERENCES accounts (account_id)
                )`,
                insertStatements: [
                    `INSERT INTO transactions VALUES (1001, 101, 'Deposit', 500.00, '2023-06-01', '09:30:00', 'Salary deposit')`,
                    `INSERT INTO transactions VALUES (1002, 103, 'Withdrawal', 200.00, '2023-06-01', '14:25:00', 'ATM withdrawal')`,
                    `INSERT INTO transactions VALUES (1003, 102, 'Deposit', 1000.00, '2023-06-02', '10:15:00', 'Savings transfer')`,
                    `INSERT INTO transactions VALUES (1004, 104, 'Withdrawal', 150.25, '2023-06-02', '16:40:00', 'Online purchase')`,
                    `INSERT INTO transactions VALUES (1005, 105, 'Withdrawal', 5000.00, '2023-06-03', '11:05:00', 'Large withdrawal')`,
                    `INSERT INTO transactions VALUES (1006, 105, 'Withdrawal', 5000.00, '2023-06-03', '13:15:00', 'Large withdrawal')`,
                    `INSERT INTO transactions VALUES (1007, 105, 'Withdrawal', 5000.00, '2023-06-03', '15:30:00', 'Large withdrawal')`,
                    `INSERT INTO transactions VALUES (1008, 105, 'Withdrawal', 5000.00, '2023-06-03', '17:45:00', 'Large withdrawal')`,
                    `INSERT INTO transactions VALUES (1009, 106, 'Deposit', 10000.00, '2023-06-04', '09:20:00', 'Investment addition')`,
                    `INSERT INTO transactions VALUES (1010, 108, 'Withdrawal', 300.80, '2023-06-04', '12:35:00', 'Retail purchase')`,
                    `INSERT INTO transactions VALUES (1011, 109, 'Withdrawal', 2000.00, '2023-06-05', '10:55:00', 'Savings withdrawal')`,
                    `INSERT INTO transactions VALUES (1012, 107, 'Deposit', 450.00, '2023-06-05', '14:10:00', 'Check deposit')`
                ]
            }
        ],
        
        challenges: [
            {
                question: "Find all customers who made multiple large withdrawals (over $1000) on the same day",
                hint: "Join customers, accounts, and transactions tables, then use GROUP BY with HAVING to filter for multiple occurrences",
                solution: `
                    SELECT c.name, t.transaction_date, COUNT(*) as withdrawal_count, SUM(t.amount) as total_withdrawn
                    FROM customers c
                    JOIN accounts a ON c.customer_id = a.customer_id
                    JOIN transactions t ON a.account_id = t.account_id
                    WHERE t.transaction_type = 'Withdrawal' AND t.amount > 1000
                    GROUP BY c.name, t.transaction_date
                    HAVING COUNT(*) > 1
                    ORDER BY total_withdrawn DESC
                `,
                validateFn: (result, expectedResult) => {
                    // Check if same customers and dates match
                    const resultData = result.rows.map(r => `${r.name}-${r.transaction_date}`).sort();
                    const expectedData = expectedResult.rows.map(r => `${r.name}-${r.transaction_date}`).sort();
                    return resultData.every((data, i) => data === expectedData[i]);
                }
            },
            {
                question: "Calculate the total balance for each customer across all their accounts",
                hint: "Join customers and accounts, then use GROUP BY with SUM",
                solution: `
                    SELECT c.customer_id, c.name, SUM(a.balance) as total_balance
                    FROM customers c
                    JOIN accounts a ON c.customer_id = a.customer_id
                    GROUP BY c.customer_id, c.name
                    ORDER BY total_balance DESC
                `,
                validateFn: (result, expectedResult) => {
                    // Check if total balances match for each customer
                    const resultBalances = result.rows.map(r => `${r.customer_id}-${r.total_balance}`).sort();
                    const expectedBalances = expectedResult.rows.map(r => `${r.customer_id}-${r.total_balance}`).sort();
                    return resultBalances.every((balance, i) => balance === expectedBalances[i]);
                }
            }
        ],
        
        conclusion: "Based on your analysis, Olivia Davis has made multiple large withdrawals on the same day, totaling $20,000. This pattern is highly suspicious and warrants further investigation."
    }
];

// Export for use in other modules
export default gameCases;
