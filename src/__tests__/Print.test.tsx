beforeAll(() => {
  global.fetch = jest.fn(() => Promise.resolve({
    json: () => Promise.resolve({}),
  }));
});
import React from 'react';
import { render, screen } from '@testing-library/react';
import AppointmentFlow from '../components/AppointmentFlow';

describe('Impressão', () => {
  const props = { accessToken: 'fake-token', userRole: 'administrador' };

  it('deve renderizar botão de impressão de etiquetas e comprovante', () => {
    render(<AppointmentFlow {...props} />);
    expect(screen.getByText(/Imprimir Etiquetas/i)).toBeInTheDocument();
    expect(screen.getByText(/Imprimir Comprovante/i)).toBeInTheDocument();
  });
});
