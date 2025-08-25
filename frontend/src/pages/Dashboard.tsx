import React from 'react';
import { Card } from '../components/Card';
import { Layout } from '../components/Layout';

export const Dashboard: React.FC = () => (
  <Layout>
    <Card initial={{opacity:0}} animate={{opacity:1}}>Bem-vindo ao CRM</Card>
  </Layout>
);
