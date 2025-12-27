'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Input, Textarea } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Spinner } from '@heroui/spinner';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import { annonceApi } from '@/lib/annonce-api';
import { calendarApi } from '@/lib/calendar-api';
import type { Annonce, CreateAnnonceDto, UpdateAnnonceDto } from '@/types/annonce';
import type { CalendarUrl } from '@/types/calendar';

/**
 * Section de gestion des annonces dans la page Paramètres
 * Permet de lister, créer, modifier et supprimer les annonces
 * Les annonces peuvent être associées à plusieurs calendriers
 */
export function AnnoncesSection() {
  const router = useRouter();
  
  // États pour les données et le chargement
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [calendars, setCalendars] = useState<CalendarUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // États pour les modals de création et d'édition
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

  // État pour l'annonce en cours d'édition et les données du formulaire
  const [editingAnnonce, setEditingAnnonce] = useState<Annonce | null>(null);
  const [formData, setFormData] = useState<CreateAnnonceDto>({
    title: '',
    description: '',
    address: '',
    calendarUrlIds: [],
  });
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<Set<string>>(new Set());
  const [selectedBlockedAnnonceIds, setSelectedBlockedAnnonceIds] = useState<Set<string>>(new Set());

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

  // Chargement des données au montage du composant
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Charge la liste des annonces et des calendriers depuis l'API backend
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [annoncesData, calendarsData] = await Promise.all([
        annonceApi.getAll(),
        calendarApi.getAll(),
      ]);
      setAnnonces(annoncesData);
      setCalendars(calendarsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gère la création d'une nouvelle annonce
   */
  const handleCreate = async () => {
    try {
      setError(null);
      const data: CreateAnnonceDto = {
        ...formData,
        calendarUrlIds: Array.from(selectedCalendarIds),
        blockedByAnnonceIds: Array.from(selectedBlockedAnnonceIds),
      };
      await annonceApi.create(data);
      await loadData();
      onCreateClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  };

  /**
   * Prépare le formulaire d'édition avec les données de l'annonce sélectionnée
   */
  const handleEdit = (annonce: Annonce) => {
    setEditingAnnonce(annonce);
    setFormData({
      title: annonce.title,
      description: annonce.description || '',
      address: annonce.address || '',
      calendarUrlIds: [],
    });

    // Extraire les IDs des calendriers
    const calendarIds = (annonce.calendarUrlIds || []).map((cal) => {
      if (typeof cal === 'string') {
        return cal;
      }
      return (cal as CalendarUrl)._id;
    });
    setSelectedCalendarIds(new Set(calendarIds));

    // Extraire les IDs des annonces qui bloquent
    const blockedAnnonceIds = (annonce.blockedByAnnonceIds || []).map((ann) => {
      if (typeof ann === 'string') {
        return ann;
      }
      return (ann as Annonce)._id;
    });
    setSelectedBlockedAnnonceIds(new Set(blockedAnnonceIds));

    onEditOpen();
  };

  /**
   * Met à jour une annonce existante
   */
  const handleUpdate = async () => {
    if (!editingAnnonce) return;

    try {
      setError(null);
      const data: UpdateAnnonceDto = {
        ...formData,
        calendarUrlIds: Array.from(selectedCalendarIds),
        blockedByAnnonceIds: Array.from(selectedBlockedAnnonceIds),
      };
      await annonceApi.update(editingAnnonce._id, data);
      await loadData();
      onEditClose();
      resetForm();
      setEditingAnnonce(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  /**
   * Supprime une annonce après confirmation
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      return;
    }

    try {
      setDeleting(id);
      setError(null);
      await annonceApi.delete(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  /**
   * Réinitialise le formulaire aux valeurs par défaut
   */
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      address: '',
      calendarUrlIds: [],
    });
    setSelectedCalendarIds(new Set());
    setSelectedBlockedAnnonceIds(new Set());
  };

  /**
   * Redirige vers la page des indisponibilités d'une annonce
   */
  const handleViewUnavailabilities = (annonce: Annonce) => {
    router.push(`/annonces/${annonce._id}/indisponibilites`);
  };


  /**
   * Récupère le titre d'une annonce à partir de son ID
   */
  const getAnnonceTitle = (annonceId: string | Annonce): string => {
    if (typeof annonceId === 'string') {
      const annonce = annonces.find((ann) => ann._id === annonceId);
      return annonce?.title || 'Annonce inconnue';
    }
    return annonceId.title || 'Annonce inconnue';
  };

  /**
   * Récupère le nom d'un calendrier à partir de son ID
   */
  const getCalendarName = (calendarId: string | CalendarUrl): string => {
    if (typeof calendarId === 'string') {
      const calendar = calendars.find((cal) => cal._id === calendarId);
      return calendar?.name || calendar?.url || 'Calendrier inconnu';
    }
    return calendarId.name || calendarId.url || 'Calendrier inconnu';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

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
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Gestion des annonces</h2>
            <p className="text-sm text-default-500 mt-1">Créez et gérez vos annonces de location</p>
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
          Ajouter une annonce
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
            <h3 className="text-lg sm:text-xl font-bold">Liste des annonces</h3>
          </div>
        </CardHeader>
        <CardBody className="p-0 sm:p-6">
          {/* Version desktop : Tableau */}
          {!isMobile && (
            <div className="overflow-x-auto">
              <Table 
                aria-label="Table des annonces"
                classNames={{
                  wrapper: "shadow-none",
                  th: "bg-default-100/50 dark:bg-default-50/30 text-default-700 font-bold text-sm uppercase",
                  td: "py-4",
                  tr: "hover:bg-default-50/50 transition-colors border-b border-default-100"
                }}
                removeWrapper
              >
              <TableHeader>
                <TableColumn>Titre</TableColumn>
                <TableColumn>Description</TableColumn>
                <TableColumn>Adresse</TableColumn>
                <TableColumn>Calendriers</TableColumn>
                <TableColumn>Bloquée par</TableColumn>
                <TableColumn>Actions</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Aucune annonce">
                {annonces.map((annonce) => (
                  <TableRow key={annonce._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
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
                              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
                            />
                          </svg>
                        </div>
                        <p className="font-semibold text-default-900">{annonce.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-600 line-clamp-2 max-w-xs">
                        {annonce.description || <span className="text-default-400 italic">Aucune description</span>}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-600">
                        {annonce.address || <span className="text-default-400 italic">Aucune adresse</span>}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {(annonce.calendarUrlIds || []).length > 0 ? (
                          (annonce.calendarUrlIds || []).map((calId, index) => (
                            <Chip 
                              key={index} 
                              size="sm" 
                              variant="flat"
                              className="bg-primary/10 text-primary border border-primary/20"
                            >
                              {getCalendarName(calId)}
                            </Chip>
                          ))
                        ) : (
                          <span className="text-xs text-default-400 italic">Aucun calendrier</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {(annonce.blockedByAnnonceIds || []).length > 0 ? (
                          (annonce.blockedByAnnonceIds || []).map((annId, index) => (
                            <Chip 
                              key={index} 
                              size="sm" 
                              variant="flat" 
                              color="warning"
                              className="border border-warning/30"
                            >
                              {getAnnonceTitle(annId)}
                            </Chip>
                          ))
                        ) : (
                          <span className="text-xs text-default-400 italic">Aucune</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => handleViewUnavailabilities(annonce)}
                          className="font-medium"
                        >
                          Voir
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
                          onPress={() => handleEdit(annonce)}
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
                          onPress={() => handleDelete(annonce._id)}
                              startContent={
                                deleting === annonce._id ? (
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
            {annonces.length === 0 ? (
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
                      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
                    />
                  </svg>
                </div>
                <p className="text-default-500 font-medium">Aucune annonce</p>
              </div>
            ) : (
              annonces.map((annonce) => (
                <Card key={annonce._id} className="shadow-md border border-default-200 hover:shadow-lg transition-all duration-200 hover:border-primary/30">
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
                              d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
                            />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg sm:text-xl mb-1 text-default-900">{annonce.title}</h3>
                        </div>
                      </div>

                      {annonce.description && (
                        <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-3">
                          <p className="text-xs font-semibold text-default-500 mb-1.5 uppercase tracking-wide">Description</p>
                          <p className="text-sm text-default-700 leading-relaxed">{annonce.description}</p>
                        </div>
                      )}

                      {annonce.address && (
                        <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-3">
                          <p className="text-xs font-semibold text-default-500 mb-1.5 uppercase tracking-wide">Adresse</p>
                          <p className="text-sm text-default-700">{annonce.address}</p>
                        </div>
                      )}

                      <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-3">
                        <p className="text-xs font-semibold text-default-500 mb-2 uppercase tracking-wide">Calendriers associés</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(annonce.calendarUrlIds || []).length > 0 ? (
                            (annonce.calendarUrlIds || []).map((calId, index) => (
                              <Chip 
                                key={index} 
                                size="sm" 
                                variant="flat"
                                className="bg-primary/10 text-primary border border-primary/20"
                              >
                                {getCalendarName(calId)}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-xs text-default-400 italic">Aucun calendrier</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-default-50 dark:bg-default-100/30 rounded-lg p-3">
                        <p className="text-xs font-semibold text-default-500 mb-2 uppercase tracking-wide">Bloquée par</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(annonce.blockedByAnnonceIds || []).length > 0 ? (
                            (annonce.blockedByAnnonceIds || []).map((annId, index) => (
                              <Chip 
                                key={index} 
                                size="sm" 
                                variant="flat" 
                                color="warning"
                                className="border border-warning/30"
                              >
                                {getAnnonceTitle(annId)}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-xs text-default-400 italic">Aucune</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-default-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => handleViewUnavailabilities(annonce)}
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
                            color="warning"
                            onPress={() => handleEdit(annonce)}
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
                            onPress={() => handleDelete(annonce._id)}
                            isLoading={deleting === annonce._id}
                            className="font-medium flex-1 min-w-[120px]"
                            startContent={
                              deleting !== annonce._id && (
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
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-lg sm:text-xl">
                Ajouter une nouvelle annonce
              </ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Titre"
                  placeholder="Titre de l'annonce"
                  variant="bordered"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  isRequired
                />
                <Textarea
                  label="Description (optionnel)"
                  placeholder="Description de l'annonce"
                  variant="bordered"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Input
                  label="Adresse (optionnel)"
                  placeholder="Adresse de l'annonce"
                  variant="bordered"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
                <Select
                  label="Calendriers associés (optionnel)"
                  placeholder="Sélectionnez les calendriers"
                  variant="bordered"
                  selectionMode="multiple"
                  selectedKeys={selectedCalendarIds}
                  onSelectionChange={(keys) => {
                    setSelectedCalendarIds(keys as Set<string>);
                  }}
                >
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar._id}>
                      {calendar.name || calendar.url}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Annonces qui bloquent cette annonce (optionnel)"
                  placeholder="Sélectionnez les annonces"
                  variant="bordered"
                  selectionMode="multiple"
                  selectedKeys={selectedBlockedAnnonceIds}
                  onSelectionChange={(keys) => {
                    setSelectedBlockedAnnonceIds(keys as Set<string>);
                  }}
                >
                  {annonces.map((annonce) => (
                    <SelectItem key={annonce._id}>
                      {annonce.title}
                    </SelectItem>
                  ))}
                </Select>
              </ModalBody>
              <ModalFooter className="flex-col sm:flex-row gap-2">
                <Button variant="flat" onPress={onClose} className="w-full sm:w-auto">
                  Annuler
                </Button>
                <Button color="primary" onPress={handleCreate} className="w-full sm:w-auto">
                  Créer
                </Button>
              </ModalFooter>
            </>
          )}
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
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-lg sm:text-xl">
                Modifier l'annonce
              </ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Titre"
                  placeholder="Titre de l'annonce"
                  variant="bordered"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  isRequired
                />
                <Textarea
                  label="Description (optionnel)"
                  placeholder="Description de l'annonce"
                  variant="bordered"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <Input
                  label="Adresse (optionnel)"
                  placeholder="Adresse de l'annonce"
                  variant="bordered"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
                <Select
                  label="Calendriers associés (optionnel)"
                  placeholder="Sélectionnez les calendriers"
                  variant="bordered"
                  selectionMode="multiple"
                  selectedKeys={selectedCalendarIds}
                  onSelectionChange={(keys) => {
                    setSelectedCalendarIds(keys as Set<string>);
                  }}
                >
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar._id}>
                      {calendar.name || calendar.url}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="Annonces qui bloquent cette annonce (optionnel)"
                  placeholder="Sélectionnez les annonces"
                  variant="bordered"
                  selectionMode="multiple"
                  selectedKeys={selectedBlockedAnnonceIds}
                  onSelectionChange={(keys) => {
                    setSelectedBlockedAnnonceIds(keys as Set<string>);
                  }}
                >
                  {annonces
                    .filter((ann) => ann._id !== editingAnnonce?._id)
                    .map((annonce) => (
                      <SelectItem key={annonce._id}>
                        {annonce.title}
                      </SelectItem>
                    ))}
                </Select>
              </ModalBody>
              <ModalFooter className="flex-col sm:flex-row gap-2">
                <Button variant="flat" onPress={onClose} className="w-full sm:w-auto">
                  Annuler
                </Button>
                <Button color="primary" onPress={handleUpdate} className="w-full sm:w-auto">
                  Mettre à jour
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </>
  );
}

