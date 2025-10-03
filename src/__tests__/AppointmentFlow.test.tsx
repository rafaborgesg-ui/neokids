import { Response } from 'node-fetch';
import React from 'react';

beforeAll(() => {
  global.fetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({}),
  }));
});
import { render, screen, fireEvent } from '@testing-library/react';
import AppointmentFlow from '../components/AppointmentFlow';

describe('AppointmentFlow', () => {
  const props = { accessToken: 'fake-token', userRole: 'administrador' };

  it('deve renderizar etapas da jornada de atendimento', () => {
    render(<AppointmentFlow {...props} />);
    expect(screen.getByText(/Jornada de Atendimento/i)).toBeInTheDocument();
    expect(screen.getByText(/Identificar Paciente/i)).toBeInTheDocument();
  });

  // Adicione mais testes para seleção de serviços, pagamento, finalização
});
