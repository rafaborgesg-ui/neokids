import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  totalRevenue: number;
  todayRevenue: number;
  statusCounts: Record<string, number>;
  averageTicket?: number;
  averageCycleTime?: number;
}

interface DashboardProps {
  accessToken: string
  userRole: string
}

const statusColors: Record<string, string> = {
  'Finalizado': 'bg-green-100 text-green-800',
  'Em andamento': 'bg-yellow-100 text-yellow-800',
  'Cancelado': 'bg-red-100 text-red-800',
  'Pendente': 'bg-gray-100 text-gray-800',
};

export default function Dashboard({ accessToken }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Calcular KPIs do localStorage
    const stored = localStorage.getItem("appointments");
    let appointments = stored ? JSON.parse(stored) : [];
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const todayAppointments = appointments.filter((apt: any) => {
      if (!apt.createdAt) return false;
      const aptDate = new Date(apt.createdAt).toISOString().slice(0, 10);
      return aptDate === todayStr;
    });

    const totalRevenue = appointments.reduce((sum: number, apt: any) => sum + (apt.totalAmount || 0), 0);
    const todayRevenue = todayAppointments.reduce((sum: number, apt: any) => sum + (apt.totalAmount || 0), 0);

    // Contagem por status
    const statusCounts: Record<string, number> = {};
    appointments.forEach((apt: any) => {
      const status = apt.status || 'Pendente';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    setStats({
      totalAppointments: appointments.length,
      todayAppointments: todayAppointments.length,
      totalRevenue,
      todayRevenue,
      statusCounts,
      averageTicket: appointments.length ? totalRevenue / appointments.length : 0,
      averageCycleTime: undefined
    });
    setLoading(false);
  }, []);

  // Função de exportação de dados
  function handleExport() {
    const rows = [
      ['Indicador', 'Valor'],
      ['Receita Total', stats?.totalRevenue || 0],
      ['Ticket Médio', stats?.averageTicket || 0],
      ['Volume de Atendimentos', stats?.totalAppointments || 0],
      ['Tempo Médio de Ciclo', stats?.averageCycleTime || 0],
    ];
    const csvContent = rows.map(e => e.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'dashboard_neokids.csv';
    link.click();
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const statCards = [
    {
      title: 'Atendimentos Hoje',
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total de Atendimentos',
      value: stats?.totalAppointments || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Receita Hoje',
      value: formatCurrency(stats?.todayRevenue || 0),
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Receita Total',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-gray-500">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI Cards */}
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="border border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-4 mt-4 md:grid-cols-2">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Status dos Atendimentos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.statusCounts && Object.entries(stats.statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                      {status}
                    </div>
                  </div>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
              {(!stats?.statusCounts || Object.keys(stats.statusCounts).length === 0) && (
                <p className="text-gray-500 text-center py-8">
                  Nenhum atendimento encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Receita Média por Atendimento</span>
                <span className="font-semibold">
                  {stats?.totalAppointments ? 
                    formatCurrency((stats.totalRevenue || 0) / stats.totalAppointments) : 
                    formatCurrency(0)
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Meta Mensal</span>
                <span className="font-semibold text-green-600">R$ 50.000,00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Progresso da Meta</span>
                <span className="font-semibold">
                  {((stats?.totalRevenue || 0) / 50000 * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${Math.min(((stats?.totalRevenue || 0) / 50000) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions e Exportação */}
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => window.dispatchEvent(new CustomEvent('navigateModule', { detail: 'patients' }))}
            >
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium">Novo Paciente</p>
                  <p className="text-sm text-gray-600">Cadastrar novo paciente</p>
                </div>
              </div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => window.dispatchEvent(new CustomEvent('navigateModule', { detail: 'appointments' }))}
            >
              <div className="flex items-center space-x-3">
                <Calendar className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium">Novo Atendimento</p>
                  <p className="text-sm text-gray-600">Iniciar novo atendimento</p>
                </div>
              </div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
              onClick={() => window.dispatchEvent(new CustomEvent('navigateModule', { detail: 'laboratory' }))}
            >
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-purple-600" />
                <div>
                  <p className="font-medium">Ver Laboratório</p>
                  <p className="text-sm text-gray-600">Acompanhar amostras</p>
                </div>
              </div>
            </button>
          </div>
          <button
            className="p-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            onClick={handleExport}
          >
            Exportar Dados (Excel/CSV)
          </button>
        </CardContent>
      </Card>
    </div>
  );
}