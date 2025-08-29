import { api } from './api';
import type { Interaction } from '../../types';

export interface InteractionPayload {
  clientId: string;
  type: string;
  observation?: string;
  explicitNext?: string;
}

export const createInteraction = (payload: InteractionPayload): Promise<Interaction> => {
  return api<Interaction>('/interactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};
