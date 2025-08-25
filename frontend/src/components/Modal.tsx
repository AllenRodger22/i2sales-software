import styled from 'styled-components';
import { motion } from 'framer-motion';
import React from 'react';

type Props = { open: boolean; onClose: () => void; children: React.ReactNode };

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBody = styled(motion.div)`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: 2rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
`;

export const Modal: React.FC<Props> = ({open, onClose, children}) => {
  if(!open) return null;
  return (
    <Overlay initial={{opacity: 0}} animate={{opacity: 1}} onClick={onClose}>
      <ModalBody initial={{scale:0.9}} animate={{scale:1}} onClick={e => e.stopPropagation()}>
        {children}
      </ModalBody>
    </Overlay>
  );
};
