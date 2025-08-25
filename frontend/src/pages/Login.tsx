import React from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 1rem;
`;

export const Login: React.FC = () => (
  <Wrapper>
    <Input type="email" placeholder="Email" />
    <Input type="password" placeholder="Senha" />
    <Button>Entrar</Button>
  </Wrapper>
);
