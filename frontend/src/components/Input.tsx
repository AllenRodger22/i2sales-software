import styled from 'styled-components';

export const Input = styled.input`
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  backdrop-filter: blur(10px);
`;
