'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Spinner } from '@heroui/spinner';
import { calendarApi } from '@/lib/calendar-api';
import type { CalendarUrl, CreateCalendarUrlDto, UpdateCalendarUrlDto } from '@/types/calendar';

/**
 * Page de gestion des calendriers
 * Permet de lister, créer, modifier, supprimer et synchroniser les calendriers
 */
export default function CalendarsPage() {
  // État d'authentification
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // États pour la gestion des calendriers
  const [calendars, setCalendars] = useState<CalendarUrl[]>([]); // Liste des calendriers
  const [loading, setLoading] = useState(true); // État de chargement initial
  const [syncing, setSyncing] = useState<string | null>(null); // ID du calendrier en cours de synchronisation
  const [deleting, setDeleting] = useState<string | null>(null); // ID du calendrier en cours de suppression
  const [error, setError] = useState<string | null>(null); // Message d'erreur à afficher

  // Gestion des modals (création et édition)
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();

  // État pour le calendrier en cours d'édition
  const [editingCalendar, setEditingCalendar] = useState<CalendarUrl | null>(null);
  // Données du formulaire (utilisé pour création et édition)
  const [formData, setFormData] = useState<CreateCalendarUrlDto>({
    url: '',
    name: '',
    description: '',
    platform: 'airbnb',
    isActive: true,
  });

  // Redirection vers la page de login si non authentifié
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/login');
    }
  }, [authenticated, authLoading, router]);

  // Chargement des calendriers une fois authentifié
  useEffect(() => {
    if (authenticated) {
      loadCalendars();
    }
  }, [authenticated]);

  /**
   * Charge la liste de tous les calendriers depuis l'API
   */
  const loadCalendars = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await calendarApi.getAll();
      setCalendars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des calendriers');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crée un nouveau calendrier avec les données du formulaire
   */
  const handleCreate = async () => {
    try {
      setError(null);
      await calendarApi.create(formData);
      await loadCalendars(); // Recharge la liste après création
      onCreateClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  };

  /**
   * Prépare le formulaire d'édition avec les données du calendrier sélectionné
   * @param calendar - Le calendrier à modifier
   */
  const handleEdit = (calendar: CalendarUrl) => {
    setEditingCalendar(calendar);
    setFormData({
      url: calendar.url,
      name: calendar.name || '',
      description: calendar.description || '',
      platform: calendar.platform,
      isActive: calendar.isActive,
    });
    onEditOpen();
  };

  /**
   * Met à jour un calendrier existant
   */
  const handleUpdate = async () => {
    if (!editingCalendar) return;

    try {
      setError(null);
      await calendarApi.update(editingCalendar._id, formData);
      await loadCalendars(); // Recharge la liste après mise à jour
      onEditClose();
      resetForm();
      setEditingCalendar(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  /**
   * Supprime un calendrier après confirmation
   * @param id - ID du calendrier à supprimer
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce calendrier ?')) {
      return;
    }

    try {
      setDeleting(id);
      setError(null);
      await calendarApi.delete(id);
      await loadCalendars(); // Recharge la liste après suppression
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  /**
   * Synchronise un calendrier avec l'API externe (Airbnb, etc.)
   * Récupère les nouvelles réservations et met à jour les existantes
   * @param id - ID du calendrier à synchroniser
   */
  const handleSync = async (id: string) => {
    try {
      setSyncing(id);
      setError(null);
      const result = await calendarApi.sync(id);
      alert(`Synchronisation terminée : ${result.created} créée(s), ${result.updated} mise(s) à jour`);
      await loadCalendars(); // Recharge la liste après synchronisation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la synchronisation');
    } finally {
      setSyncing(null);
    }
  };

  /**
   * Réinitialise le formulaire aux valeurs par défaut
   */
  const resetForm = () => {
    setFormData({
      url: '',
      name: '',
      description: '',
      platform: 'airbnb',
      isActive: true,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold">Gestion des calendriers</h1>
        <Button color="primary" onPress={onCreateOpen} size="sm" className="w-full sm:w-auto">
          Ajouter un calendrier
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-danger">
          <CardBody>
            <p className="text-danger text-sm">{error}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-lg sm:text-xl font-semibold">Liste des calendriers</h2>
        </CardHeader>
        <CardBody className="p-0 sm:p-6">
          {/* Version desktop : Tableau */}
          <div className="hidden md:block overflow-x-auto">
            <Table aria-label="Table des calendriers">
              <TableHeader>
                <TableColumn>Nom</TableColumn>
                <TableColumn>URL</TableColumn>
                <TableColumn>Plateforme</TableColumn>
                <TableColumn>Statut</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Aucun calendrier">
                {calendars.map((calendar) => (
                  <TableRow key={calendar._id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{calendar.name || 'Sans nom'}</p>
                        {calendar.description && (
                          <p className="text-sm text-default-500">{calendar.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-600 break-all">{calendar.url}</p>
                    </TableCell>
                    <TableCell>
                      <Chip size="sm" variant="flat">
                        {calendar.platform}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={calendar.isActive ? 'success' : 'default'}
                        variant="flat"
                      >
                        {calendar.isActive ? 'Actif' : 'Inactif'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => router.push(`/calendars/${calendar._id}/reservations`)}
                        >
                          Voir réservations
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="secondary"
                          onPress={() => handleSync(calendar._id)}
                          isLoading={syncing === calendar._id}
                        >
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="warning"
                          onPress={() => handleEdit(calendar)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => handleDelete(calendar._id)}
                          isLoading={deleting === calendar._id}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Version mobile : Cards */}
          <div className="md:hidden space-y-3 p-4">
            {calendars.length === 0 ? (
              <p className="text-center text-default-500 py-8">Aucun calendrier</p>
            ) : (
              calendars.map((calendar) => (
                <Card key={calendar._id} className="shadow-sm">
                  <CardBody className="p-4">
                    <div className="space-y-3">
                      {/* Nom et Description */}
                      <div>
                        <h3 className="font-semibold text-base mb-1">
                          {calendar.name || 'Sans nom'}
                        </h3>
                        {calendar.description && (
                          <p className="text-sm text-default-500">{calendar.description}</p>
                        )}
                      </div>

                      {/* URL */}
                      <div>
                        <p className="text-xs text-default-500 mb-1">URL</p>
                        <p className="text-xs text-default-600 break-all">{calendar.url}</p>
                      </div>

                      {/* Plateforme et Statut */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <p className="text-xs text-default-500 mb-1">Plateforme</p>
                          <Chip size="sm" variant="flat">
                            {calendar.platform}
                          </Chip>
                        </div>
                        <div>
                          <p className="text-xs text-default-500 mb-1">Statut</p>
                          <Chip
                            size="sm"
                            color={calendar.isActive ? 'success' : 'default'}
                            variant="flat"
                          >
                            {calendar.isActive ? 'Actif' : 'Inactif'}
                          </Chip>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-default-200">
                        <p className="text-xs text-default-500 mb-2">Actions</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => router.push(`/calendars/${calendar._id}/reservations`)}
                            className="text-xs"
                          >
                            Réservations
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="secondary"
                            onPress={() => handleSync(calendar._id)}
                            isLoading={syncing === calendar._id}
                            className="text-xs"
                          >
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            onPress={() => handleEdit(calendar)}
                            className="text-xs"
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => handleDelete(calendar._id)}
                            isLoading={deleting === calendar._id}
                            className="text-xs"
                          >
                            Supprimer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      {/* Modal de création */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Ajouter un calendrier</ModalHeader>
          <ModalBody>
            <Input
              label="URL du calendrier"
              placeholder="https://..."
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              isRequired
            />
            <Input
              label="Nom"
              placeholder="Nom du calendrier"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Description"
              placeholder="Description du calendrier"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Select
              label="Plateforme"
              selectedKeys={[formData.platform]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFormData({ ...formData, platform: selected });
              }}
            >
              <SelectItem key="airbnb">
                Airbnb
              </SelectItem>
              <SelectItem key="booking">
                Booking
              </SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onCreateClose}>
              Annuler
            </Button>
            <Button color="primary" onPress={handleCreate}>
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'édition */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Modifier le calendrier</ModalHeader>
          <ModalBody>
            <Input
              label="URL du calendrier"
              placeholder="https://..."
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              isRequired
            />
            <Input
              label="Nom"
              placeholder="Nom du calendrier"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input
              label="Description"
              placeholder="Description du calendrier"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <Select
              label="Plateforme"
              selectedKeys={[formData.platform]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setFormData({ ...formData, platform: selected });
              }}
            >
              <SelectItem key="airbnb">
                Airbnb
              </SelectItem>
              <SelectItem key="booking">
                Booking
              </SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onEditClose}>
              Annuler
            </Button>
            <Button color="primary" onPress={handleUpdate}>
              Enregistrer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

