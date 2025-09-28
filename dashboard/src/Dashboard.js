import React, { useState, useEffect } from 'react';
import { Layout, Card, Row, Col, Statistic, Progress, Alert, Spin, Tabs } from 'antd';
import { 
  BankOutlined, 
  UserOutlined, 
  TransactionOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  AreaChartOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cbsAPI } from './services/api';
import moment from 'moment';
import TransferForm from './components/TransferForm';
import AccountConsultation from './components/AccountConsultation';
import CustomerConsultation from './components/CustomerConsultation';
import TransactionHistory from './components/TransactionHistory';

const { Content } = Layout;
const { TabPane } = Tabs;

const SupervisionDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [metricsData, healthData] = await Promise.all([
          cbsAPI.getMetrics(),
          cbsAPI.getHealth()
        ]);
  
        setMetrics(metricsData);
        setHealth(healthData);
  
        const newDataPoint = {
          time: moment().format('HH:mm:ss'),
          uptime: Math.floor(metricsData.uptime / 60),
          memory: Math.round(metricsData.memory.heapUsed / 1024 / 1024),
          cpu: Math.round(metricsData.cpu.user / 1000000)
        };
  
        setPerformanceData(prev => {
          const newData = [...prev, newDataPoint];
          return newData.slice(-20);
        });
  
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des données du dashboard');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getUptimeColor = (uptime) => {
    if (uptime > 3600) return '#52c41a';
    if (uptime > 1800) return '#faad14';
    return '#ff4d4f';
  };

  const getMemoryColor = (memoryPercent) => {
    if (memoryPercent < 50) return '#52c41a';
    if (memoryPercent < 80) return '#faad14';
    return '#ff4d4f';
  };

  if (loading && !metrics) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Chargement du dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Card title="Statut du Service" style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Statut"
              value={health?.status || 'Inconnu'}
              valueStyle={{ color: health?.status === 'OK' ? '#52c41a' : '#ff4d4f' }}
              prefix={health?.status === 'OK' ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Version"
              value={health?.version || 'N/A'}
              prefix={<BankOutlined />}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Temps de fonctionnement"
              value={health?.uptime ? Math.floor(health.uptime / 60) : 0}
              suffix="minutes"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: getUptimeColor(health?.uptime || 0) }}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={8}>
          <Card title="Mémoire" size="small">
            <Statistic
              title="Utilisation"
              value={metrics?.memory ? Math.round(metrics.memory.heapUsed / 1024 / 1024) : 0}
              suffix="MB"
              valueStyle={{ color: getMemoryColor(metrics?.memory ? (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100 : 0) }}
            />
            <Progress
              percent={metrics?.memory ? Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100) : 0}
              strokeColor={getMemoryColor(metrics?.memory ? (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100 : 0)}
              size="small"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="CPU" size="small">
            <Statistic
              title="Utilisation"
              value={metrics?.cpu ? Math.round(metrics.cpu.user / 1000000) : 0}
              suffix="s"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Temps de réponse" size="small">
            <Statistic
              title="Moyenne"
              value={performanceData.length > 0 ? 
                Math.round(performanceData.reduce((acc, curr) => acc + curr.memory, 0) / performanceData.length) : 0}
              suffix="ms"
              prefix={<TransactionOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Performance en temps réel" style={{ marginBottom: '24px' }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="memory" 
              stroke="#1890ff" 
              strokeWidth={2}
              name="Mémoire (MB)"
            />
            <Line 
              type="monotone" 
              dataKey="uptime" 
              stroke="#52c41a" 
              strokeWidth={2}
              name="Uptime (min)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </>
  );
};

const Dashboard = () => {
  return (
    <Layout style={{ padding: '0 24px 24px' }}>
      <Content>
        <h1 style={{ margin: '24px 0', color: '#1890ff' }}>
          <BankOutlined /> Dashboard de Supervision CBS
        </h1>
        <Tabs 
          defaultActiveKey="1" 
          type="card"
          items={[
            {
              label: <span><AreaChartOutlined />Supervision</span>,
              key: '1',
              children: <SupervisionDashboard />,
            },
            {
              label: <span><ArrowRightOutlined />Transfert</span>,
              key: '2',
              children: <TransferForm />,
            },
            {
              label: <span><SearchOutlined />Consultation Compte</span>,
              key: '3',
              children: <AccountConsultation />,
            },
            {
              label: <span><UserOutlined />Consultation Client</span>,
              key: '4',
              children: <CustomerConsultation />,
            },
            {
              label: <span><HistoryOutlined />Historique</span>,
              key: '5',
              children: <TransactionHistory />,
            },
          ]}
        />
      </Content>
    </Layout>
  );
};

export default Dashboard; 