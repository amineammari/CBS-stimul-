const express = require('express');
const app = express();

// Use PORT from environment variable or default to 30001
const port = process.env.PORT || 30001;
const host = '0.0.0.0'; // CRITICAL: Listen on all interfaces for Docker

app.use(express.json());

// --- Mock Data ---
const now = new Date();
let transactionCounter = 12; // Pour générer des ID de transaction uniques

const customers = {
  'C001': { 
    id: 'C001', 
    prenom: 'Mohamed', 
    nom: 'Ben Ali', 
    adresse: '12 Rue de Carthage, 2000 Le Bardo, Tunis', 
    email: 'mohamed.benali@email.tn',
    telephone: '+216 98 123 456'
  },
  'C002': { 
    id: 'C002', 
    prenom: 'Fatima', 
    nom: 'El Fihri', 
    adresse: '45 Avenue Habib Bourguiba, 4000 Sousse',
    email: 'fatima.elfihri@email.tn',
    telephone: '+216 22 789 012'
  },
  'C003': {
    id: 'C003',
    prenom: 'Ali',
    nom: 'Trabelsi',
    adresse: '7 Avenue de Paris, 1000 Tunis',
    email: 'ali.trabelsi@email.com',
    telephone: '+216 55 123 789'
  },
  'C004': {
    id: 'C004',
    prenom: 'Aisha',
    nom: 'Bouslama',
    adresse: '3 Rue El Marr, 3000 Sfax',
    email: 'aisha.bouslama@email.com',
    telephone: '+216 21 987 654'
  }
};

const accounts = {
  'A001': { 
    id: 'A001', 
    customerId: 'C001', 
    type: 'Compte Courant',
    iban: 'TN59 1000 6035 0000 0123 4567 89',
    balance: 15850.75, 
    currency: 'TND',
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'A002': { 
    id: 'A002', 
    customerId: 'C001', 
    type: 'Compte Épargne',
    iban: 'TN59 1000 6035 0000 0789 0123 45',
    balance: 125000.00, 
    currency: 'TND',
    createdAt: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'A003': { 
    id: 'A003', 
    customerId: 'C002', 
    type: 'Compte Courant',
    iban: 'TN59 1400 3051 0000 0987 6543 21',
    balance: 7230.50, 
    currency: 'TND',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'A004': {
    id: 'A004',
    customerId: 'C003',
    type: 'Compte Courant',
    iban: 'TN59 1200 8091 0000 0543 2167 89',
    balance: 21500.00,
    currency: 'TND',
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'A005': {
    id: 'A005',
    customerId: 'C004',
    type: 'Compte Courant',
    iban: 'TN59 1100 7061 0000 0876 5432 10',
    balance: 9800.25,
    currency: 'TND',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'A006': {
    id: 'A006',
    customerId: 'C004',
    type: 'Compte Épargne',
    iban: 'TN59 1100 7061 0000 0112 2334 45',
    balance: 50000.00,
    currency: 'TND',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
};

const history = {
  'A001': [
    { id: 'TRN001', type: 'DÉBIT', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'Paiement Facture STEG', montant: -120.50 },
    { id: 'TRN002', type: 'DÉBIT', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), description: 'Achat en ligne Jumia', montant: -345.00 },
    { id: 'TRN003', type: 'CRÉDIT', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), description: 'Virement Salaire', montant: 4500.00 },
  ],
  'A002': [
    { id: 'TRN004', type: 'CRÉDIT', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), description: 'Dépôt initial', montant: 100000.00 },
    { id: 'TRN005', type: 'CRÉDIT', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), description: 'Intérêts annuels', montant: 2500.00 },
  ],
  'A003': [
    { id: 'TRN006', type: 'CRÉDIT', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), description: 'Virement de "Ahmed"', montant: 800.00 },
    { id: 'TRN007', type: 'DÉBIT', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), description: 'Retrait GAB', montant: -200.00 },
  ],
  'A004': [
    { id: 'TRN008', type: 'CRÉDIT', date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), description: 'Virement international', montant: 15000.00 },
    { id: 'TRN009', type: 'DÉBIT', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), description: 'Paiement restaurant', montant: -150.00 },
  ],
  'A005': [
    { id: 'TRN010', type: 'CRÉDIT', date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), description: 'Dépôt chèque', montant: 2000.00 },
  ],
  'A006': [
    { id: 'TRN011', type: 'CRÉDIT', date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), description: 'Dépôt initial', montant: 50000.00 },
  ]
};

// --- Routes ---
// Health check endpoint (REQUIRED for Kubernetes readiness/liveness probes)
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'CBS Simulator',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: port,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'CBS Simulator',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Get account by ID
app.get('/cbs/account/:id', (req, res) => {
  const account = accounts[req.params.id];
  if (account) {
    res.json(account);
  } else {
    res.status(404).json({ error: 'Account not found', accountId: req.params.id });
  }
});

// Transfer between accounts
app.post('/cbs/transfer', (req, res) => {
  const { from, to, amount, description } = req.body;
  
  // Validation
  if (!from || !to || !amount) {
    return res.status(400).json({ error: 'Missing transfer details', required: ['from', 'to', 'amount'] });
  }

  const fromAccount = accounts[from];
  const toAccount = accounts[to];

  if (!fromAccount || !toAccount) {
    return res.status(404).json({ error: 'One or more accounts not found', from, to });
  }

  if (fromAccount.balance < amount) {
    return res.status(400).json({ 
      error: 'Insufficient funds',
      available: fromAccount.balance,
      requested: amount
    });
  }

  // Process transfer
  fromAccount.balance -= amount;
  toAccount.balance += amount;
  fromAccount.updatedAt = new Date().toISOString();
  toAccount.updatedAt = new Date().toISOString();

  const debitTransaction = {
    id: `TRN${String(transactionCounter++).padStart(3, '0')}`,
    type: 'DÉBIT',
    date: new Date().toISOString(),
    description: description || `Virement à ${to}`,
    montant: -amount,
  };

  const creditTransaction = {
    id: `TRN${String(transactionCounter++).padStart(3, '0')}`,
    type: 'CRÉDIT',
    date: new Date().toISOString(),
    description: description || `Virement de ${from}`,
    montant: amount,
  };

  if (!history[from]) history[from] = [];
  history[from].push(debitTransaction);
  if (!history[to]) history[to] = [];
  history[to].push(creditTransaction);

  res.status(200).json({ 
    message: 'Transfer successful', 
    sourceAccount: fromAccount, 
    targetAccount: toAccount,
    debitTransaction,
    creditTransaction
  });
});

// Get customer by ID with their accounts
app.get('/cbs/customer/:id', (req, res) => {
  const customerId = req.params.id;
  const customer = customers[customerId];
  
  if (customer) {
    const customerAccounts = Object.values(accounts).filter(
      (acc) => acc.customerId === customerId
    );
    res.json({ ...customer, accounts: customerAccounts });
  } else {
    res.status(404).json({ error: 'Customer not found', customerId });
  }
});

// Get account transaction history
app.get('/cbs/account/:id/history', (req, res) => {
  const accountId = req.params.id;
  const accountHistory = history[accountId];

  if (accountHistory) {
    res.json(accountHistory);
  } else {
    // Si le compte existe mais n'a pas d'historique, retourner un tableau vide
    if (accounts[accountId]) {
      res.json([]);
    } else {
      res.status(404).json({ error: 'Account not found', accountId });
    }
  }
});

// Get account with full history
app.get('/cbs/history/:id', (req, res) => {
  const accountId = req.params.id;
  const account = accounts[accountId];
  const accountHistory = history[accountId];

  if (account) {
    res.json({
      account: account,
      transactions: accountHistory || []
    });
  } else {
    res.status(404).json({ error: 'Account not found', accountId });
  }
});

// Get all customers (useful for testing)
app.get('/cbs/customers', (req, res) => {
  res.json(Object.values(customers));
});

// Get all accounts (useful for testing)
app.get('/cbs/accounts', (req, res) => {
  res.json(Object.values(accounts));
});

// Additional endpoints for middleware compatibility
app.get('/api/accounts/:accountNumber', (req, res) => {
  const account = accounts[req.params.accountNumber];
  if (account) {
    res.json(account);
  } else {
    res.status(404).json({ error: 'Account not found', accountNumber: req.params.accountNumber });
  }
});

app.get('/api/balance/:accountNumber', (req, res) => {
  const account = accounts[req.params.accountNumber];
  if (account) {
    res.json({ 
      accountNumber: req.params.accountNumber,
      balance: account.balance,
      currency: account.currency
    });
  } else {
    res.status(404).json({ error: 'Account not found', accountNumber: req.params.accountNumber });
  }
});

app.post('/api/transactions', (req, res) => {
  const { accountNumber, amount, type, description } = req.body;
  
  if (!accountNumber || !amount || !type) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      required: ['accountNumber', 'amount', 'type'] 
    });
  }

  const account = accounts[accountNumber];
  if (!account) {
    return res.status(404).json({ error: 'Account not found', accountNumber });
  }

  if (type === 'debit' && account.balance < amount) {
    return res.status(400).json({ 
      error: 'Insufficient funds',
      available: account.balance,
      requested: amount
    });
  }

  // Process transaction
  if (type === 'credit') {
    account.balance += amount;
  } else if (type === 'debit') {
    account.balance -= amount;
  }
  account.updatedAt = new Date().toISOString();

  const transaction = {
    id: `TRN${String(transactionCounter++).padStart(3, '0')}`,
    type: type.toUpperCase(),
    date: new Date().toISOString(),
    description: description || `${type} transaction`,
    montant: type === 'credit' ? amount : -amount,
  };

  if (!history[accountNumber]) history[accountNumber] = [];
  history[accountNumber].push(transaction);

  res.status(201).json({
    message: 'Transaction processed successfully',
    transaction: transaction,
    account: account
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    message: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(port, host, () => {
  console.log('========================================');
  console.log('CBS Simulator Service Started');
  console.log('========================================');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('========================================');
  console.log('Available endpoints:');
  console.log('  GET  /                     - Health check');
  console.log('  GET  /health               - Health status');
  console.log('  GET  /cbs/customers        - List all customers');
  console.log('  GET  /cbs/accounts         - List all accounts');
  console.log('  GET  /cbs/customer/:id     - Get customer details');
  console.log('  GET  /cbs/account/:id      - Get account details');
  console.log('  GET  /cbs/account/:id/history - Get account history');
  console.log('  GET  /cbs/history/:id      - Get account with history');
  console.log('  POST /cbs/transfer         - Transfer between accounts');
  console.log('  GET  /api/accounts/:accountNumber - Get account by number');
  console.log('  GET  /api/balance/:accountNumber  - Get account balance');
  console.log('  POST /api/transactions     - Process transaction');
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});