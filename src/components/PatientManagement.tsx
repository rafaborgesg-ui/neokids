import React, { useState, useEffect } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Plus, Search, User, AlertTriangle, Phone, Mail, MapPin, Eye, Edit } from "lucide-react";

function calculateAge(dateString: string): string {
  if (!dateString) return "-";
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age + " anos";
}

function formatCPF(cpf: string): string {
  if (!cpf) return "";
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatPhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

interface Patient {
  id: string;
  name: string;
  birthDate: string;
  cpf: string;
  phone: string;
  email?: string;
  address: string;
  responsibleName: string;
  responsibleCpf: string;
  responsiblePhone: string;
  consentLGPD?: boolean;
  specialAlert?: string;
}

export default function PatientManagement() {
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [newPatient, setNewPatient] = useState<Patient>({
    id: "",
    name: "",
    birthDate: "",
    cpf: "",
    phone: "",
    email: "",
    address: "",
    responsibleName: "",
    responsibleCpf: "",
    responsiblePhone: "",
    consentLGPD: false,
    specialAlert: "",
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientHistoryOpen, setPatientHistoryOpen] = useState<Patient | null>(null);
  const [patientAppointments, setPatientAppointments] = useState<any[]>([]);

  // Persistência localStorage
  useEffect(() => {
    const stored = localStorage.getItem("patients");
    if (stored) setPatients(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("patients", JSON.stringify(patients));
  }, [patients]);

  function createPatient() {
    setLoading(true);
    setTimeout(() => {
      setPatients(prev => [...prev, { ...newPatient, id: Math.random().toString(36).substr(2, 9) }]);
      setIsNewPatientOpen(false);
      setNewPatient({
        id: "",
        name: "",
        birthDate: "",
        cpf: "",
        phone: "",
        email: "",
        address: "",
        responsibleName: "",
        responsibleCpf: "",
        responsiblePhone: "",
        consentLGPD: false,
        specialAlert: "",
      });
      setLoading(false);
      setError(null);
    }, 1000);
  }

  function startEditPatient(patient: Patient) {
    setEditPatientId(patient.id);
    setEditPatient({ ...patient });
  }

  function saveEditPatient() {
    if (!editPatient) return;
    setPatients(prev => prev.map(p => p.id === editPatient.id ? editPatient : p));
    setEditPatientId(null);
    setEditPatient(null);
  }

  function cancelEditPatient() {
    setEditPatientId(null);
    setEditPatient(null);
  }

  function deletePatient(id: string) {
    if (window.confirm("Deseja realmente excluir este paciente?")) {
      setPatients(prev => prev.filter(p => p.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Dialog open={isNewPatientOpen} onOpenChange={setIsNewPatientOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Novo Paciente</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={newPatient.name}
                    onChange={e => setNewPatient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do paciente"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento *</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newPatient.birthDate}
                    onChange={e => setNewPatient(prev => ({ ...prev, birthDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={newPatient.cpf}
                    onChange={e => setNewPatient(prev => ({ ...prev, cpf: e.target.value }))}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={newPatient.phone}
                    onChange={e => setNewPatient(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPatient.email}
                  onChange={e => setNewPatient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo *</Label>
                <Textarea
                  id="address"
                  value={newPatient.address}
                  onChange={e => setNewPatient(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade, CEP"
                  required
                />
              </div>
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-4">Dados do Responsável</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsibleName">Nome do Responsável *</Label>
                    <Input
                      id="responsibleName"
                      value={newPatient.responsibleName}
                      onChange={e => setNewPatient(prev => ({ ...prev, responsibleName: e.target.value }))}
                      placeholder="Nome do responsável"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsibleCpf">CPF do Responsável *</Label>
                    <Input
                      id="responsibleCpf"
                      value={newPatient.responsibleCpf}
                      onChange={e => setNewPatient(prev => ({ ...prev, responsibleCpf: e.target.value }))}
                      placeholder="000.000.000-00"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="responsiblePhone">Telefone do Responsável *</Label>
                    <Input
                      id="responsiblePhone"
                      value={newPatient.responsiblePhone}
                      onChange={e => setNewPatient(prev => ({ ...prev, responsiblePhone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={!!newPatient.consentLGPD}
                      onChange={e => setNewPatient(prev => ({ ...prev, consentLGPD: e.target.checked }))}
                      required
                    />
                    <span className="text-sm text-gray-700">
                      Autorizo o uso dos dados pessoais conforme a LGPD para fins de atendimento e gestão clínica.
                    </span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialAlert">Alertas Especiais</Label>
                <Textarea
                  id="specialAlert"
                  value={newPatient.specialAlert}
                  onChange={e => setNewPatient(prev => ({ ...prev, specialAlert: e.target.value }))}
                  placeholder="Alergias, condições especiais, observações importantes..."
                  className="border border-gray-200"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsNewPatientOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button onClick={createPatient} disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Paciente'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Busca Inteligente de Pacientes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              className="pl-10"
              placeholder="Buscar por nome, CPF, telefone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery.length > 0 && searchQuery.length < 2 && (
            <p className="text-sm text-gray-500 mt-2">Digite pelo menos 2 caracteres para buscar</p>
          )}
        </CardContent>
      </Card>
      {loading && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Buscando pacientes...</p>
        </div>
      )}
      {patients.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {patients.map((patient) => (
              <Card key={patient.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                        <p className="text-sm text-gray-600">
                          {calculateAge(patient.birthDate)} • {formatCPF(patient.cpf)}
                        </p>
                      </div>
                    </div>
                    {patient.specialAlert && (
                      <Badge variant="destructive" className="flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Alerta</span>
                      </Badge>
                    )}
                  </div>
                  {patient.specialAlert && (
                    <Alert className="mb-4">
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>{patient.specialAlert}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{formatPhone(patient.phone)}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{patient.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{patient.address}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Responsável:</p>
                    <p className="font-medium">{patient.responsibleName}</p>
                    <p className="text-sm text-gray-600">
                      {formatPhone(patient.responsiblePhone)} • {formatCPF(patient.responsibleCpf)}
                    </p>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setPatientHistoryOpen(patient)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Histórico
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => startEditPatient(patient)}>
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deletePatient(patient.id)}>
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Modal de histórico do paciente - fora do loop */}
          <Dialog open={!!patientHistoryOpen} onOpenChange={() => setPatientHistoryOpen(null)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Histórico de Atendimentos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {patientAppointments.length === 0 ? (
                  <p className="text-gray-600">Nenhum atendimento encontrado para este paciente.</p>
                ) : (
                  patientAppointments.map((apt, idx) => (
                    <Card key={apt.id || idx} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between">
                          <span className="font-medium">Data:</span>
                          <span>{apt.createdAt ? new Date(apt.createdAt).toLocaleString('pt-BR') : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Serviços:</span>
                          <span>{apt.services ? apt.services.map((s: { name: string }) => s.name).join(', ') : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Valor:</span>
                          <span>{apt.totalAmount ? apt.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Status:</span>
                          <span>{apt.status || 'Pendente'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
      {searchQuery.length >= 2 && patients.length === 0 && !loading && (
    <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-6 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum paciente encontrado</p>
            <p className="text-sm text-gray-500 mt-2">
              Tente buscar com outros termos ou cadastre um novo paciente
            </p>
          </CardContent>
        </Card>
      )}
    {/* Modal de edição de paciente */}
    {editPatientId && editPatient && (
      <Dialog open={true} onOpenChange={cancelEditPatient}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  value={editPatient.name}
                  onChange={e => setEditPatient(prev => prev ? { ...prev, name: e.target.value } : prev)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-birthDate">Data de Nascimento *</Label>
                <Input
                  id="edit-birthDate"
                  type="date"
                  value={editPatient.birthDate}
                  onChange={e => setEditPatient(prev => prev ? { ...prev, birthDate: e.target.value } : prev)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF *</Label>
                <Input
                  id="edit-cpf"
                  value={editPatient.cpf}
                  onChange={e => setEditPatient(prev => prev ? { ...prev, cpf: e.target.value } : prev)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone *</Label>
                <Input
                  id="edit-phone"
                  value={editPatient.phone}
                  onChange={e => setEditPatient(prev => prev ? { ...prev, phone: e.target.value } : prev)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editPatient.email}
                onChange={e => setEditPatient(prev => prev ? { ...prev, email: e.target.value } : prev)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Endereço Completo *</Label>
              <Textarea
                id="edit-address"
                value={editPatient.address}
                onChange={e => setEditPatient(prev => prev ? { ...prev, address: e.target.value } : prev)}
                required
              />
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-4">Dados do Responsável</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-responsibleName">Nome do Responsável *</Label>
                  <Input
                    id="edit-responsibleName"
                    value={editPatient.responsibleName}
                    onChange={e => setEditPatient(prev => prev ? { ...prev, responsibleName: e.target.value } : prev)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-responsibleCpf">CPF do Responsável *</Label>
                  <Input
                    id="edit-responsibleCpf"
                    value={editPatient.responsibleCpf}
                    onChange={e => setEditPatient(prev => prev ? { ...prev, responsibleCpf: e.target.value } : prev)}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-responsiblePhone">Telefone do Responsável *</Label>
                  <Input
                    id="edit-responsiblePhone"
                    value={editPatient.responsiblePhone}
                    onChange={e => setEditPatient(prev => prev ? { ...prev, responsiblePhone: e.target.value } : prev)}
                    required
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={!!editPatient.consentLGPD}
                    onChange={e => setEditPatient(prev => prev ? { ...prev, consentLGPD: e.target.checked } : prev)}
                    required
                  />
                  <span className="text-sm text-gray-700">
                    Autorizo o uso dos dados pessoais conforme a LGPD para fins de atendimento e gestão clínica.
                  </span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-specialAlert">Alertas Especiais</Label>
              <Textarea
                id="edit-specialAlert"
                value={editPatient.specialAlert}
                onChange={e => setEditPatient(prev => prev ? { ...prev, specialAlert: e.target.value } : prev)}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={cancelEditPatient}>
                Cancelar
              </Button>
              <Button onClick={saveEditPatient}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader><CardTitle>Lista de Pacientes</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">CPF</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map(patient => (
                  <TableRow key={patient.id}>
                    <TableCell>{patient.name}</TableCell>
                    <TableCell className="hidden sm:table-cell">{patient.cpf}</TableCell>
                    <TableCell className="hidden md:table-cell">{patient.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEditPatient(patient)}>Editar</Button>
                        <Button variant="destructive" size="sm" onClick={() => deletePatient(patient.id)}>Excluir</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}