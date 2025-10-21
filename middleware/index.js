const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const api = require('@opentelemetry/api');
const cors = require('cors'); // Importer cors

const app = express();
const port = 3000;

app.use(express.json());
// Allow dashboard service and NodePort origins for CORS
app.use(cors({
    // Reflect the request origin. This works with credentials and NodePort access.
    origin: true,
    credentials: true
}));

// --- Axios Client for CBS ---
const cbsClient = axios.create({
    baseURL: process.env.CBS_SIMULATOR_URL || 'http://cbs-simulator-service:4000',
});

// Interceptor to measure response time for logging
cbsClient.interceptors.request.use(config => {
    config.headers['x-request-start-time'] = Date.now();
    return config;
});

cbsClient.interceptors.response.use(response => {
    const startTime = response.config.headers['x-request-start-time'];
    response.headers['x-response-time'] = Date.now() - startTime;
    return response;
}, error => {
    if (error.config && error.config.headers['x-request-start-time']) {
        const startTime = error.config.headers['x-request-start-time'];
        if (error.response) {
            error.response.headers['x-response-time'] = Date.now() - startTime;
        }
    }
    return Promise.reject(error);
});

// --- Logging ---
// Custom token to log CBS response time
morgan.token('cbs-response-time', (req, res) => {
    // res.locals is not shared with interceptors, so we attach time to the response header itself
    const time = res.getHeader('X-CBS-Response-Time');
    return time ? `${time}ms` : '-';
});

// Custom token for CBS status
morgan.token('cbs-status', (req, res) => res.getHeader('X-CBS-Status') || '-');

// Custom token for trace ID
morgan.token('traceid', (req, res) => {
    const span = api.trace.getSpan(api.context.active());
    if (!span) return '-';
    return span.spanContext().traceId;
});

// Custom token for span ID
morgan.token('spanid', (req, res) => {
    const span = api.trace.getSpan(api.context.active());
    if (!span) return '-';
    return span.spanContext().spanId;
});

app.use(morgan('[:date[clf]] :method :url :status | trace_id=:traceid span_id=:spanid | CBS Status: :cbs-status | CBS Time: :cbs-response-time'));


// --- Swagger ---
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Middleware API',
            version: '1.0.0',
            description: 'API for interacting with the CBS Simulator. Cette API sert de passerelle entre le front-end et le simulateur de système bancaire central (CBS).',
        },
    servers: [{ url: `http://localhost:${process.env.PORT || port}` }],
        tags: [
            { name: 'Monitoring', description: 'Endpoints for health checks and metrics.' },
            { name: 'Customers', description: 'Operations related to customers.' },
            { name: 'Accounts', description: 'Operations related to bank accounts.' },
            { name: 'Transactions', description: 'Operations related to financial transactions.' }
        ],
        components: {
            schemas: {
                // SCHEMAS EXISTANTS (PEUVENT ÊTRE MIS À JOUR)
                Account: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: "Unique account ID (e.g., 'A001')." },
                        customerId: { type: 'string', description: "Owner customer ID (e.g., 'C001')." },
                        type: { type: 'string', description: "Account type (e.g., 'Compte Courant')." },
                        iban: { type: 'string', description: 'IBAN of the account.' },
                        balance: { type: 'number', description: 'The account balance.' },
                        currency: { type: 'string', description: 'Currency of the balance (e.g., TND).' },
                        createdAt: { type: 'string', format: 'date-time', description: 'Account creation date.' },
                        updatedAt: { type: 'string', format: 'date-time', description: 'Last account update date.' }
                    }
                },
                Customer: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: "Unique customer ID (e.g., 'C001')." },
                        prenom: { type: 'string', description: "Customer's first name." },
                        nom: { type: 'string', description: "Customer's last name." },
                        adresse: { type: 'string', description: "Customer's address." },
                        email: { type: 'string', format: 'email', description: "Customer's email." },
                        telephone: { type: 'string', description: "Customer's phone number." }
                    }
                },
                CustomerWithAccounts: {
                    type: 'object',
                    allOf: [
                        { $ref: '#/components/schemas/Customer' },
                        {
                            type: 'object',
                            properties: {
                                accounts: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/Account' },
                                    description: "List of the customer's accounts."
                                }
                            }
                        }
                    ]
                },
                Transaction: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'Unique transaction ID.' },
                        type: { type: 'string', enum: ['CRÉDIT', 'DÉBIT'], description: 'Transaction type.' },
                        date: { type: 'string', format: 'date-time', description: 'Date of the transaction.' },
                        description: { type: 'string', description: 'Description of the transaction.' },
                        montant: { type: 'number', description: 'Transaction amount (positive for credit, negative for debit).' }
                    }
                },
                TransferRequest: {
                    type: 'object',
                    required: ['from', 'to', 'amount'],
                    properties: {
                        from: { type: 'string', description: "Source account ID (e.g., 'A001')." },
                        to: { type: 'string', description: "Destination account ID (e.g., 'A002')." },
                        amount: { type: 'number', description: 'Amount to transfer (must be positive).' },
                        description: { type: 'string', description: 'Optional description for the transfer.' }
                    }
                },
                TransferResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Transfer successful' },
                        sourceAccount: { $ref: '#/components/schemas/Account' },
                        targetAccount: { $ref: '#/components/schemas/Account' },
                        debitTransaction: { $ref: '#/components/schemas/Transaction' },
                        creditTransaction: { $ref: '#/components/schemas/Transaction' }
                    }
                },
                Health: {
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'OK' },
                        version: { type: 'string', example: '1.0.0' },
                        uptime: { type: 'number', description: 'Service uptime in seconds.' }
                    }
                },
                Metrics: {
                    type: 'object',
                    properties: {
                        uptime: { type: 'number', description: 'Service uptime in seconds.' },
                        memory: {
                            type: 'object',
                            properties: {
                                rss: { type: 'integer' },
                                heapTotal: { type: 'integer' },
                                heapUsed: { type: 'integer' },
                                external: { type: 'integer' }
                            }
                        },
                        cpu: {
                            type: 'object',
                            properties: {
                                user: { type: 'integer' },
                                system: { type: 'integer' }
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', description: 'Description of the error.' }
                    }
                }
            }
        }
    },
    apis: ['./index.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// --- API Routes ---

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Checks the health status of the service
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: The service is up and running.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Health'
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        version: '1.0.0',
        uptime: process.uptime()
    });
});

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Retrieves service performance metrics in Prometheus format
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: Performance metrics.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Metrics'
 */
app.get('/metrics', (req, res) => {
    const memoryUsage = process.memoryUsage();
    res.status(200).json({
        uptime: process.uptime(),
        memory: {
            rss: memoryUsage.rss,
            heapTotal: memoryUsage.heapTotal,
            heapUsed: memoryUsage.heapUsed,
            external: memoryUsage.external,
        },
        cpu: process.cpuUsage(),
    });
});


/**
 * @swagger
 * /customers/{id}:
 *   get:
 *     summary: Retrieves the details of a customer, including their accounts
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID (e.g., C001)
 *     responses:
 *       200:
 *         description: Details of the customer and their accounts.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerWithAccounts'
 *       404:
 *         description: Customer not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/customers/:id', async (req, res) => {
    const customerId = req.params.id;
    const tracer = api.trace.getTracer('middleware-tracer');
    const span = tracer.startSpan('cbs-request', { attributes: { 'cbs.method': 'getCustomer' } });

    try {
        const response = await cbsClient.get(`/cbs/customer/${customerId}`);
        res.status(response.status).json(response.data);
        span.setAttributes({ 'cbs.status': response.status });
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ message: error.message });
        span.setAttributes({ 'cbs.status': status, 'error': true });
    } finally {
        span.end();
    }
});

/**
 * @swagger
 * /accounts/{id}:
 *   get:
 *     summary: Retrieves the details of a bank account
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID (e.g., A001)
 *     responses:
 *       200:
 *         description: Account details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       404:
 *         description: Account not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/accounts/:id', async (req, res) => {
    const accountId = req.params.id;
    const tracer = api.trace.getTracer('middleware-tracer');
    const span = tracer.startSpan('cbs-request', { attributes: { 'cbs.method': 'getAccount' } });

    try {
        const response = await cbsClient.get(`/cbs/account/${accountId}`);
        res.status(response.status).json(response.data);
        span.setAttributes({ 'cbs.status': response.status });
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ message: error.message });
        span.setAttributes({ 'cbs.status': status, 'error': true });
    } finally {
        span.end();
    }
});


/**
 * @swagger
 * /accounts/{id}/history:
 *   get:
 *     summary: Retrieves the transaction history of an account
 *     tags: [Accounts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID (e.g., A001)
 *     responses:
 *       200:
 *         description: A list of transactions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Account not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/accounts/:id/history', async (req, res) => {
    const accountId = req.params.id;
    const tracer = api.trace.getTracer('middleware-tracer');
    const span = tracer.startSpan('cbs-request', { attributes: { 'cbs.method': 'getHistory' } });

    try {
        const response = await cbsClient.get(`/cbs/account/${accountId}/history`);
        res.status(response.status).json(response.data);
        span.setAttributes({ 'cbs.status': response.status });
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ message: error.message });
        span.setAttributes({ 'cbs.status': status, 'error': true });
    } finally {
        span.end();
    }
});

/**
 * @swagger
 * /transfer:
 *   post:
 *     summary: Executes a transfer between two accounts
 *     tags: [Transactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TransferRequest'
 *     responses:
 *       200:
 *         description: Transfer successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TransferResponse'
 *       400:
 *         description: Invalid transfer data (e.g., missing fields, insufficient funds).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Source or destination account not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/transfer', async (req, res) => {
    const { from, to, amount, description } = req.body;
    const tracer = api.trace.getTracer('middleware-tracer');
    const span = tracer.startSpan('cbs-request', { attributes: { 'cbs.method': 'transfer' } });

    try {
        const response = await cbsClient.post('/cbs/transfer', { from, to, amount, description });
        res.status(response.status).json(response.data);
        span.setAttributes({ 'cbs.status': response.status });
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        res.status(status).json({ message: error.message });
        span.setAttributes({ 'cbs.status': status, 'error': true });
    } finally {
        span.end();
    }
});



// =====================
// Additional Middleware Endpoints (Integrated)
// =====================

// Root endpoint (API info)
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'CBS Middleware API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            accounts: '/api/accounts/:accountNumber',
            transactions: '/api/transactions',
            balance: '/api/balance/:accountNumber'
        }
    });
});

// Proxy to CBS Simulator - Account lookup (by accountNumber)
app.get('/api/accounts/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;
        console.log(`Fetching account ${accountNumber} from CBS Simulator`);
    const response = await axios.get(`${process.env.CBS_SIMULATOR_URL || 'http://cbs-simulator-service:4000'}/api/accounts/${accountNumber}`, { timeout: 5000 });
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching account:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch account',
            message: error.message
        });
    }
});

// Proxy to CBS Simulator - Transaction processing
app.post('/api/transactions', async (req, res) => {
    try {
        const transaction = req.body;
        console.log('Processing transaction:', transaction);
    const response = await axios.post(`${process.env.CBS_SIMULATOR_URL || 'http://cbs-simulator-service:4000'}/api/transactions`, transaction, { timeout: 5000 });
        res.status(201).json(response.data);
    } catch (error) {
        console.error('Error processing transaction:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to process transaction',
            message: error.message
        });
    }
});

// Proxy to CBS Simulator - Balance inquiry
app.get('/api/balance/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;
        console.log(`Fetching balance for account ${accountNumber}`);
    const response = await axios.get(`${process.env.CBS_SIMULATOR_URL || 'http://cbs-simulator-service:4000'}/api/balance/${accountNumber}`, { timeout: 5000 });
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching balance:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Failed to fetch balance',
            message: error.message
        });
    }
});

// Middleware-specific business logic endpoints

// Validate transaction before sending to CBS
app.post('/api/validate-transaction', async (req, res) => {
    try {
        const transaction = req.body;
        if (!transaction.amount || transaction.amount <= 0) {
            return res.status(400).json({
                error: 'Invalid transaction',
                message: 'Amount must be greater than 0'
            });
        }
        if (!transaction.accountNumber) {
            return res.status(400).json({
                error: 'Invalid transaction',
                message: 'Account number is required'
            });
        }
        res.status(200).json({
            valid: true,
            message: 'Transaction is valid',
            transaction: transaction
        });
    } catch (error) {
        console.error('Validation error:', error.message);
        res.status(500).json({
            error: 'Validation failed',
            message: error.message
        });
    }
});

// Example: Get transaction history (mocked)
app.get('/api/transactions/:accountNumber', async (req, res) => {
    try {
        const { accountNumber } = req.params;
        const transactions = [
            {
                id: 'TXN-001',
                accountNumber: accountNumber,
                type: 'credit',
                amount: 500.00,
                timestamp: new Date().toISOString(),
                description: 'Deposit'
            },
            {
                id: 'TXN-002',
                accountNumber: accountNumber,
                type: 'debit',
                amount: 200.00,
                timestamp: new Date().toISOString(),
                description: 'Withdrawal'
            }
        ];
        res.status(200).json({
            accountNumber: accountNumber,
            transactions: transactions,
            count: transactions.length
        });
    } catch (error) {
        console.error('Error fetching transactions:', error.message);
        res.status(500).json({
            error: 'Failed to fetch transactions',
            message: error.message
        });
    }
});

// Error handling middleware (after all routes)
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

// Start server (preserve existing port logic)
const PORT = process.env.PORT || port;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`========================================`);
    console.log(`CBS Middleware Service Started`);
    console.log(`========================================`);
    console.log(`Port: ${PORT}`);
    console.log(`Host: ${HOST}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`CBS Simulator URL: ${process.env.CBS_SIMULATOR_URL || 'http://cbs-simulator-service:4000'}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`========================================`);
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