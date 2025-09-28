import React, { useState } from 'react';
import { Card, Form, Input, InputNumber, Button, Alert, Spin, Descriptions, Tag, Divider } from 'antd';
import { ArrowRightOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { cbsAPI } from '../services/api';

const TransferForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const transferData = {
        from: values.sourceAccountId,
        to: values.targetAccountId,
        amount: values.amount,
        description: values.description || 'Transfert via middleware'
      };

      const transferResult = await cbsAPI.doTransfer(transferData);
      setResult(transferResult);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du transfert');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type) => {
    return type === 'CRÉDIT' ? 'green' : 'red';
  };

  return (
    <Card title={<><ArrowRightOutlined /> Transfert entre Comptes</>}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginBottom: '24px' }}
      >
        <Form.Item
          label="Compte Source"
          name="sourceAccountId"
          rules={[{ required: true, message: 'Veuillez saisir l\'ID du compte source' }]}
        >
          <Input 
            placeholder="Ex: A001" 
            prefix={<ArrowRightOutlined />}
            style={{ width: '300px' }}
          />
        </Form.Item>

        <Form.Item
          label="Compte Destination"
          name="targetAccountId"
          rules={[{ required: true, message: 'Veuillez saisir l\'ID du compte destination' }]}
        >
          <Input 
            placeholder="Ex: A002" 
            prefix={<ArrowRightOutlined />}
            style={{ width: '300px' }}
          />
        </Form.Item>

        <Form.Item
          label="Montant (€)"
          name="amount"
          rules={[
            { required: true, message: 'Veuillez saisir le montant' },
            { type: 'number', min: 0.01, message: 'Le montant doit être positif' }
          ]}
        >
          <InputNumber
            placeholder="0.00"
            min={0.01}
            step={0.01}
            precision={2}
            style={{ width: '300px' }}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
        >
          <Input.TextArea
            placeholder="Description du transfert (optionnel)"
            rows={3}
            style={{ width: '400px' }}
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            icon={<ArrowRightOutlined />}
            size="large"
          >
            Effectuer le Transfert
          </Button>
        </Form.Item>
      </Form>

      {error && (
        <Alert
          message="Erreur de Transfert"
          description={error}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: '16px' }}
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <p>Traitement du transfert en cours...</p>
        </div>
      )}

      {result && (
        <Card 
          title={
            <span style={{ color: '#52c41a' }}>
              <CheckCircleOutlined /> Transfert Effectué avec Succès
            </span>
          } 
          style={{ marginTop: '16px' }}
        >
          <Alert
            message="Transfert réussi"
            description={result.message}
            type="success"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Divider orientation="left">Compte Source</Divider>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ID du Compte">
              <Tag color="blue">{result.sourceAccount.id}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color="purple">{result.sourceAccount.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nouveau Solde" span={2}>
              <span style={{ 
                color: result.sourceAccount.balance >= 0 ? '#52c41a' : '#ff4d4f', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {result.sourceAccount.balance.toFixed(2)} €
              </span>
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">Compte Destination</Divider>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="ID du Compte">
              <Tag color="blue">{result.targetAccount.id}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color="purple">{result.targetAccount.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Nouveau Solde" span={2}>
              <span style={{ 
                color: result.targetAccount.balance >= 0 ? '#52c41a' : '#ff4d4f', 
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {result.targetAccount.balance.toFixed(2)} €
              </span>
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">Transactions Créées</Divider>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Card size="small" title="Transaction Débit" style={{ flex: 1 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="ID">
                  <Tag color="red">{result.debitTransaction.id}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Tag color={getTransactionTypeColor(result.debitTransaction.type)}>
                    {result.debitTransaction.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Montant">
                  <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                    {result.debitTransaction.montant.toFixed(2)} €
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {result.debitTransaction.description}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="Transaction Crédit" style={{ flex: 1 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="ID">
                  <Tag color="green">{result.creditTransaction.id}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Tag color={getTransactionTypeColor(result.creditTransaction.type)}>
                    {result.creditTransaction.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Montant">
                  <span style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {result.creditTransaction.montant.toFixed(2)} €
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                  {result.creditTransaction.description}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </div>
        </Card>
      )}
    </Card>
  );
};

export default TransferForm; 