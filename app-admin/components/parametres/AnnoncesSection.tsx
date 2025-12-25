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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-semibold">Gestion des annonces</h2>
        <Button color="primary" onPress={onCreateOpen} size="sm" className="w-full sm:w-auto">
          Ajouter une annonce
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
          <h3 className="text-lg sm:text-xl font-semibold">Liste des annonces</h3>
        </CardHeader>
        <CardBody className="p-0 sm:p-6">
          {/* Version desktop : Tableau */}
          {!isMobile && (
            <div className="overflow-x-auto">
              <Table aria-label="Table des annonces">
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
                      <p className="font-semibold">{annonce.title}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-600 line-clamp-2 max-w-xs">
                        {annonce.description || 'Aucune description'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-default-600">{annonce.address || 'Aucune adresse'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(annonce.calendarUrlIds || []).length > 0 ? (
                          (annonce.calendarUrlIds || []).map((calId, index) => (
                            <Chip key={index} size="sm" variant="flat">
                              {getCalendarName(calId)}
                            </Chip>
                          ))
                        ) : (
                          <span className="text-xs text-default-400">Aucun calendrier</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(annonce.blockedByAnnonceIds || []).length > 0 ? (
                          (annonce.blockedByAnnonceIds || []).map((annId, index) => (
                            <Chip key={index} size="sm" variant="flat" color="warning">
                              {getAnnonceTitle(annId)}
                            </Chip>
                          ))
                        ) : (
                          <span className="text-xs text-default-400">Aucune</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => handleViewUnavailabilities(annonce)}
                        >
                          Indisponibilités
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="warning"
                          onPress={() => handleEdit(annonce)}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          onPress={() => handleDelete(annonce._id)}
                          isLoading={deleting === annonce._id}
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
          )}

          {/* Version mobile : Cards */}
          {isMobile && (
            <div className="space-y-3 p-3 sm:p-4">
            {annonces.length === 0 ? (
              <p className="text-center text-default-500 py-8">Aucune annonce</p>
            ) : (
              annonces.map((annonce) => (
                <Card key={annonce._id} className="shadow-sm border border-default-200">
                  <CardBody className="p-4 sm:p-5">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg mb-1">{annonce.title}</h3>
                      </div>

                      {annonce.description && (
                        <div>
                          <p className="text-xs text-default-500 mb-1">Description</p>
                          <p className="text-sm text-default-600">{annonce.description}</p>
                        </div>
                      )}

                      {annonce.address && (
                        <div>
                          <p className="text-xs text-default-500 mb-1">Adresse</p>
                          <p className="text-sm text-default-600">{annonce.address}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-default-500 mb-2">Calendriers associés</p>
                        <div className="flex flex-wrap gap-1">
                          {(annonce.calendarUrlIds || []).length > 0 ? (
                            (annonce.calendarUrlIds || []).map((calId, index) => (
                              <Chip key={index} size="sm" variant="flat">
                                {getCalendarName(calId)}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-xs text-default-400">Aucun calendrier</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-default-500 mb-2">Bloquée par</p>
                        <div className="flex flex-wrap gap-1">
                          {(annonce.blockedByAnnonceIds || []).length > 0 ? (
                            (annonce.blockedByAnnonceIds || []).map((annId, index) => (
                              <Chip key={index} size="sm" variant="flat" color="warning">
                                {getAnnonceTitle(annId)}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-xs text-default-400">Aucune</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-default-200">
                        <p className="text-xs text-default-500 mb-2 font-medium">Actions</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => handleViewUnavailabilities(annonce)}
                            className="text-xs"
                          >
                            Indisponibilités
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            onPress={() => handleEdit(annonce)}
                            className="text-xs"
                          >
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            color="danger"
                            onPress={() => handleDelete(annonce._id)}
                            isLoading={deleting === annonce._id}
                            className="text-xs col-span-2"
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

