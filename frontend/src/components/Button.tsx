import styled from 'styled-components';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

const BaseButton = styled.button<{variant: 'primary' | 'secondary'}>`
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: ${({ theme, variant }) =>
    variant === 'primary' ? theme.colors.accent : theme.colors.surface};
  color: ${({ variant }) => (variant === 'primary' ? '#000' : '#fff')};
  backdrop-filter: blur(10px);
`;

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...rest }) => (
  <BaseButton variant={variant} {...rest}>{children}</BaseButton>
);
