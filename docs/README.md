# CBS (Core Banking System) - Middleware Architecture

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-lightgrey.svg)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![OpenTelemetry](https://img.shields.io/badge/OpenTelemetry-Integrated-orange.svg)](https://opentelemetry.io/)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()
[![Last Updated](https://img.shields.io/badge/Last%20Updated-August%202025-blue.svg)]()

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Components](#-components)
- [API Documentation](#-api-documentation)
- [Mock Data](#-mock-data)
- [Installation & Setup](#-installation--setup)
- [Testing Scenarios](#-testing-scenarios)
- [Monitoring & Observability](#-monitoring--observability)
- [Docker Deployment](#-docker-deployment)
- [Development Guidelines](#-development-guidelines)
- [Troubleshooting](#-troubleshooting)
- [Changelog](#-changelog)

## 🎯 Overview

The CBS (Core Banking System) Middleware is a comprehensive banking system simulation that provides a complete middleware layer between front-end applications and core banking services. This project demonstrates modern microservices architecture with observability, monitoring, and real-time performance tracking.

### Key Features

- **🏦 Complete Banking Operations**: Account management, customer consultation, money transfers
- **🔄 Real-time Monitoring**: Live performance metrics and health checks
- **📊 Interactive Dashboard**: React-based administrative interface with modern UI
- **🔍 Distributed Tracing**: OpenTelemetry integration for request tracking
- **🛡️ Error Handling**: Comprehensive error management and logging
- **📱 Responsive UI**: Modern Ant Design components with mobile support
- **🐳 Containerization**: Docker support for easy deployment
- **⚡ High Performance**: Optimized for production environments
- **🔒 Secure**: CORS-enabled with input validation
- **📈 Scalable**: Microservices architecture for horizontal scaling

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Dashboard     │◄──►│   Middleware    │◄──►│  CBS Simulator  │
│   (Port 3001)   │    │   (Port 3000)   │    │   (Port 4000)   │
│                 │    │                 │    │                 │
│  React + Antd   │    │  Express.js     │    │   Express.js    │
│  Recharts       │    │  OpenTelemetry  │    │   Mock Data     │
│  Axios Client   │    │  Swagger UI     │    │   JSON Store    │
│                 │    │  CORS Enabled   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Frontend (Dashboard)** → Makes HTTP requests to Middleware API
2. **Middleware** → Processes requests, adds tracing, forwards to CBS Simulator
3. **CBS Simulator** → Returns mock banking data and performs operations
4. **Middleware** → Logs performance metrics, returns response to Frontend
5. **Dashboard** → Updates UI with real-time data and charts

## 📁 Project Structure

```
CBS-Core-Banking-System-Intechgeeks/
├── 📄 package.json                     # Root package.json for monorepo
├── 📄 docker-compose.yml              # Docker orchestration
├── 📄 .gitignore                      # Git ignore rules
│
├── 📁 middleware/                      # API Gateway & Business Logic
│   ├── 📄 package.json               # Middleware dependencies
│   ├── 📄 index.js                   # Main Express server
│   └── 📄 tracing.js                 # OpenTelemetry configuration
│
├── 📁 cbs-simulator/                   # Core Banking System Simulator
│   ├── 📄 package.json               # Simulator dependencies
│   ├── 📄 index.js                   # Mock banking server
│   └── 📄 Dockerfile                 # Container configuration
│
├── 📁 dashboard/                       # Frontend React Application
│   ├── 📄 package.json               # React dependencies
│   ├── 📁 public/
│   │   └── 📄 index.html             # HTML template
│   └── 📁 src/
│       ├── 📄 index.js               # React entry point
│       ├── 📄 App.js                 # Main App component
│       ├── 📄 Dashboard.js           # Main Dashboard component
│       ├── 📁 components/            # React components
│       │   ├── 📄 TransferForm.js    # Money transfer form
│       │   ├── 📄 AccountConsultation.js    # Account lookup
│       │   ├── 📄 CustomerConsultation.js   # Customer lookup
│       │   └── 📄 TransactionHistory.js     # Transaction history
│       └── 📁 services/
│           └── 📄 api.js             # API client services
│
└── 📁 docs/                           # Documentation
    └── 📄 README.md                  # This file
```

## 🔧 Components

### 1. Middleware (API Gateway)
**Port**: 3000  
**Technology**: Node.js + Express.js + OpenTelemetry

**Responsibilities**:
- API Gateway between frontend and CBS
- Request/Response logging with custom Morgan tokens
- Distributed tracing with OpenTelemetry
- Performance metrics collection
- CORS handling
- Swagger API documentation
- Error handling and status propagation

**Key Dependencies**:
- `express`: Web framework
- `axios`: HTTP client for CBS communication
- `@opentelemetry/*`: Distributed tracing
- `swagger-jsdoc` & `swagger-ui-express`: API documentation
- `morgan`: HTTP request logger
- `cors`: Cross-Origin Resource Sharing

### 2. CBS Simulator (Mock Backend)
**Port**: 4000  
**Technology**: Node.js + Express.js

**Responsibilities**:
- Simulate core banking operations
- Manage mock customer and account data
- Process money transfers with validation
- Maintain transaction history
- Provide realistic banking scenarios

**Mock Data Includes**:
- 4 Customers (C001-C004) with Tunisian demographics
- 6 Accounts (A001-A006) with different types
- Pre-populated transaction history
- IBAN format compliance (Tunisian standard)

### 3. Dashboard (Frontend)
**Port**: 3001 (React dev server)  
**Technology**: React 18 + Ant Design + Recharts

**Features**:
- Real-time system monitoring dashboard
- Interactive banking operations forms
- Customer and account consultation
- Transaction history visualization
- Performance charts and metrics
- Responsive design

**Main Components**:
- **SupervisionDashboard**: Real-time metrics and charts
- **TransferForm**: Money transfer interface
- **AccountConsultation**: Account lookup and details
- **CustomerConsultation**: Customer information viewer
- **TransactionHistory**: Transaction timeline and filtering

## 📡 API Documentation

### Base URLs
- **Middleware API**: `http://localhost:3000`
- **CBS Simulator**: `http://localhost:4000`
- **Interactive Documentation**: `http://localhost:3000/api-docs`

### Endpoints

#### Monitoring Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| `GET` | `/health` | Service health check | `200`: Service status |
| `GET` | `/metrics` | Performance metrics | `200`: Memory, CPU, uptime data |

#### Customer Operations

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/customers/{id}` | Get customer details with accounts | `id`: Customer ID (C001-C004) | `200`: Customer + accounts list |

#### Account Operations

| Method | Endpoint | Description | Parameters | Response |
|--------|----------|-------------|------------|----------|
| `GET` | `/accounts/{id}` | Get account details | `id`: Account ID (A001-A006) | `200`: Account information |
| `GET` | `/accounts/{id}/history` | Get transaction history | `id`: Account ID | `200`: Transaction array |

#### Transaction Operations

| Method | Endpoint | Description | Body | Response |
|--------|----------|-------------|------|----------|
| `POST` | `/transfer` | Execute money transfer | Transfer request object | `200`: Transfer result |

### Request/Response Examples

#### Get Customer Details
```bash
GET /customers/C001
```

**Response**:
```json
{
  "id": "C001",
  "prenom": "Mohamed",
  "nom": "Ben Ali",
  "adresse": "12 Rue de Carthage, 2000 Le Bardo, Tunis",
  "email": "mohamed.benali@email.tn",
  "telephone": "+216 98 123 456",
  "accounts": [
    {
      "id": "A001",
      "customerId": "C001",
      "type": "Compte Courant",
      "iban": "TN59 1000 6035 0000 0123 4567 89",
      "balance": 15850.75,
      "currency": "TND"
    }
  ]
}
```

#### Execute Transfer
```bash
POST /transfer
Content-Type: application/json

{
  "from": "A001",
  "to": "A003",
  "amount": 500.00,
  "description": "Payment for services"
}
```

**Response**:
```json
{
  "message": "Transfer successful",
  "sourceAccount": {
    "id": "A001",
    "balance": 15350.75
  },
  "targetAccount": {
    "id": "A003",
    "balance": 7730.50
  },
  "debitTransaction": {
    "id": "TRN012",
    "type": "DÉBIT",
    "montant": -500.00,
    "description": "Payment for services"
  },
  "creditTransaction": {
    "id": "TRN013",
    "type": "CRÉDIT",
    "montant": 500.00,
    "description": "Payment for services"
  }
}
```

## 💾 Mock Data

### Customers
| ID | Name | Location | Email | Phone |
|----|------|----------|-------|-------|
| C001 | Mohamed Ben Ali | Le Bardo, Tunis | mohamed.benali@email.tn | +216 98 123 456 |
| C002 | Fatima El Fihri | Sousse | fatima.elfihri@email.tn | +216 22 789 012 |
| C003 | Ali Trabelsi | Tunis | ali.trabelsi@email.com | +216 55 123 789 |
| C004 | Aisha Bouslama | Sfax | aisha.bouslama@email.com | +216 21 987 654 |

### Accounts
| ID | Customer | Type | IBAN | Balance (TND) |
|----|----------|------|------|---------------|
| A001 | C001 | Compte Courant | TN59 1000 6035 0000 0123 4567 89 | 15,850.75 |
| A002 | C001 | Compte Épargne | TN59 1000 6035 0000 0789 0123 45 | 125,000.00 |
| A003 | C002 | Compte Courant | TN59 1400 3051 0000 0987 6543 21 | 7,230.50 |
| A004 | C003 | Compte Courant | TN59 1200 8091 0000 0543 2167 89 | 21,500.00 |
| A005 | C004 | Compte Courant | TN59 1100 7061 0000 0876 5432 10 | 9,800.25 |
| A006 | C004 | Compte Épargne | TN59 1100 7061 0000 0112 2334 45 | 50,000.00 |

### Sample Transactions
Each account has pre-populated transaction history including:
- Salary payments (CRÉDIT)
- Utility bill payments (DÉBIT)
- Online purchases (DÉBIT)
- Bank transfers (CRÉDIT/DÉBIT)
- ATM withdrawals (DÉBIT)
- Interest payments (CRÉDIT)

## 🚀 Installation & Setup

### 🏃‍♂️ Quick Start

```bash
# Clone and setup in one command
git clone https://github.com/ahmedjallabi/CBS-Core-Banking-System-Intechgeeks.git
cd CBS-Core-Banking-System-Intechgeeks
npm install && cd middleware && npm install && cd ../cbs-simulator && npm install && cd ../dashboard && npm install && cd ..
npm start
```

**Then access**:
- 🌐 **Dashboard**: http://localhost:3001
- 📖 **API Docs**: http://localhost:3000/api-docs

### Prerequisites
- **Node.js**: Version 18 or higher (LTS recommended)
- **npm**: Version 8 or higher
- **Docker**: Version 20+ (Optional) For containerized deployment
- **Git**: For version control
- **OS**: Windows 10/11, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Port Requirements**: Ensure ports 3000, 3001, and 4000 are available

### Local Development Setup

1. **Clone the repository**:
```bash
git clone https://github.com/ahmedjallabi/CBS-Core-Banking-System-Intechgeeks.git
cd CBS-Core-Banking-System-Intechgeeks
```

2. **Install root dependencies**:
```bash
npm install
```

3. **Install dependencies for all services**:
```bash
# Middleware dependencies
cd middleware && npm install && cd ..

# CBS Simulator dependencies  
cd cbs-simulator && npm install && cd ..

# Dashboard dependencies
cd dashboard && npm install && cd ..
```

4. **Start all services**:
```bash
# From root directory - starts all services concurrently
npm start
```

**✅ Success Indicators**:
- CBS Simulator: `CBS Simulator listening at http://localhost:4000`
- Middleware: `Middleware listening at http://localhost:3000`
- Dashboard: `webpack compiled successfully` + opens browser automatically

**Note**: The dashboard will automatically start on port 3001 to avoid conflicts with the middleware API on port 3000.

**Alternative: Start services individually**:
```bash
# Terminal 1: Start CBS Simulator
cd cbs-simulator && npm start

# Terminal 2: Start Middleware  
cd middleware && npm start

# Terminal 3: Start Dashboard (will run on port 3001)
cd dashboard && npm start
```

### Service URLs
- **Dashboard**: http://localhost:3001 (React App)
- **Middleware API**: http://localhost:3000 (API Endpoints)
- **API Documentation**: http://localhost:3000/api-docs (Swagger UI)
- **CBS Simulator**: http://localhost:4000 (Backend API)

**Important**: The dashboard runs on port 3001 to avoid conflicts with the middleware API on port 3000. Make sure to access the dashboard at the correct URL.

### 🔍 Verification Steps

After starting all services, verify everything is working:

1. **Health Check**: Visit http://localhost:3000/health
2. **API Documentation**: Visit http://localhost:3000/api-docs
3. **Dashboard**: Visit http://localhost:3001
4. **Test API Call**:
   ```bash
   curl http://localhost:3000/customers/C001
   ```

### 🛑 Stopping Services

```bash
# Stop all services
Ctrl+C (in the terminal running npm start)

# Or stop individual services
pkill -f "node.*middleware"
pkill -f "node.*cbs-simulator"
pkill -f "react-scripts"
```

## 🧪 Testing Scenarios

### Postman Collection

#### 1. Health Check Scenarios

**Basic Health Check**:
```bash
GET http://localhost:3000/health
```
Expected: `200 OK` with service status

**Metrics Collection**:
```bash
GET http://localhost:3000/metrics
```
Expected: Memory, CPU, and uptime metrics

#### 2. Customer Consultation Scenarios

**Valid Customer Lookup**:
```bash
GET http://localhost:3000/customers/C001
```
Expected: Customer details with associated accounts

**Invalid Customer ID**:
```bash
GET http://localhost:3000/customers/C999
```
Expected: `404 Not Found`

#### 3. Account Operations Scenarios

**Valid Account Query**:
```bash
GET http://localhost:3000/accounts/A001
```
Expected: Account details including balance

**Account Transaction History**:
```bash
GET http://localhost:3000/accounts/A001/history
```
Expected: Array of transactions

**Non-existent Account**:
```bash
GET http://localhost:3000/accounts/A999
```
Expected: `404 Not Found`

#### 4. Money Transfer Scenarios

**Successful Transfer**:
```json
POST http://localhost:3000/transfer
Content-Type: application/json

{
  "from": "A001",
  "to": "A003", 
  "amount": 100.00,
  "description": "Test transfer"
}
```
Expected: `200 OK` with updated balances

**Insufficient Funds**:
```json
POST http://localhost:3000/transfer
Content-Type: application/json

{
  "from": "A001",
  "to": "A003",
  "amount": 999999.00,
  "description": "Large transfer"
}
```
Expected: `400 Bad Request` - Insufficient funds

**Invalid Account Transfer**:
```json
POST http://localhost:3000/transfer
Content-Type: application/json

{
  "from": "A999",
  "to": "A003",
  "amount": 100.00,
  "description": "Invalid account"
}
```
Expected: `404 Not Found` - Account not found

**Missing Transfer Data**:
```json
POST http://localhost:3000/transfer
Content-Type: application/json

{
  "from": "A001",
  "amount": 100.00
}
```
Expected: `400 Bad Request` - Missing required fields

### Test Automation Script

Create a test file `test-scenarios.js`:

```javascript
const axios = require('axios');

const baseURL = 'http://localhost:3000';
const api = axios.create({ baseURL });

async function runTests() {
  console.log('🚀 Starting CBS API Tests...\n');
  
  // Test 1: Health Check
  try {
    const health = await api.get('/health');
    console.log('✅ Health Check:', health.data.status);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }
  
  // Test 2: Customer Lookup
  try {
    const customer = await api.get('/customers/C001');
    console.log('✅ Customer Lookup:', customer.data.nom);
  } catch (error) {
    console.log('❌ Customer Lookup Failed:', error.message);
  }
  
  // Test 3: Account Details
  try {
    const account = await api.get('/accounts/A001');
    console.log('✅ Account Details:', account.data.balance);
  } catch (error) {
    console.log('❌ Account Details Failed:', error.message);
  }
  
  // Test 4: Money Transfer
  try {
    const transfer = await api.post('/transfer', {
      from: 'A001',
      to: 'A003',
      amount: 10.00,
      description: 'Test transfer'
    });
    console.log('✅ Money Transfer:', transfer.data.message);
  } catch (error) {
    console.log('❌ Money Transfer Failed:', error.response?.data || error.message);
  }
}

runTests();
```

Run with: `node test-scenarios.js`

## 📊 Monitoring & Observability

### OpenTelemetry Integration

The middleware includes comprehensive tracing capabilities:

**Custom Span Attributes**:
- `cbs.method`: Type of CBS operation
- `cbs.status`: Response status from CBS
- `error`: Error flag for failed requests

**Custom Morgan Tokens**:
- `cbs-response-time`: CBS processing time
- `cbs-status`: CBS response status
- `traceid`: OpenTelemetry trace ID
- `spanid`: OpenTelemetry span ID

### Performance Metrics

**Real-time Dashboard Metrics**:
- Service uptime in minutes
- Memory usage (RSS, Heap Used, Heap Total)
- CPU utilization
- Response time trends
- Live performance charts

**Log Format**:
```
[01/Aug/2025:10:15:30 +0000] GET /customers/C001 200 | trace_id=1234567890abcdef span_id=abcdef1234567890 | CBS Status: 200 | CBS Time: 45ms
```

### Health Checks

**Health Endpoint Response**:
```json
{
  "status": "OK",
  "version": "1.0.0", 
  "uptime": 3600.5
}
```

**Metrics Endpoint Response**:
```json
{
  "uptime": 3600.5,
  "memory": {
    "rss": 50331648,
    "heapTotal": 29360128,
    "heapUsed": 20971520,
    "external": 1638400
  },
  "cpu": {
    "user": 125000,
    "system": 50000
  }
}
```

## 🐳 Docker Deployment

### Docker Compose Setup

The project includes a `docker-compose.yml` for easy deployment:

```yaml
version: '3.8'

services:
  cbs-simulator:
    build:
      context: ./cbs-simulator
      dockerfile: Dockerfile
    container_name: cbs-simulator
    restart: unless-stopped
    ports:
      - "4000:4000"
    networks:
      - cbs-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/cbs/account/A001"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  cbs-net:
    driver: bridge
```

### Container Deployment

1. **Build and start services**:
```bash
docker-compose up --build
```

2. **Start in background**:
```bash
docker-compose up -d
```

3. **View logs**:
```bash
docker-compose logs -f cbs-simulator
```

4. **Stop services**:
```bash
docker-compose down
```

5. **Complete cleanup**:
```bash
docker-compose down -v --rmi all
```

### Production Docker Setup

For production deployment, create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  cbs-simulator:
    build:
      context: ./cbs-simulator
      dockerfile: Dockerfile
    container_name: cbs-simulator-prod
    restart: always
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    networks:
      - cbs-net
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

networks:
  cbs-net:
    driver: bridge
```

### CBS Simulator Dockerfile Features

- **Base Image**: Node.js 18 slim (security-focused)
- **Security**: Non-root user execution
- **Optimization**: Production-only dependencies with `npm ci`
- **Cache**: Efficient layer caching for faster builds
- **Port**: Exposes port 4000 (configurable via environment)
- **Health Checks**: Built-in container health monitoring

## 🛠️ Development Guidelines

### Code Structure Standards

**Middleware Layer**:
- Express.js route handlers with async/await
- OpenTelemetry span creation for each CBS request
- Custom Morgan tokens for comprehensive logging
- Swagger JSDoc comments for API documentation
- Error handling with proper HTTP status codes

**Frontend Components**:
- Functional React components with hooks
- Ant Design component library
- Responsive design principles
- API service layer separation
- Error boundaries and loading states

**Mock Data Management**:
- In-memory JSON data structures
- Realistic Tunisian banking data
- Transaction ID auto-generation
- Date/time handling with ISO strings
- Proper IBAN format validation

### Error Handling Strategy

**Middleware Error Handling**:
```javascript
try {
  const response = await cbsClient.get(`/cbs/customer/${customerId}`);
  res.status(response.status).json(response.data);
} catch (error) {
  const status = error.response ? error.response.status : 500;
  res.status(status).json({ message: error.message });
}
```

**Frontend Error Handling**:
```javascript
try {
  const customerData = await cbsAPI.getCustomer(values.customerId);
  setCustomer(customerData);
} catch (err) {
  setError(err.response?.data?.error || 'Erreur lors de la consultation du client');
}
```

### Performance Optimization

**Backend Optimizations**:
- Axios instance with base URL configuration
- Request/response time measurement
- Connection pooling (inherent in Node.js)
- JSON response compression

**Frontend Optimizations**:
- Component-level state management
- Debounced API calls
- Lazy loading for large datasets
- Chart data point limiting (last 20 points)

### Security Considerations

**CORS Configuration**:
- Enabled for all origins in development
- Should be restricted in production

**Input Validation**:
- Required field validation on transfer requests
- Numeric validation for amounts
- Account ID format validation

**Error Information Disclosure**:
- Generic error messages for client
- Detailed error logging server-side
- No sensitive data in error responses

### Future Enhancements

**Recommended Improvements**:
1. **Authentication & Authorization**: JWT-based API security with role-based access
2. **Database Integration**: Replace mock data with PostgreSQL/MongoDB
3. **Rate Limiting**: Implement request throttling and API quotas
4. **Caching**: Redis integration for frequently accessed data
5. **Message Queue**: Add async transaction processing with RabbitMQ/Apache Kafka
6. **Test Coverage**: Comprehensive unit and integration tests (Jest, Cypress)
7. **CI/CD Pipeline**: Automated deployment and testing with GitHub Actions
8. **Load Balancing**: Multiple instance support with NGINX
9. **Configuration Management**: Environment-based configs with Kubernetes
10. **Advanced Monitoring**: Prometheus/Grafana integration
11. **API Versioning**: Support for multiple API versions
12. **WebSocket Support**: Real-time notifications and updates
13. **Multi-language Support**: Internationalization (i18n)
14. **Mobile App**: React Native companion app
15. **Blockchain Integration**: Immutable transaction logging

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check which process is using port 3000/3001/4000
netstat -ano | findstr :3000
# Kill the process (Windows)
taskkill /PID <PID> /F
```

#### Node Modules Issues
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### CORS Errors
- Ensure middleware is running on port 3000
- Check that CORS is enabled in middleware/index.js
- Verify API URLs in dashboard/src/services/api.js

#### Docker Issues
```bash
# Reset Docker environment
docker-compose down -v
docker system prune -a
docker-compose up --build
```

### Performance Tips

1. **Development Mode**: Use `npm run dev` for hot-reloading
2. **Production Build**: Run `npm run build` for optimized builds
3. **Memory Usage**: Monitor with the `/metrics` endpoint
4. **Network**: Use HTTP/2 for better performance

---

## 📅 Changelog

### Version 1.2.0 (August 2025)
- ✅ **Port Configuration**: Dashboard moved to port 3001
- ✅ **Environment Variables**: Added .env support
- ✅ **Enhanced Documentation**: Updated README with troubleshooting
- ✅ **Cross-platform Support**: Improved Windows compatibility
- ✅ **Performance Monitoring**: Enhanced real-time metrics

### Version 1.1.0 (July 2025)
- ✅ **Initial Release**: Complete CBS middleware system
- ✅ **OpenTelemetry Integration**: Distributed tracing
- ✅ **Docker Support**: Containerized deployment
- ✅ **Swagger Documentation**: Interactive API docs
- ✅ **React Dashboard**: Modern UI with Ant Design

### Version 1.0.0 (June 2025)
- ✅ **MVP Release**: Basic banking operations
- ✅ **Mock Data**: Tunisian banking simulation
- ✅ **REST API**: Complete CRUD operations
- ✅ **Error Handling**: Comprehensive error management

## 📄 License

This project is licensed under the ISC License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request




**Last Updated**: August 1, 2025  

