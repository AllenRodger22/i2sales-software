import type { Client } from '../src/types';

export const CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'Maria Joaquina',
    phone: '(85) 85485-8485',
    email: 'maria@example.com',
    source: 'Indicação',
    status: 'Primeiro Atendimento',
    owner_id: 'u1',
    observations: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: 'Consórcio Imobiliário',
    property_value: 250000.0,
    follow_up_state: 'Ativo',
    timeline: [
      { ts: new Date().toISOString(), text: 'deu certo' },
      {
        ts: new Date(Date.now() - 60_000).toISOString(),
        text: 'Follow-up agendado para 26/08/2025, 16:20:00',
      },
    ],
  },
  {
    id: 'c2',
    name: 'Janderson Doglas',
    phone: '(85) 98609-5497',
    email: null,
    source: 'Importado',
    status: 'Primeiro Atendimento',
    owner_id: 'u1',
    observations: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    product: null,
    property_value: null,
    follow_up_state: 'Sem Follow Up',
    timeline: [
      { ts: new Date().toISOString(), text: 'Follow-up agendado para 27/08/2025, 09:00' },
    ],
  },
];

export default CLIENTS;
