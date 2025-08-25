import type { LucideIcon } from 'lucide-react';
import React from 'react';

export const Icon: React.FC<{icon: LucideIcon; size?: number}> = ({icon: IconComp, size = 16}) => (
  <IconComp size={size} />
);
