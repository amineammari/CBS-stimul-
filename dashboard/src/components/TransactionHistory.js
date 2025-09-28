import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Spin, Descriptions, Tag, Table } from 'antd';
import { SearchOutlined, HistoryOutlined, BankOutlined } from '@ant-design/icons';
import { cbsAPI } from '../services/api';
import moment from 'moment';

const TransactionHistory = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState(null);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setTransactions(null);
      setAccount(null);

      // 1. Récupérer l'historique
      const historyData = await cbsAPI.getTransactionHistory(values.accountId);
      
      // 2. Récupérer les détails du compte
      const accountData = await cbsAPI.getAccount(values.accountId);

      setTransactions(historyData);
      setAccount(accountData);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la consultation');
      setTransactions(null);
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type) => {
    return type === 'CRÉDIT' ? 'green' : 'red';
  };

  const getAmountColor = (amount) => {
    return amount >= 0 ? 'green' : 'red';
  };

  const transactionColumns = [
    {
      title: 'ID Transaction',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Tag color="blue">{id}</Tag>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={getTransactionTypeColor(type)}>{type}</Tag>
    },
    {
      title: 'Montant',
      dataIndex: 'montant',
      key: 'montant',
      render: (montant) => (
        <span style={{ 
          color: getAmountColor(montant), 
          fontWeight: 'bold'
        }}>
          {montant >= 0 ? '+' : ''}{montant.toFixed(2)} €
        </span>
      )
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm:ss')
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    }
  ];

  return (
    <Card title={<><HistoryOutlined /> Historique des Transactions</>}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginBottom: '24px' }}
      >
        <Form.Item
          label="ID du Compte"
          name="accountId"
          rules={[{ required: true, message: 'Veuillez saisir l\'ID du compte' }]}
        >
          <Input 
            placeholder="Ex: A001" 
            prefix={<SearchOutlined />}
            style={{ width: '300px' }}
          />
        </Form.Item>
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<SearchOutlined />}
          >
            Consulter l'historique
          </Button>
        </Form.Item>
      </Form>

      {error && (
        <Alert
          message="Erreur"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <p>Consultation de l'historique en cours...</p>
        </div>
      )}

      {transactions && account && (
        <div>
          <Card title="Informations du Compte" style={{ marginBottom: '16px' }}>
            <Descriptions bordered column={3}>
              <Descriptions.Item label="ID du Compte">
                <Tag color="blue">{account.id}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="purple">{account.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Solde Actuel">
                <span style={{ 
                  color: account.balance >= 0 ? '#52c41a' : '#ff4d4f', 
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {account.balance.toFixed(2)} €
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="IBAN" span={3}>
                <code>{account.iban}</code>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={
            <><BankOutlined /> Historique des Transactions ({transactions?.length || 0})</>
          }>
            {transactions && transactions.length > 0 ? (
              <Table
                dataSource={transactions}
                columns={transactionColumns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} sur ${total} transactions`
                }}
                size="small"
              />
            ) : (
              <Alert
                message="Aucune transaction trouvée"
                description="Ce compte n'a pas d'historique de transactions."
                type="info"
                showIcon
              />
            )}
          </Card>
        </div>
      )}
    </Card>
  );
};

export default TransactionHistory; 