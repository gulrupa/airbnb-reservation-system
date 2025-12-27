'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@heroui/dropdown';

/**
 * Section de gestion des calendriers dans la page Paramètres
 * Permet de lister, créer, modifier, supprimer et synchroniser les calendriers
 */
export function CalendarsSection() {
  const router = useRouter();

  // États pour la gestion des calendriers
  const [calendars, setCalendars] = useState<CalendarUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  const [formData, setFormData] = useState<CreateCalendarUrlDto>({
    url: '',
    name: '',
    description: '',
    platform: 'airbnb',
    isActive: true,
  });

  // État pour détecter si on est sur mobile
  const [isMobile, setIsMobile] = useState(false);

  // Détection de la taille de l'écran
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Chargement des calendriers au montage du composant
  useEffect(() => {
    loadCalendars();
  }, []);

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
      await loadCalendars();
      onCreateClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  };

  /**
   * Prépare le formulaire d'édition avec les données du calendrier sélectionné
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
      await loadCalendars();
      onEditClose();
      resetForm();
      setEditingCalendar(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  /**
   * Supprime un calendrier après confirmation
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce calendrier ?')) {
      return;
    }

    try {
      setDeleting(id);
      setError(null);
      await calendarApi.delete(id);
      await loadCalendars();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  /**
   * Synchronise un calendrier avec l'API externe
   */
  const handleSync = async (id: string) => {
    try {
      setSyncing(id);
      setError(null);
      const result = await calendarApi.sync(id);
      alert(`Synchronisation terminée : ${result.created} créée(s), ${result.updated} mise(s) à jour`);
      await loadCalendars();
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

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-6 h-6 text-primary"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" 
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Gestion des calendriers</h2>
            <p className="text-sm text-default-500 mt-1">Configurez vos calendriers externes (Airbnb, Booking, etc.)</p>
          </div>
        </div>
        <Button 
          color="primary" 
          variant="flat"
          onPress={onCreateOpen} 
          size="sm"
          className="w-full sm:w-auto"
          startContent={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          }
        >
          Ajouter un calendrier
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-danger-200 bg-danger-50 dark:bg-danger-50/10">
          <CardBody>
            <p className="text-danger text-sm font-medium">{error}</p>
          </CardBody>
        </Card>
      )}

      <Card className="shadow-lg border border-default-200">
        <CardHeader className="pb-3 border-b border-default-200 bg-default-50/50 dark:bg-default-100/20">
          <div className="flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2} 
              stroke="currentColor" 
              className="w-5 h-5 text-primary"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h.008v.008H4.125V6.75zm.375 5.25h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h.008v.008H4.125V12zm.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h.008v.008H4.125v-.008z" 
              />
            </svg>
            <h3 className="text-lg sm:text-xl font-bold">Liste des calendriers</h3>
          </div>
        </CardHeader>
        <CardBody className="p-0 sm:p-6">
          {/* Version desktop : Tableau */}
          {!isMobile && (
            <div className="overflow-x-auto">
              <Table 
                aria-label="Table des calendriers"
                classNames={{
                  wrapper: "shadow-none",
                  th: "bg-default-100/50 dark:bg-default-50/30 text-default-700 font-bold text-sm uppercase",
                  td: "py-4",
                  tr: "hover:bg-default-50/50 transition-colors border-b border-default-100"
                }}
                removeWrapper
              >
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
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-primary/10">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={2} 
                            stroke="currentColor" 
                            className="w-4 h-4 text-primary"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" 
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-default-900">{calendar.name || 'Sans nom'}</p>
                          {calendar.description && (
                            <p className="text-sm text-default-500 mt-0.5">{calendar.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-600 break-all max-w-md">
                        {calendar.url}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        size="sm" 
                        variant="flat"
                        className="bg-secondary/10 text-secondary border border-secondary/20"
                      >
                        {calendar.platform}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={calendar.isActive ? 'success' : 'default'}
                        variant="flat"
                        className={calendar.isActive ? "border border-success/30" : ""}
                      >
                        {calendar.isActive ? 'Actif' : 'Inactif'}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => router.push(`/calendars/${calendar._id}/reservations`)}
                          className="font-medium"
                        >
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="secondary"
                          onPress={() => handleSync(calendar._id)}
                          isLoading={syncing === calendar._id}
                          className="font-medium"
                        >
                          Sync
                        </Button>
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              className="min-w-unit-8"
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={2} 
                                stroke="currentColor" 
                                className="w-5 h-5"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" 
                                />
                              </svg>
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu aria-label="Actions">
                            <DropdownItem
                              key="edit"
                              onPress={() => handleEdit(calendar)}
                              startContent={
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  strokeWidth={2} 
                                  stroke="currentColor" 
                                  className="w-4 h-4"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" 
                                  />
                                </svg>
                              }
                            >
                              Modifier
                            </DropdownItem>
                            <DropdownItem
                              key="delete"
                              className="text-danger"
                              color="danger"
                              onPress={() => handleDelete(calendar._id)}
                              startContent={
                                deleting === calendar._id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    strokeWidth={2} 
                                    stroke="currentColor" 
                                    className="w-4 h-4"
                                  >
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" 
                                    />
                                  </svg>
                                )
                              }
                            >
                              Supprimer
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Version mobile : Cards */}
          {isMobile && (
            <div className="space-y-4 p-3 sm:p-4">
            {calendars.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex p-3 rounded-full bg-default-100 mb-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2} 
                    stroke="currentColor" 
                    className="w-6 h-6 text-default-400"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" 
                    />
                  </svg>
                </div>
                <p className="text-default-500 font-medium">Aucun calendrier</p>
              </div>
            ) : (
              calendars.map((calendar) => (
                <Card key={calendar._id} className="shadow-md border border-default-200 hover:shadow-lg transition-all duration-200 hover:border-primary/30">
                  <CardBody className="p-5 sm:p-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={2} 
                            stroke="currentColor" 
                            className="w-5 h-5 text-primary"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" 
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg sm:text-xl mb-1 text-default-900">
                            {calendar.name || 'Sans nom'}
                          </h3>
                          {calendar.description && (
                            <p className="text-sm text-default-500 mt-1">{calendar.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-3">
                        <p className="text-xs font-semibold text-default-500 mb-1.5 uppercase tracking-wide">URL</p>
                        <p className="text-sm text-default-700 break-all leading-relaxed">{calendar.url}</p>
                      </div>

                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-3 flex-1 min-w-[120px]">
                          <p className="text-xs font-semibold text-default-500 mb-1.5 uppercase tracking-wide">Plateforme</p>
                          <Chip 
                            size="sm" 
                            variant="flat"
                            className="bg-secondary/10 text-secondary border border-secondary/20"
                          >
                            {calendar.platform}
                          </Chip>
                        </div>
                        <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-3 flex-1 min-w-[120px]">
                          <p className="text-xs font-semibold text-default-500 mb-1.5 uppercase tracking-wide">Statut</p>
                          <Chip
                            size="sm"
                            color={calendar.isActive ? 'success' : 'default'}
                            variant="flat"
                            className={calendar.isActive ? "border border-success/30" : ""}
                          >
                            {calendar.isActive ? 'Actif' : 'Inactif'}
                          </Chip>
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-default-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => router.push(`/calendars/${calendar._id}/reservations`)}
                            className="font-medium flex-1 min-w-[120px]"
                            startContent={
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={2} 
                                stroke="currentColor" 
                                className="w-4 h-4"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" 
                                />
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                                />
                              </svg>
                            }
                          >
                            Voir
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="secondary"
                            onPress={() => handleSync(calendar._id)}
                            isLoading={syncing === calendar._id}
                            className="font-medium flex-1 min-w-[120px]"
                            startContent={
                              syncing !== calendar._id && (
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  strokeWidth={2} 
                                  stroke="currentColor" 
                                  className="w-4 h-4"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" 
                                  />
                                </svg>
                              )
                            }
                          >
                            Sync
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            onPress={() => handleEdit(calendar)}
                            className="font-medium flex-1 min-w-[120px]"
                            startContent={
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                strokeWidth={2} 
                                stroke="currentColor" 
                                className="w-4 h-4"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" 
                                />
                              </svg>
                            }
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => handleDelete(calendar._id)}
                            isLoading={deleting === calendar._id}
                            className="font-medium flex-1 min-w-[120px]"
                            startContent={
                              deleting !== calendar._id && (
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  strokeWidth={2} 
                                  stroke="currentColor" 
                                  className="w-4 h-4"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" 
                                  />
                                </svg>
                              )
                            }
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
          )}
        </CardBody>
      </Card>

      {/* Modal de création */}
      <Modal 
        isOpen={isCreateOpen} 
        onClose={onCreateClose} 
        size="2xl" 
        scrollBehavior="inside"
        classNames={{
          base: "max-w-[95vw] sm:max-w-2xl",
          body: "p-3 sm:p-6"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-lg sm:text-xl">Ajouter un calendrier</ModalHeader>
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
              <SelectItem key="airbnb">Airbnb</SelectItem>
              <SelectItem key="booking">Booking</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter className="flex-col sm:flex-row gap-2">
            <Button variant="flat" onPress={onCreateClose} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button color="primary" onPress={handleCreate} className="w-full sm:w-auto">
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'édition */}
      <Modal 
        isOpen={isEditOpen} 
        onClose={onEditClose} 
        size="2xl" 
        scrollBehavior="inside"
        classNames={{
          base: "max-w-[95vw] sm:max-w-2xl",
          body: "p-3 sm:p-6"
        }}
      >
        <ModalContent>
          <ModalHeader className="text-lg sm:text-xl">Modifier le calendrier</ModalHeader>
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
              <SelectItem key="airbnb">Airbnb</SelectItem>
              <SelectItem key="booking">Booking</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter className="flex-col sm:flex-row gap-2">
            <Button variant="flat" onPress={onEditClose} className="w-full sm:w-auto">
              Annuler
            </Button>
            <Button color="primary" onPress={handleUpdate} className="w-full sm:w-auto">
              Enregistrer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

