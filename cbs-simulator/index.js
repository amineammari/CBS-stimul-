const express = require('express');
const app = express();
const port = 30003;

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
    createdAt: new Date(now.setDate(now.getDate() - 365)).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'A002': { 
    id: 'A002', 
    customerId: 'C001', 
    type: 'Compte Épargne',
    iban: 'TN59 1000 6035 0000 0789 0123 45',
    balance: 125000.00, 
    currency: 'TND',
    createdAt: new Date(now.setDate(now.getDate() - 730)).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'A003': { 
    id: 'A003', 
    customerId: 'C002', 
    type: 'Compte Courant',
    iban: 'TN59 1400 3051 0000 0987 6543 21',
    balance: 7230.50, 
    currency: 'TND',
    createdAt: new Date(now.setDate(now.getDate() - 180)).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'A004': {
    id: 'A004',
    customerId: 'C003',
    type: 'Compte Courant',
    iban: 'TN59 1200 8091 0000 0543 2167 89',
    balance: 21500.00,
    currency: 'TND',
    createdAt: new Date(now.setDate(now.getDate() - 90)).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  'A005': {
    id: 'A005',
    customerId: 'C004',
    type: 'Compte Courant',
    iban: 'TN59 1100 7061 0000 0876 5432 10',
    balance: 9800.25,
    currency: 'TND',
    createdAt: new Date(now.setDate(now.getDate() - 45)).toISOString(),
    updatedAt: new Date().toISOString(),
  },
    'A006': {
    id: 'A006',
    customerId: 'C004',
    type: 'Compte Épargne',
    iban: 'TN59 1100 7061 0000 0112 2334 45',
    balance: 50000.00,
    currency: 'TND',
    createdAt: new Date(now.setDate(now.getDate() - 45)).toISOString(),
    updatedAt: new Date().toISOString(),
  }
};

const history = {
  'A001': [
    { id: 'TRN001', type: 'DÉBIT', date: new Date(now.setDate(now.getDate() - 5)).toISOString(), description: 'Paiement Facture STEG', montant: -120.50 },
    { id: 'TRN002', type: 'DÉBIT', date: new Date(now.setDate(now.getDate() - 3)).toISOString(), description: 'Achat en ligne Jumia', montant: -345.00 },
    { id: 'TRN003', type: 'CRÉDIT', date: new Date(now.setDate(now.getDate() - 1)).toISOString(), description: 'Virement Salaire', montant: 4500.00 },
  ],
  'A002': [
    { id: 'TRN004', type: 'CRÉDIT', date: new Date(now.setDate(now.getDate() - 30)).toISOString(), description: 'Dépôt initial', montant: 100000.00 },
    { id: 'TRN005', type: 'CRÉDIT', date: new Date(now.setDate(now.getDate() - 15)).toISOString(), description: 'Intérêts annuels', montant: 2500.00 },
  ],
  'A003': [
    { id: 'TRN006', type: 'CRÉDIT', date: new Date(now.setDate(now.getDate() - 10)).toISOString(), description: 'Virement de "Ahmed"', montant: 800.00 },
    { id: 'TRN007', type: 'DÉBIT', date: new Date(now.setDate(now.getDate() - 2)).toISOString(), description: 'Retrait GAB', montant: -200.00 },
  ],
  'A004': [
    { id: 'TRN008', type: 'CRÉDIT', date: new Date(now.setDate(now.getDate() - 20)).toISOString(), description: 'Virement international', montant: 15000.00 },
    { id: 'TRN009', type: 'DÉBIT', date: new Date(now.setDate(now.getDate() - 5)).toISOString(), description: 'Paiement restaurant', montant: -150.00 },
  ],
  'A005': [
    { id: 'TRN010', type: 'CRÉDIT', date: new Date(now.setDate(now.getDate() - 12)).toISOString(), description: 'Dépôt chèque', montant: 2000.00 },
  ],
  'A006': [
    { id: 'TRN011', type: 'CRÉDIT', date: new Date(now.setDate(now.getDate() - 40)).toISOString(), description: 'Dépôt initial', montant: 50000.00 },
  ]
};

// --- Routes ---
// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'CBS Simulator', 
    timestamp: new Date().toISOString() 
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'CBS Simulator', 
    timestamp: new Date().toISOString() 
  });
});

app.get('/cbs/account/:id', (req, res) => {
  const account = accounts[req.params.id];
  if (account) {
    res.json(account);
  } else {
    res.status(404).send('Account not found');
  }
});

app.post('/cbs/transfer', (req, res) => {
  const { from, to, amount, description } = req.body;
  if (!from || !to || !amount) {
    return res.status(400).send('Missing transfer details');
  }

  const fromAccount = accounts[from];
  const toAccount = accounts[to];

  if (!fromAccount || !toAccount) {
    return res.status(404).send('One or more accounts not found');
  }

  if (fromAccount.balance < amount) {
    return res.status(400).send('Insufficient funds');
  }

  fromAccount.balance -= amount;
  toAccount.balance += amount;

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

app.get('/cbs/customer/:id', (req, res) => {
  const customerId = req.params.id;
  const customer = customers[customerId];
  
  if (customer) {
    const customerAccounts = Object.values(accounts).filter(
      (acc) => acc.customerId === customerId
    );
    res.json({ ...customer, accounts: customerAccounts });
  } else {
    res.status(404).send('Customer not found');
  }
});

app.get('/cbs/account/:id/history', (req, res) => {
  const accountId = req.params.id;
  const accountHistory = history[accountId];

  if (accountHistory) {
    res.json(accountHistory);
  } else {
    // Si le compte existe mais n'a pas d'historique, retourner un tableau vide.
    if (accounts[accountId]) {
      res.json([]);
    } else {
      res.status(404).send('Account not found');
    }
  }
});

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
    res.status(404).send('Account not found');
  }
});

app.listen(port, () => {
  console.log(`CBS Simulator listening at http://192.168.72.128:${port}`);
}); 