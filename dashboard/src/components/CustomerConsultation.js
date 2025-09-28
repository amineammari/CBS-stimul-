import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Spin, Descriptions, Tag, Table } from 'antd';
import { SearchOutlined, UserOutlined, BankOutlined } from '@ant-design/icons';
import { cbsAPI } from '../services/api';

const CustomerConsultation = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setCustomer(null);

      const customerData = await cbsAPI.getCustomer(values.customerId);
      setCustomer(customerData);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la consultation du client');
      setCustomer(null);
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

  const accountColumns = [
    {
      title: 'ID Compte',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Tag color="blue">{id}</Tag>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color={getAccountTypeColor(type)}>{type}</Tag>
    },
    {
      title: 'IBAN',
      dataIndex: 'iban',
      key: 'iban',
      render: (iban) => <code>{iban}</code>
    },
    {
      title: 'Solde',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => (
        <span style={{ 
          color: getBalanceColor(balance), 
          fontWeight: 'bold'
        }}>
          {balance.toFixed(2)} €
        </span>
      )
    }
  ];

  return (
    <Card title={<><UserOutlined /> Consultation de Client</>}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginBottom: '24px' }}
      >
        <Form.Item
          label="ID du Client"
          name="customerId"
          rules={[{ required: true, message: 'Veuillez saisir l\'ID du client' }]}
        >
          <Input 
            placeholder="Ex: C001" 
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

      {customer && (
        <div>
          <Card title="Informations du Client" style={{ marginBottom: '16px' }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="ID Client" span={1}>
                <Tag color="purple">{customer.id}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nom Complet" span={1}>
                {customer.prenom} {customer.nom}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={1}>
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              </Descriptions.Item>
              <Descriptions.Item label="Téléphone" span={1}>
                <a href={`tel:${customer.telephone}`}>{customer.telephone}</a>
              </Descriptions.Item>
              <Descriptions.Item label="Adresse" span={2}>
                {customer.adresse}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={<><BankOutlined /> Comptes du Client ({customer.accounts?.length || 0})</>}>
            {customer.accounts && customer.accounts.length > 0 ? (
              <Table
                dataSource={customer.accounts}
                columns={accountColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <Alert
                message="Aucun compte trouvé"
                description="Ce client n'a pas de comptes associés."
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

export default CustomerConsultation; 