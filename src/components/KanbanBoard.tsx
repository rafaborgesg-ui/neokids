import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  Activity, 
  Clock, 
  User, 
  QrCode, 
  Search,
  RefreshCw,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info'

interface Appointment {
  id: string
  patientName: string
  status: string
  totalAmount: number
  services: Array<{
    id: string
    name: string
    code: string
  }>
  sampleIds: string[]
  createdAt: string
}

interface KanbanBoardProps {
  accessToken: string
  userRole: string
}

const statusConfig = {
  'Aguardando Coleta': {
    color: 'bg-yellow-100 text-yellow-800 border-gray-200',
    icon: Clock,
    nextStatus: 'Em Análise'
  },
  'Em Análise': {
    color: 'bg-blue-100 text-blue-800 border-gray-200',
    icon: Activity,
    nextStatus: 'Aguardando Laudo'
  },
  'Aguardando Laudo': {
    color: 'bg-orange-100 text-orange-800 border-gray-200',
    icon: AlertCircle,
    nextStatus: 'Finalizado'
  },
  'Finalizado': {
    color: 'bg-green-100 text-green-800 border-gray-200',
    icon: Clock,
    nextStatus: null
  }
}

const KanbanBoard = ({ accessToken, userRole }: KanbanBoardProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Buscar atendimentos do localStorage
    const stored = localStorage.getItem("appointments");
    if (stored) setAppointments(JSON.parse(stored));
  }, []);

  useEffect(() => {
    filterAppointments()
  }, [appointments, searchQuery, statusFilter])

  const fetchAppointments = () => {
    setLoading(true);
    setTimeout(() => {
      const stored = localStorage.getItem("appointments");
      if (stored) setAppointments(JSON.parse(stored));
      setLoading(false);
    }, 500);
  };

  const filterAppointments = () => {
    let filtered = appointments

    if (searchQuery) {
      filtered = filtered.filter(appointment => 
        appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        appointment.sampleIds.some(id => id.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(appointment => appointment.status === statusFilter)
    }

    setFilteredAppointments(filtered)
  }

  const updateAppointmentStatus = (appointmentId: string, newStatus: string) => {
    setAppointments(prev => {
      const updated = prev.map(apt => apt.id === appointmentId ? { ...apt, status: newStatus } : apt);
      localStorage.setItem("appointments", JSON.stringify(updated));
      return updated;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusCounts = () => {
    const counts: Record<string, number> = {}
    Object.keys(statusConfig).forEach(status => {
      counts[status] = filteredAppointments.filter(apt => apt.status === status).length
    })
    return counts
  }

  const statusCounts = getStatusCounts()

  if (loading && appointments.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Painel Laboratorial</h2>
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando atendimentos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Atendimento</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const StatusIcon = config.icon
          const appointmentsInStatus = filteredAppointments.filter(apt => apt.status === status)
          
          return (
            <div key={status} className="space-y-4">
              <Card className={`${config.color} border border-gray-200`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className="w-4 h-4" />
                      <span>{status}</span>
                    </div>
                    <Badge variant="secondary">
                      {appointmentsInStatus.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {appointmentsInStatus.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {appointment.patientName}
                            </h4>
                            <p className="text-xs text-gray-500">
                              ID: {appointment.id.split('_')[1]}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDateTime(appointment.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-600">
                              {formatCurrency(appointment.totalAmount)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 font-medium">Serviços:</p>
                          {appointment.services.slice(0, 2).map((service) => (
                            <div key={service.id} className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {service.code}
                              </Badge>
                              <span className="text-xs text-gray-700 truncate">
                                {service.name}
                              </span>
                            </div>
                          ))}
                          {appointment.services.length > 2 && (
                            <p className="text-xs text-gray-500">
                              +{appointment.services.length - 2} mais
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs text-gray-600 font-medium">Amostras:</p>
                          <div className="flex flex-wrap gap-1">
                            {appointment.sampleIds.slice(0, 3).map((sampleId) => (
                              <div key={sampleId} className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1">
                                <QrCode className="w-3 h-3 text-gray-600" />
                                <span className="text-xs text-gray-700">
                                  {sampleId.split('_')[1]}
                                </span>
                              </div>
                            ))}
                            {appointment.sampleIds.length > 3 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{appointment.sampleIds.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        {config.nextStatus && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => updateAppointmentStatus(appointment.id, config.nextStatus!)}
                          >
                            <span className="mr-2">Avançar para {config.nextStatus}</span>
                            <ChevronRight className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {appointmentsInStatus.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <StatusIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum atendimento</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {filteredAppointments.length === 0 && !loading && (
    <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' 
                ? 'Nenhum atendimento encontrado com os filtros aplicados'
                : 'Nenhum atendimento ativo no momento'
              }
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const StatusIcon = config.icon
          return (
            <Card key={status} className="border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <StatusIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-2xl font-bold">{statusCounts[status] || 0}</p>
                    <p className="text-xs text-gray-600">{status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default KanbanBoard;