import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Plus,
	Search,
	User,
	AlertTriangle,
	Phone,
	Mail,
	MapPin,
	Eye,
	Edit,
} from "lucide-react";
import { toast } from "sonner";
import { usePatients } from "@/hooks/usePatients";
import { Patient } from "@/types";
import { projectId } from "@/utils/supabase/info";

// Funções auxiliares
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

// Componente Principal
interface PatientManagementProps {
	accessToken: string;
}

export default function PatientManagement({
	accessToken,
}: PatientManagementProps) {
	const { patients, loading, fetchPatients, setPatients } = usePatients(accessToken);
	const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
	const [newPatient, setNewPatient] = useState<Omit<Patient, "id" | "createdAt">>({
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
	const [editPatient, setEditPatient] = useState<Patient | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const handler = setTimeout(() => {
			if (searchQuery.length === 0 || searchQuery.length >= 2) {
				fetchPatients(searchQuery);
			}
		}, 500);
		return () => clearTimeout(handler);
	}, [searchQuery, fetchPatients]);

	const handleCreatePatient = async () => {
		try {
			const response = await fetch(
				`https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/patients`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify(newPatient),
				}
			);
			if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao criar paciente.");
      }
			
			toast.success("Paciente criado com sucesso!");
			setIsNewPatientOpen(false);
			setNewPatient({
				name: "", birthDate: "", cpf: "", phone: "", email: "", address: "",
				responsibleName: "", responsibleCpf: "", responsiblePhone: "",
				consentLGPD: false, specialAlert: "",
			});
			
			// AÇÃO CORRETA E DEFINITIVA:
			// Limpa qualquer busca e pede a lista fresca e completa do banco de dados.
			setSearchQuery("");
			await fetchPatients(""); 

		} catch (err: any) {
			toast.error(err.message);
		}
	};

	const handleSaveEdit = async () => {
		if (!editPatient) return;
		try {
			const response = await fetch(
				`https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/patients/${editPatient.id}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${accessToken}`,
					},
					body: JSON.stringify(editPatient),
					cache: "no-store",
				}
			);
			if (!response.ok) throw new Error("Falha ao atualizar paciente.");
			const data = await response.json();
			setPatients((prev) =>
				prev.map((p) => (p.id === data.patient.id ? data.patient : p))
			);
			setEditPatient(null);
			toast.success("Paciente atualizado com sucesso!");
		} catch (err: any) {
			toast.error(err.message);
		}
	}

	const handleDelete = async (id: string) => {
		if (!window.confirm("Deseja realmente excluir este paciente?")) return;
		try {
			const response = await fetch(
				`https://${projectId}.supabase.co/functions/v1/make-server-f78aeac5/patients/${id}`,
				{
					method: "DELETE",
					headers: { Authorization: `Bearer ${accessToken}` },
					cache: "no-store",
				}
			);
			if (!response.ok) throw new Error("Falha ao excluir paciente.");
			setPatients((prev) => prev.filter((p) => p.id !== id));
			toast.success("Paciente excluído com sucesso!");
		} catch (err: any) {
			toast.error(err.message);
		}
	}

	return (
		<div className="container mx-auto p-4">
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
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="name">Nome Completo *</Label>
										<Input
											id="name"
											value={newPatient.name}
											onChange={(e) =>
												setNewPatient((prev) => ({
													...prev,
													name: e.target.value,
												}))
											}
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
											onChange={(e) =>
												setNewPatient((prev) => ({
													...prev,
													birthDate: e.target.value,
												}))
											}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="cpf">CPF *</Label>
										<Input
											id="cpf"
											value={newPatient.cpf}
											onChange={(e) =>
												setNewPatient((prev) => ({
													...prev,
													cpf: e.target.value,
												}))
											}
											placeholder="000.000.000-00"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="phone">Telefone *</Label>
										<Input
											id="phone"
											value={newPatient.phone}
											onChange={(e) =>
												setNewPatient((prev) => ({
													...prev,
													phone: e.target.value,
												}))
											}
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
										onChange={(e) =>
											setNewPatient((prev) => ({
												...prev,
												email: e.target.value,
											}))
										}
										placeholder="email@exemplo.com"
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="address">Endereço Completo *</Label>
									<Textarea
										id="address"
										value={newPatient.address}
										onChange={(e) =>
											setNewPatient((prev) => ({
												...prev,
												address: e.target.value,
											}))
										}
										placeholder="Rua, número, bairro, cidade, CEP"
										required
									/>
								</div>
								<div className="border-t pt-4">
									<h4 className="font-medium text-gray-900 mb-4">
										Dados do Responsável
									</h4>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="responsibleName">
												Nome do Responsável *
											</Label>
											<Input
												id="responsibleName"
												value={newPatient.responsibleName}
												onChange={(e) =>
													setNewPatient((prev) => ({
														...prev,
														responsibleName: e.target.value,
													}))
												}
												placeholder="Nome do responsável"
												required
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="responsibleCpf">
												CPF do Responsável *
											</Label>
											<Input
												id="responsibleCpf"
												value={newPatient.responsibleCpf}
												onChange={(e) =>
													setNewPatient((prev) => ({
														...prev,
														responsibleCpf: e.target.value,
													}))
												}
												placeholder="000.000.000-00"
												required
											/>
										</div>
										<div className="space-y-2 md:col-span-2">
											<Label htmlFor="responsiblePhone">
												Telefone do Responsável *
											</Label>
											<Input
												id="responsiblePhone"
												value={newPatient.responsiblePhone}
												onChange={(e) =>
													setNewPatient((prev) => ({
														...prev,
														responsiblePhone: e.target.value,
													}))
												}
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
												onChange={(e) =>
													setNewPatient((prev) => ({
														...prev,
														consentLGPD: e.target.checked,
													}))
												}
												required
											/>
											<span className="text-sm text-gray-700">
												Autorizo o uso dos dados pessoais conforme a LGPD
												para fins de atendimento e gestão clínica.
											</span>
										</label>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor="specialAlert">Alertas Especiais</Label>
									<Textarea
										id="specialAlert"
										value={newPatient.specialAlert}
										onChange={(e) =>
											setNewPatient((prev) => ({
												...prev,
												specialAlert: e.target.value,
											}))
										}
										placeholder="Alergias, condições especiais, observações importantes..."
									/>
								</div>
								<div className="flex justify-end space-x-2 pt-4">
									<Button
										variant="outline"
										onClick={() => setIsNewPatientOpen(false)}
									>
										Cancelar
									</Button>
									<Button onClick={handleCreatePatient}>
										Criar Paciente
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
				<Card>
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
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						{searchQuery.length > 0 && searchQuery.length < 2 && (
							<p className="text-sm text-gray-500 mt-2">
								Digite pelo menos 2 caracteres para buscar
							</p>
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
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{patients.map((patient) => (
							<Card
								key={patient.id}
								className="hover:shadow-lg transition-shadow"
							>
								<CardContent className="p-6">
									<div className="flex items-start justify-between mb-4">
										<div className="flex items-center space-x-3">
											<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
												<User className="w-6 h-6 text-blue-600" />
											</div>
											<div>
												<h3 className="font-semibold text-gray-900">
													{patient.name}
												</h3>
												<p className="text-sm text-gray-600">
													{calculateAge(patient.birthDate)} •{" "}
													{formatCPF(patient.cpf)}
												</p>
											</div>
										</div>
										{patient.specialAlert && (
											<div className="flex items-center">
												<AlertTriangle className="w-5 h-5 text-red-500 mr-1" />
												<span className="text-sm text-red-500">
													Alerta
												</span>
											</div>
										)}
									</div>
									{patient.specialAlert && (
										<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
											<div className="flex items-center">
												<AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
												<p className="text-sm text-red-600">
													{patient.specialAlert}
												</p>
											</div>
										</div>
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
										<p className="text-sm text-gray-600 mb-2">
											Responsável:
										</p>
										<p className="font-medium">{patient.responsibleName}</p>
										<p className="text-sm text-gray-600">
											{formatPhone(patient.responsiblePhone)} •{" "}
											{formatCPF(patient.responsibleCpf)}
										</p>
									</div>
									<div className="flex justify-end space-x-2 mt-4">
										<Button variant="outline" size="sm">
											<Eye className="w-4 h-4 mr-1" />
											Ver Histórico
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setEditPatient(patient)}
										>
											<Edit className="w-4 h-4 mr-1" />
											Editar
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleDelete(patient.id)}
										>
											Excluir
										</Button>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
				{searchQuery.length >= 2 && patients.length === 0 && !loading && (
					<Card>
						<CardContent className="p-6 text-center">
							<User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-600">Nenhum paciente encontrado</p>
							<p className="text-sm text-gray-500 mt-2">
								Tente buscar com outros termos ou cadastre um novo paciente
							</p>
						</CardContent>
					</Card>
				)}
			</div>
			{editPatient && (
				<Dialog open={!!editPatient} onOpenChange={() => setEditPatient(null)}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Editar Paciente</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Nome Completo *</Label>
									<Input
										id="name"
										value={editPatient.name}
										onChange={(e) =>
											setEditPatient((prev) => (prev ? { ...prev, name: e.target.value } : null))
										}
										placeholder="Nome do paciente"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="birthDate">Data de Nascimento *</Label>
									<Input
										id="birthDate"
										type="date"
										value={editPatient.birthDate}
										onChange={(e) =>
											setEditPatient((prev) => (prev ? { ...prev, birthDate: e.target.value } : null))
										}
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="cpf">CPF *</Label>
									<Input
										id="cpf"
										value={editPatient.cpf}
										onChange={(e) =>
											setEditPatient((prev) => (prev ? { ...prev, cpf: e.target.value } : null))
										}
										placeholder="000.000.000-00"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="phone">Telefone *</Label>
									<Input
										id="phone"
										value={editPatient.phone}
										onChange={(e) =>
											setEditPatient((prev) => (prev ? { ...prev, phone: e.target.value } : null))
										}
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
									value={editPatient.email}
									onChange={(e) =>
										setEditPatient((prev) => (prev ? { ...prev, email: e.target.value } : null))
									}
									placeholder="email@exemplo.com"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="address">Endereço Completo *</Label>
								<Textarea
									id="address"
									value={editPatient.address}
									onChange={(e) =>
										setEditPatient((prev) => (prev ? { ...prev, address: e.target.value } : null))
									}
									placeholder="Rua, número, bairro, cidade, CEP"
									required
								/>
							</div>
							<div className="border-t pt-4">
								<h4 className="font-medium text-gray-900 mb-4">
									Dados do Responsável
								</h4>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="responsibleName">
											Nome do Responsável *
										</Label>
										<Input
											id="responsibleName"
											value={editPatient.responsibleName}
											onChange={(e) =>
												setEditPatient((prev) => (prev ? { ...prev, responsibleName: e.target.value } : null))
											}
											placeholder="Nome do responsável"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="responsibleCpf">
											CPF do Responsável *
										</Label>
										<Input
											id="responsibleCpf"
											value={editPatient.responsibleCpf}
											onChange={(e) =>
												setEditPatient((prev) => (prev ? { ...prev, responsibleCpf: e.target.value } : null))
											}
											placeholder="000.000.000-00"
											required
										/>
									</div>
									<div className="space-y-2 md:col-span-2">
										<Label htmlFor="responsiblePhone">
											Telefone do Responsável *
										</Label>
										<Input
											id="responsiblePhone"
											value={editPatient.responsiblePhone}
											onChange={(e) =>
												setEditPatient((prev) => (prev ? { ...prev, responsiblePhone: e.target.value } : null))
											}
											placeholder="(11) 99999-9999"
											required
										/>
									</div>
								</div>
								<div className="mt-6">
									<label className="flex items-center space-x-2">
										<input
											type="checkbox"
											checked={!!editPatient.consentLGPD}
											onChange={(e) =>
												setEditPatient((prev) => (prev ? { ...prev, consentLGPD: e.target.checked } : null))
											}
											required
										/>
										<span className="text-sm text-gray-700">
											Autorizo o uso dos dados pessoais conforme a LGPD
											para fins de atendimento e gestão clínica.
										</span>
									</label>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="specialAlert">Alertas Especiais</Label>
								<Textarea
									id="specialAlert"
									value={editPatient.specialAlert}
									onChange={(e) =>
										setEditPatient((prev) => (prev ? { ...prev, specialAlert: e.target.value } : null))
									}
									placeholder="Alergias, condições especiais, observações importantes..."
								/>
							</div>
							<div className="flex justify-end space-x-2 pt-4">
								<Button variant="outline" onClick={() => setEditPatient(null)}>
									Cancelar
								</Button>
								<Button onClick={handleSaveEdit}>
									Salvar
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}