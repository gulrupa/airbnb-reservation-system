'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
import type { CalendarUrl, Reservation } from '@/types/calendar';

/**
 * Page de gestion des annonces.
 * Permet de lister, créer, modifier et supprimer les annonces.
 * Les annonces peuvent être associées à plusieurs calendriers.
 */
export default function AnnoncesPage() {
  // États d'authentification et de navigation
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // États pour les données et le chargement
  const [annonces, setAnnonces] = useState<Annonce[]>([]); // Liste des annonces
  const [calendars, setCalendars] = useState<CalendarUrl[]>([]); // Liste des calendriers pour la sélection
  const [loading, setLoading] = useState(true); // État de chargement principal
  const [deleting, setDeleting] = useState<string | null>(null); // ID de l'annonce en cours de suppression
  const [error, setError] = useState<string | null>(null); // Message d'erreur

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

  // États pour la modal des indisponibilités
  const {
    isOpen: isUnavailabilitiesOpen,
    onOpen: onUnavailabilitiesOpen,
    onClose: onUnavailabilitiesClose,
  } = useDisclosure();
  const [selectedAnnonceForUnavailabilities, setSelectedAnnonceForUnavailabilities] = useState<Annonce | null>(null);
  const [unavailabilities, setUnavailabilities] = useState<Reservation[]>([]);
  const [loadingUnavailabilities, setLoadingUnavailabilities] = useState(false);

  // Redirection vers la page de login si non authentifié
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/login');
    }
  }, [authenticated, authLoading, router]);

  // Chargement des données une fois authentifié
  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  /**
   * Charge la liste des annonces et des calendriers depuis l'API backend.
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
   * Gère la création d'une nouvelle annonce.
   * Envoie les données du formulaire à l'API et recharge la liste.
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
      await loadData(); // Recharge la liste après création
      onCreateClose(); // Ferme la modal
      resetForm(); // Réinitialise le formulaire
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    }
  };

  /**
   * Prépare le formulaire d'édition avec les données de l'annonce sélectionnée.
   * @param annonce - L'annonce à modifier
   */
  const handleEdit = (annonce: Annonce) => {
    setEditingAnnonce(annonce);
    setFormData({
      title: annonce.title,
      description: annonce.description || '',
      address: annonce.address || '',
      calendarUrlIds: [],
    });

    // Extraire les IDs des calendriers (peuvent être des objets ou des strings)
    const calendarIds = (annonce.calendarUrlIds || []).map((cal) => {
      if (typeof cal === 'string') {
        return cal;
      }
      return (cal as CalendarUrl)._id;
    });
    setSelectedCalendarIds(new Set(calendarIds));

    // Extraire les IDs des annonces qui bloquent (peuvent être des objets ou des strings)
    const blockedAnnonceIds = (annonce.blockedByAnnonceIds || []).map((ann) => {
      if (typeof ann === 'string') {
        return ann;
      }
      return (ann as Annonce)._id;
    });
    setSelectedBlockedAnnonceIds(new Set(blockedAnnonceIds));

    onEditOpen(); // Ouvre la modal d'édition
  };

  /**
   * Met à jour une annonce existante.
   * Envoie les données du formulaire à l'API et recharge la liste.
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
      await loadData(); // Recharge la liste après mise à jour
      onEditClose(); // Ferme la modal
      resetForm(); // Réinitialise le formulaire
      setEditingAnnonce(null); // Réinitialise l'annonce en édition
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  /**
   * Supprime une annonce après confirmation.
   * @param id - ID de l'annonce à supprimer
   */
  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      return;
    }

    try {
      setDeleting(id); // Indique que cette annonce est en cours de suppression
      setError(null);
      await annonceApi.delete(id);
      await loadData(); // Recharge la liste après suppression
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setDeleting(null); // Réinitialise l'état de suppression
    }
  };

  /**
   * Réinitialise le formulaire aux valeurs par défaut.
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
   * Charge et affiche les indisponibilités d'une annonce.
   * @param annonce - L'annonce pour laquelle afficher les indisponibilités
   */
  const handleViewUnavailabilities = async (annonce: Annonce) => {
    setSelectedAnnonceForUnavailabilities(annonce);
    setLoadingUnavailabilities(true);
    setUnavailabilities([]);
    onUnavailabilitiesOpen();

    try {
      const data = await annonceApi.getUnavailabilities(annonce._id);
      setUnavailabilities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des indisponibilités');
    } finally {
      setLoadingUnavailabilities(false);
    }
  };

  /**
   * Formate une date ISO en format français lisible
   * @param dateString - Date au format ISO 8601
   * @returns Date formatée en français (ex: "21 décembre 2025")
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Récupère le titre d'une annonce à partir de son ID.
   * @param annonceId - ID de l'annonce
   * @returns Le titre de l'annonce ou "Annonce inconnue"
   */
  const getAnnonceTitle = (annonceId: string | Annonce): string => {
    if (typeof annonceId === 'string') {
      const annonce = annonces.find((ann) => ann._id === annonceId);
      return annonce?.title || 'Annonce inconnue';
    }
    return annonceId.title || 'Annonce inconnue';
  };

  /**
   * Récupère le nom d'un calendrier à partir de son ID.
   * @param calendarId - ID du calendrier
   * @returns Le nom du calendrier ou "Calendrier inconnu"
   */
  const getCalendarName = (calendarId: string | CalendarUrl): string => {
    if (typeof calendarId === 'string') {
      const calendar = calendars.find((cal) => cal._id === calendarId);
      return calendar?.name || calendar?.url || 'Calendrier inconnu';
    }
    return calendarId.name || calendarId.url || 'Calendrier inconnu';
  };

  // Affichage d'un spinner pendant le chargement initial
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Ne rien afficher si non authentifié (redirection gérée par useEffect)
  if (!authenticated) {
    return null;
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold">Gestion des annonces</h1>
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
          <h2 className="text-lg sm:text-xl font-semibold">Liste des annonces</h2>
        </CardHeader>
        <CardBody className="p-0 sm:p-6">
          {/* Version desktop : Tableau */}
          <div className="hidden md:block overflow-x-auto">
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

          {/* Version mobile : Cards */}
          <div className="md:hidden space-y-3 p-4">
            {annonces.length === 0 ? (
              <p className="text-center text-default-500 py-8">Aucune annonce</p>
            ) : (
              annonces.map((annonce) => (
                <Card key={annonce._id} className="shadow-sm">
                  <CardBody className="p-4">
                    <div className="space-y-3">
                      {/* Titre */}
                      <div>
                        <h3 className="font-semibold text-base mb-1">{annonce.title}</h3>
                      </div>

                      {/* Description */}
                      {annonce.description && (
                        <div>
                          <p className="text-xs text-default-500 mb-1">Description</p>
                          <p className="text-sm text-default-600">{annonce.description}</p>
                        </div>
                      )}

                      {/* Adresse */}
                      {annonce.address && (
                        <div>
                          <p className="text-xs text-default-500 mb-1">Adresse</p>
                          <p className="text-sm text-default-600">{annonce.address}</p>
                        </div>
                      )}

                      {/* Calendriers */}
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

                      {/* Annonces bloquantes */}
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

                      {/* Actions */}
                      <div className="pt-2 border-t border-default-200">
                        <p className="text-xs text-default-500 mb-2">Actions</p>
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
        </CardBody>
      </Card>

      {/* Modal de création */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
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
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Annuler
                </Button>
                <Button color="primary" onPress={handleCreate}>
                  Créer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal d'édition */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
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
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Annuler
                </Button>
                <Button color="primary" onPress={handleUpdate}>
                  Mettre à jour
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal des indisponibilités */}
      <Modal isOpen={isUnavailabilitiesOpen} onClose={onUnavailabilitiesClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Indisponibilités - {selectedAnnonceForUnavailabilities?.title || ''}
              </ModalHeader>
              <ModalBody>
                {loadingUnavailabilities ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : unavailabilities.length === 0 ? (
                  <p className="text-center text-default-500 py-8">
                    Aucune indisponibilité trouvée
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-default-600">
                      {unavailabilities.length} réservation(s) trouvée(s)
                    </p>
                    <Table aria-label="Table des indisponibilités">
                      <TableHeader>
                        <TableColumn>ID Externe</TableColumn>
                        <TableColumn>Date de début</TableColumn>
                        <TableColumn>Date de fin</TableColumn>
                        <TableColumn>Prix</TableColumn>
                        <TableColumn>Voyageurs</TableColumn>
                        <TableColumn>Type</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {unavailabilities.map((reservation) => (
                          <TableRow key={reservation._id}>
                            <TableCell>
                              <p className="font-mono text-sm">{reservation.externalId}</p>
                            </TableCell>
                            <TableCell>{formatDate(reservation.startDate)}</TableCell>
                            <TableCell>{formatDate(reservation.endDate)}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(reservation.price)}
                            </TableCell>
                            <TableCell>{reservation.numberOfTravelers}</TableCell>
                            <TableCell>
                              <Chip
                                size="sm"
                                color={reservation.type === 'manual_block_date' ? 'warning' : 'primary'}
                                variant="flat"
                              >
                                {reservation.type === 'manual_block_date'
                                  ? 'Blocage manuel'
                                  : 'Réservation'}
                              </Chip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Fermer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

