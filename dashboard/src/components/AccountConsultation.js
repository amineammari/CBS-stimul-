import React, { useState } from 'react';
import { Card, Form, Input, Button, Table, Alert, Spin, Descriptions, Tag } from 'antd';
import { SearchOutlined, BankOutlined, UserOutlined } from '@ant-design/icons';
import { cbsAPI } from '../services/api';

const AccountConsultation = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setAccount(null);

      const accountData = await cbsAPI.getAccount(values.accountId);
      setAccount(accountData);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la consultation du compte');
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeColor = (type) => {
    return type === 'Compte Courant' ? 'blue' : 'green';
  };

  const getBalanceColor = (balance) => {
    return balance >= 0 ? 'green' : 'red';
  };

  return (
    <Card title={<><BankOutlined /> Consultation de Compte</>}>
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
            Consulter
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
          <p>Consultation en cours...</p>
        </div>
      )}

      {account && (
        <Card title="Informations du Compte" style={{ marginTop: '16px' }}>
          <Descriptions bordered column={2}>
            <Descriptions.Item label="ID du Compte" span={1}>
              <Tag color="blue">{account.id}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Type de Compte" span={1}>
              <Tag color={getAccountTypeColor(account.type)}>{account.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="IBAN" span={2}>
              <code>{account.iban}</code>
            </Descriptions.Item>
            <Descriptions.Item label="Solde" span={1}>
              <span style={{ 
                color: getBalanceColor(account.balance), 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {account.balance.toFixed(2)} €
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="ID Client" span={1}>
              <Tag icon={<UserOutlined />} color="purple">{account.customerId}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date de Création" span={1}>
              {new Date(account.createdAt).toLocaleDateString('fr-FR')}
            </Descriptions.Item>
            <Descriptions.Item label="Dernière Mise à Jour" span={1}>
              {new Date(account.updatedAt).toLocaleDateString('fr-FR')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Card>
  );
};

export default AccountConsultation; 