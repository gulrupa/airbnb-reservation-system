'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { Checkbox } from '@heroui/checkbox';
import { Spinner } from '@heroui/spinner';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { calendarApi } from '@/lib/calendar-api';
import { annonceApi } from '@/lib/annonce-api';
import type { Reservation, CalendarUrl } from '@/types/calendar';
import type { Annonce } from '@/types/annonce';

// Configuration de moment en français
moment.locale('fr');
const localizer = momentLocalizer(moment);

/**
 * Interface pour les événements du calendrier
 */
interface CalendarEvent extends Event {
  reservation: Reservation;
  calendar?: CalendarUrl;
  annonce?: Annonce;
}

/**
 * Page de visualisation des réservations avec calendrier
 * Affiche toutes les réservations dans un calendrier interactif
 */
export default function ReservationsPage() {
  // État d'authentification
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // États pour les données
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [calendars, setCalendars] = useState<CalendarUrl[]>([]);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les filtres
  const [selectedAnnonceId, setSelectedAnnonceId] = useState<string>('all');
  const [hideManualBlocks, setHideManualBlocks] = useState(true); // Caché par défaut

  // État pour la date du calendrier
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal pour afficher les détails d'une réservation
  const {
    isOpen: isDetailOpen,
    onOpen: onDetailOpen,
    onClose: onDetailClose,
  } = useDisclosure();
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Modal pour afficher les événements supplémentaires (quand on clique sur "+X more")
  const {
    isOpen: isShowMoreOpen,
    onOpen: onShowMoreOpen,
    onClose: onShowMoreClose,
  } = useDisclosure();
  const [showMoreEvents, setShowMoreEvents] = useState<CalendarEvent[]>([]);
  const [showMoreDate, setShowMoreDate] = useState<Date | null>(null);

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
   * Charge toutes les données nécessaires
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [reservationsData, calendarsData, annoncesData] = await Promise.all([
        calendarApi.getAllReservations(),
        calendarApi.getAll(),
        annonceApi.getAll(),
      ]);

      setReservations(reservationsData);
      setCalendars(calendarsData);
      setAnnonces(annoncesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtre les réservations selon les critères sélectionnés
   */
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Filtre par annonce (via les calendriers associés)
    if (selectedAnnonceId !== 'all') {
      const annonce = annonces.find((a) => a._id === selectedAnnonceId);
      if (annonce && annonce.calendarUrlIds) {
        const calendarIds = annonce.calendarUrlIds.map((cal) =>
          typeof cal === 'string' ? cal : cal._id,
        );
        filtered = filtered.filter((r) => r.calendarUrlId && calendarIds.includes(r.calendarUrlId));
      } else {
        filtered = [];
      }
    }

    // Filtre les blocages manuels si demandé
    if (hideManualBlocks) {
      filtered = filtered.filter((r) => r.type !== 'manual_block_date');
    }

    return filtered;
  }, [reservations, selectedAnnonceId, hideManualBlocks, annonces]);

  /**
   * Convertit les réservations en événements pour le calendrier
   * Pour les réservations multi-jours, exclut le dernier jour de l'affichage
   */
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return filteredReservations.map((reservation) => {
      const calendar = calendars.find((c) => c._id === reservation.calendarUrlId);
      const annonce = annonces.find((a) =>
        a.calendarUrlIds?.some((cal) => {
          const calId = typeof cal === 'string' ? cal : cal._id;
          return calId === reservation.calendarUrlId;
        }),
      );

      const startDate = new Date(reservation.startDate);
      const endDate = new Date(reservation.endDate);
      
      // Pour les réservations multi-jours, exclure le dernier jour de l'affichage
      const startMoment = moment(startDate).startOf('day');
      const endMoment = moment(endDate).startOf('day');
      const duration = endMoment.diff(startMoment, 'days');
      
      // Si la réservation dure plus d'un jour, soustraire un jour de la date de fin
      let displayEndDate = endDate;
      if (duration > 0) {
        displayEndDate = moment(endDate).subtract(1, 'day').toDate();
      }
      
      return {
        title: reservation.type === 'manual_block_date' 
          ? '🔒 Blocage manuel' 
          : `💰 ${reservation.externalId} - ${reservation.numberOfTravelers} voyageur${reservation.numberOfTravelers > 1 ? 's' : ''}`,
        start: startDate,
        end: displayEndDate,
        reservation,
        calendar,
        annonce,
      };
    });
  }, [filteredReservations, calendars, annonces]);

  /**
   * Gère le clic sur un événement du calendrier
   */
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedReservation(event.reservation);
    onDetailOpen();
  };

  /**
   * Gère le clic sur "+X more" pour afficher les événements supplémentaires
   */
  const handleShowMore = (events: CalendarEvent[], date: Date) => {
    setShowMoreEvents(events);
    setShowMoreDate(date);
    onShowMoreOpen();
  };

  /**
   * Formate une date en français
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Formate une date avec l'heure
   */
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Calcule le nombre de nuits d'une réservation
   */
  const calculateNights = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Réservations</h1>

        {/* Filtres */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold">Filtres</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtre par annonce */}
              <Select
                label="Annonce"
                selectedKeys={selectedAnnonceId !== 'all' ? [selectedAnnonceId] : ['all']}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setSelectedAnnonceId(value || 'all');
                }}
              >
                <SelectItem key="all" value="all">
                  Toutes les annonces
                </SelectItem>
                {annonces.map((annonce) => (
                  <SelectItem key={annonce._id} value={annonce._id}>
                    {annonce.title}
                  </SelectItem>
                ))}
              </Select>

              {/* Checkbox pour cacher les blocages manuels */}
              <div className="flex items-center">
                <Checkbox
                  isSelected={hideManualBlocks}
                  onValueChange={setHideManualBlocks}
                >
                  Cacher les blocages manuels
                </Checkbox>
              </div>
            </div>
          </CardBody>
        </Card>

        {error && (
          <Card className="mb-4 border-danger">
            <CardBody>
              <p className="text-danger text-sm">{error}</p>
            </CardBody>
          </Card>
        )}

        {/* Calendrier */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-lg sm:text-xl font-semibold">
              Calendrier ({filteredReservations.length} réservation{filteredReservations.length > 1 ? 's' : ''})
            </h2>
          </CardHeader>
          <CardBody className="p-0 sm:p-6">
            <style jsx global>{`
              /* Styles pour le thème sombre du calendrier - évite le blanc */
              .dark .rbc-calendar {
                background-color: #1a1a1a !important;
                color: #e4e4e7 !important;
              }
              
              .dark .rbc-header {
                border-bottom-color: #3f3f46 !important;
                color: #e4e4e7 !important;
                background-color: #1a1a1a !important;
              }
              
              .dark .rbc-day-bg {
                border-color: #3f3f46 !important;
                background-color: #1a1a1a !important;
              }
              
              .dark .rbc-today {
                background-color: #27272a !important;
              }
              
              .dark .rbc-off-range-bg {
                background-color: #18181b !important;
              }
              
              .dark .rbc-off-range {
                color: #71717a !important;
              }
              
              .dark .rbc-date-cell {
                color: #e4e4e7 !important;
              }
              
              .dark .rbc-date-cell > a {
                color: #e4e4e7 !important;
              }
              
              .dark .rbc-toolbar {
                color: #e4e4e7 !important;
                background-color: #1a1a1a !important;
              }
              
              .dark .rbc-toolbar button {
                color: #e4e4e7 !important;
                background-color: transparent !important;
                border-color: #3f3f46 !important;
              }
              
              .dark .rbc-toolbar button:hover {
                background-color: #27272a !important;
                color: #ffffff !important;
              }
              
              .dark .rbc-toolbar button.rbc-active {
                background-color: #9333ea !important;
                color: #ffffff !important;
                border-color: #9333ea !important;
              }
              
              .dark .rbc-time-slot {
                border-top-color: #3f3f46 !important;
              }
              
              .dark .rbc-time-header-content {
                border-left-color: #3f3f46 !important;
              }
              
              .dark .rbc-agenda-view table {
                background-color: #1a1a1a !important;
                color: #e4e4e7 !important;
                border-color: #3f3f46 !important;
              }
              
              .dark .rbc-agenda-view table thead {
                background-color: #27272a !important;
                color: #e4e4e7 !important;
              }
              
              .dark .rbc-agenda-view table thead th {
                border-color: #3f3f46 !important;
                color: #e4e4e7 !important;
              }
              
              .dark .rbc-agenda-view table tbody tr {
                border-color: #3f3f46 !important;
              }
              
              .dark .rbc-agenda-view table tbody td {
                border-color: #3f3f46 !important;
                color: #e4e4e7 !important;
              }
              
              .dark .rbc-agenda-date-cell,
              .dark .rbc-agenda-time-cell {
                color: #e4e4e7 !important;
              }
              
              .dark .rbc-show-more {
                background-color: #27272a !important;
                color: #e4e4e7 !important;
              }
              
              .dark .rbc-current-time-indicator {
                background-color: #9333ea !important;
              }
              
              .dark .rbc-time-header-gutter,
              .dark .rbc-time-content {
                border-top-color: #3f3f46 !important;
              }
              
              .dark .rbc-day-slot .rbc-time-slot {
                border-top-color: #3f3f46 !important;
              }
              
              .dark .rbc-time-view {
                border-color: #3f3f46 !important;
              }
              
              /* Griser les jours hors du mois affiché - Mode clair */
              .rbc-off-range-bg {
                background-color: #f5f5f5 !important;
                opacity: 0.5 !important;
              }
              
              .rbc-off-range {
                color: #9ca3af !important;
                opacity: 0.6 !important;
              }
              
              .rbc-date-cell.rbc-off-range {
                color: #9ca3af !important;
                opacity: 0.6 !important;
              }
              
              .rbc-date-cell.rbc-off-range > a {
                color: #9ca3af !important;
                opacity: 0.6 !important;
              }
              
              /* Griser les événements dans les jours hors du mois */
              .rbc-off-range-bg .rbc-event {
                opacity: 0.5 !important;
              }
              
              /* Mode sombre - améliorer le grisage */
              .dark .rbc-off-range-bg {
                background-color: #0f0f0f !important;
                opacity: 0.4 !important;
              }
              
              .dark .rbc-off-range {
                color: #52525b !important;
                opacity: 0.5 !important;
              }
              
              .dark .rbc-date-cell.rbc-off-range {
                color: #52525b !important;
                opacity: 0.5 !important;
              }
              
              .dark .rbc-date-cell.rbc-off-range > a {
                color: #52525b !important;
                opacity: 0.5 !important;
              }
              
              .dark .rbc-off-range-bg .rbc-event {
                opacity: 0.4 !important;
              }
       
            `}</style>
            <div style={{ height: '600px' }} className="rbc-calendar">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view="month"
                date={currentDate}
                onNavigate={setCurrentDate}
                onSelectEvent={handleSelectEvent}
                onShowMore={handleShowMore}
                views={['month']}
                messages={{
                  next: 'Suivant',
                  previous: 'Précédent',
                  today: "Aujourd'hui",
                  month: 'Mois',
                  week: 'Semaine',
                  day: 'Jour',
                  agenda: 'Agenda',
                  date: 'Date',
                  time: 'Heure',
                  event: 'Événement',
                  noEventsInRange: 'Aucune réservation dans cette période',
                }}
                eventPropGetter={(event: CalendarEvent) => {
                  const isManualBlock = event.reservation.type === 'manual_block_date';
                  return {
                    style: {
                      backgroundColor: isManualBlock ? '#f59e0b' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '2px 4px',
                      fontSize: '12px',
                    },
                  };
                }}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modal de détails de réservation */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">
                  {selectedReservation?.type === 'manual_block_date'
                    ? 'Blocage manuel'
                    : 'Détails de la réservation'}
                </h2>
              </ModalHeader>
              <ModalBody>
                {selectedReservation && (
                  <div className="space-y-4">
                    {/* Type */}
                    <div>
                      <p className="text-sm text-default-500 mb-1">Type</p>
                      <Chip
                        size="sm"
                        color={selectedReservation.type === 'manual_block_date' ? 'warning' : 'primary'}
                        variant="flat"
                      >
                        {selectedReservation.type === 'manual_block_date'
                          ? 'Blocage manuel'
                          : 'Réservation'}
                      </Chip>
                    </div>

                    {/* ID Externe */}
                    <div>
                      <p className="text-sm text-default-500 mb-1">ID Externe</p>
                      <p className="font-mono text-sm font-semibold break-all">
                        {selectedReservation.externalId}
                      </p>
                    </div>

                    {/* ID Interne */}
                    <div>
                      <p className="text-sm text-default-500 mb-1">ID Interne</p>
                      <p className="font-mono text-sm break-all">{selectedReservation.internalId}</p>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-default-500 mb-1">Date de début</p>
                        <p className="text-sm font-medium">{formatDate(selectedReservation.startDate)}</p>
                        <p className="text-xs text-default-400">
                          {formatDateTime(selectedReservation.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-default-500 mb-1">Date de fin</p>
                        <p className="text-sm font-medium">{formatDate(selectedReservation.endDate)}</p>
                        <p className="text-xs text-default-400">
                          {formatDateTime(selectedReservation.endDate)}
                        </p>
                      </div>
                    </div>

                    {/* Durée */}
                    <div>
                      <p className="text-sm text-default-500 mb-1">Durée</p>
                      <p className="text-sm font-semibold">
                        {calculateNights(selectedReservation.startDate, selectedReservation.endDate)} nuit
                        {calculateNights(selectedReservation.startDate, selectedReservation.endDate) > 1
                          ? 's'
                          : ''}
                      </p>
                    </div>

                    {/* Prix */}
                    {selectedReservation.type !== 'manual_block_date' && (
                      <div>
                        <p className="text-sm text-default-500 mb-1">Prix</p>
                        <p className="text-lg font-semibold">
                          {new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(selectedReservation.price)}
                        </p>
                      </div>
                    )}

                    {/* Nombre de voyageurs */}
                    {selectedReservation.type !== 'manual_block_date' && (
                      <div>
                        <p className="text-sm text-default-500 mb-1">Nombre de voyageurs</p>
                        <p className="text-sm font-medium">
                          {selectedReservation.numberOfTravelers} voyageur
                          {selectedReservation.numberOfTravelers > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    {/* Calendrier associé */}
                    {selectedReservation.calendarUrlId && (
                      <div>
                        <p className="text-sm text-default-500 mb-1">Calendrier</p>
                        {(() => {
                          const calendar = calendars.find(
                            (c) => c._id === selectedReservation.calendarUrlId,
                          );
                          return calendar ? (
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{calendar.name || 'Sans nom'}</p>
                              <p className="text-xs text-default-400 break-all">{calendar.url}</p>
                              <Chip size="sm" variant="flat">
                                {calendar.platform}
                              </Chip>
                            </div>
                          ) : (
                            <p className="text-sm text-default-400">Calendrier non trouvé</p>
                          );
                        })()}
                      </div>
                    )}

                    {/* Annonce associée */}
                    {(() => {
                      const annonce = annonces.find((a) =>
                        a.calendarUrlIds?.some((cal) => {
                          const calId = typeof cal === 'string' ? cal : cal._id;
                          return calId === selectedReservation?.calendarUrlId;
                        }),
                      );
                      return annonce ? (
                        <div>
                          <p className="text-sm text-default-500 mb-1">Annonce</p>
                          <p className="text-sm font-medium">{annonce.title}</p>
                          {annonce.address && (
                            <p className="text-xs text-default-400">{annonce.address}</p>
                          )}
                        </div>
                      ) : null;
                    })()}

                    {/* Dates de création et modification */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <p className="text-xs text-default-500 mb-1">Créé le</p>
                        <p className="text-xs text-default-400">
                          {formatDateTime(selectedReservation.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-default-500 mb-1">Modifié le</p>
                        <p className="text-xs text-default-400">
                          {formatDateTime(selectedReservation.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Fermer
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal pour afficher les événements supplémentaires */}
      <Modal isOpen={isShowMoreOpen} onClose={onShowMoreClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">
                  Réservations du {showMoreDate ? formatDate(showMoreDate.toISOString()) : ''}
                </h2>
                <p className="text-sm text-default-500">
                  {showMoreEvents.length} réservation{showMoreEvents.length > 1 ? 's' : ''}
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-3">
                  {showMoreEvents.map((event) => (
                    <Card key={event.reservation._id} className="shadow-sm">
                      <CardBody className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Chip
                              size="sm"
                              color={event.reservation.type === 'manual_block_date' ? 'warning' : 'primary'}
                              variant="flat"
                            >
                              {event.reservation.type === 'manual_block_date'
                                ? 'Blocage manuel'
                                : 'Réservation'}
                            </Chip>
                            {event.reservation.type !== 'manual_block_date' && (
                              <p className="text-sm font-semibold">
                                {new Intl.NumberFormat('fr-FR', {
                                  style: 'currency',
                                  currency: 'EUR',
                                }).format(event.reservation.price)}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-default-500">ID Externe</p>
                            <p className="font-mono text-sm font-semibold break-all">
                              {event.reservation.externalId}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-default-500">Date de début</p>
                              <p className="text-sm font-medium">
                                {formatDate(event.reservation.startDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-default-500">Date de fin</p>
                              <p className="text-sm font-medium">
                                {formatDate(event.reservation.endDate)}
                              </p>
                            </div>
                          </div>
                          {event.reservation.type !== 'manual_block_date' && (
                            <div>
                              <p className="text-xs text-default-500">Voyageurs</p>
                              <p className="text-sm font-medium">
                                {event.reservation.numberOfTravelers} voyageur
                                {event.reservation.numberOfTravelers > 1 ? 's' : ''}
                              </p>
                            </div>
                          )}
                          <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => {
                              setSelectedReservation(event.reservation);
                              onClose();
                              onDetailOpen();
                            }}
                            className="w-full"
                          >
                            Voir les détails
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
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

