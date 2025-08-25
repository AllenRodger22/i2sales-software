import styled from 'styled-components';
import React from 'react';

type Props = { children: React.ReactNode };

const Wrapper = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Sidebar = styled.nav`
  width: 200px;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  backdrop-filter: blur(10px);
`;

const Content = styled.main`
  flex: 1;
  padding: 1rem;
`;

export const Layout: React.FC<Props> = ({ children }) => (
  <Wrapper>
    <Sidebar>{/* navigation items */}</Sidebar>
    <Content>{children}</Content>
  </Wrapper>
);
