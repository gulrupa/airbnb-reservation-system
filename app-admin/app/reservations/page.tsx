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
import { Input } from '@heroui/input';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/fr';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { calendarApi } from '@/lib/calendar-api';
import { annonceApi } from '@/lib/annonce-api';
import { reservationApi } from '@/lib/reservation-api';
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
  const { authenticated, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  // États pour les données
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [calendars, setCalendars] = useState<CalendarUrl[]>([]);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const [loadingReservations, setLoadingReservations] = useState(false);

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

  // Modal pour modifier une réservation
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const [editFormData, setEditFormData] = useState<{
    price?: number;
    startDate?: string;
    endDate?: string;
    numberOfTravelers?: number;
  }>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Redirection si l'utilisateur n'a pas le rôle admin
  useEffect(() => {
    if (!authLoading && authenticated && !isAdmin()) {
      router.push('/');
    }
  }, [authenticated, authLoading, isAdmin, router]);

  // Chargement des données une fois authentifié
  useEffect(() => {
    if (authenticated) {
      loadInitialData();
    }
  }, [authenticated]);

  // Charger les réservations du mois en cours au démarrage
  useEffect(() => {
    if (authenticated && calendars.length > 0) {
      loadReservationsForMonth(new Date());
    }
  }, [authenticated, calendars]);

  /**
   * Charge les données initiales (calendriers et annonces)
   */
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [calendarsData, annoncesData] = await Promise.all([
        calendarApi.getAll(),
        annonceApi.getAll(),
      ]);

      setCalendars(calendarsData);
      setAnnonces(annoncesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les réservations pour un mois spécifique
   */
  const loadReservationsForMonth = async (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthKey = `${year}-${month}`;

    // Si le mois est déjà chargé, ne pas recharger
    if (loadedMonths.has(monthKey)) {
      return;
    }

    try {
      setLoadingReservations(true);
      
      // Calculer le début et la fin du mois
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

      // Charger les réservations du mois
      const monthReservations = await reservationApi.getByDateRange(
        startOfMonth.toISOString(),
        endOfMonth.toISOString(),
      );

      // Ajouter les nouvelles réservations sans doublons
      setReservations((prev) => {
        const existingIds = new Set(prev.map((r) => r._id));
        const newReservations = monthReservations.filter((r) => !existingIds.has(r._id));
        return [...prev, ...newReservations];
      });

      // Marquer le mois comme chargé
      setLoadedMonths((prev) => {
        const newSet = new Set(prev);
        newSet.add(monthKey);
        return newSet;
      });
    } catch (err) {
      console.error('Erreur lors du chargement des réservations du mois:', err);
    } finally {
      setLoadingReservations(false);
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
   * Ouvre la modal de modification avec les données de la réservation
   */
  const handleEdit = () => {
    if (selectedReservation) {
      setEditFormData({
        price: selectedReservation.price,
        startDate: selectedReservation.startDate.split('T')[0],
        endDate: selectedReservation.endDate.split('T')[0],
        numberOfTravelers: selectedReservation.numberOfTravelers,
      });
      onDetailClose();
      onEditOpen();
    }
  };

  /**
   * Sauvegarde les modifications de la réservation
   */
  const handleSaveEdit = async () => {
    if (!selectedReservation) return;

    try {
      setIsUpdating(true);
      setError(null);

      await reservationApi.update(selectedReservation._id, editFormData);

      // Recharger les réservations du mois actuel
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      const monthKey = `${currentYear}-${currentMonth}`;
      setLoadedMonths((prev) => {
        const newSet = new Set(prev);
        newSet.delete(monthKey);
        return newSet;
      });
      await loadReservationsForMonth(currentDate);

      // Fermer la modal et rouvrir les détails avec la réservation mise à jour
      onEditClose();
      
      // Mettre à jour la réservation dans la liste locale
      setReservations((prev) =>
        prev.map((r) => (r._id === selectedReservation._id ? { ...r, ...editFormData } : r))
      );
      
      // Recharger la réservation complète depuis le serveur
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      const updatedReservations = await reservationApi.getByDateRange(
        startOfMonth.toISOString(),
        endOfMonth.toISOString(),
      );
      const updated = updatedReservations.find((r) => r._id === selectedReservation._id);
      if (updated) {
        setSelectedReservation(updated);
        onDetailOpen();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Supprime la réservation
   */
  const handleDelete = async () => {
    if (!selectedReservation) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      await reservationApi.delete(selectedReservation._id);

      // Retirer la réservation supprimée de la liste
      setReservations((prev) => prev.filter((r) => r._id !== selectedReservation._id));

      // Fermer les modals
      onDetailClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
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

  // Vérifier le rôle admin
  if (!isAdmin()) {
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
                {[
                  <SelectItem key="all">
                    Toutes les annonces
                  </SelectItem>,
                  ...annonces.map((annonce) => (
                    <SelectItem key={annonce._id}>
                      {annonce.title}
                    </SelectItem>
                  )),
                ]}
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
              Calendrier 
            </h2>
          </CardHeader>
          <CardBody className="p-0 sm:p-6">
            <style jsx global>{`
              /* ============================================
                 STYLES GÉNÉRAUX DU CALENDRIER
                 ============================================ */
              
              /* Conteneur principal du calendrier - arrondi et ombre */
              .rbc-calendar {
                overflow: hidden !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
                background-color: #ffffff !important;
              }
              
              .dark .rbc-calendar {
                background-color: #1a1a1a !important;
                color: #e4e4e7 !important;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
              }
              
              /* En-tête du calendrier - arrondi en haut */
              .rbc-header {
                padding: 12px 8px !important;
                font-weight: 600 !important;
                border-bottom: 1px solid #e5e7eb !important;
                background-color: #f9fafb !important;
                color: #374151 !important;
                border-color: #e5e7eb !important;
              }
              
              .rbc-header + .rbc-header {
                border-left: 1px solid #e5e7eb !important;
              }
              
              /* Cibler tous les éléments de l'en-tête - sélecteurs plus spécifiques */
              .rbc-month-view .rbc-header,
              .rbc-month-view table thead th,
              .rbc-month-view table thead th.rbc-header,
              .rbc-month-view thead th,
              .rbc-month-view thead th.rbc-header,
              .rbc-month-view .rbc-row-bg .rbc-header,
              .rbc-month-view .rbc-header-content {
                background-color: #f9fafb !important;
                color: #374151 !important;
                border-color: #e5e7eb !important;
              }
              
              /* Cibler aussi les cellules d'en-tête individuelles */
              .rbc-month-view table thead tr th {
                background-color: #f9fafb !important;
                color: #374151 !important;
                border-color: #e5e7eb !important;
              }
              
              .dark .rbc-header {
                border-bottom-color: #3f3f46 !important;
                border-color: #3f3f46 !important;
                color: #e4e4e7 !important;
                background-color: #27272a !important;
              }
              
              .dark .rbc-header + .rbc-header {
                border-left-color: #3f3f46 !important;
              }
              
              .dark .rbc-month-view .rbc-header,
              .dark .rbc-month-view table thead th,
              .dark .rbc-month-view table thead th.rbc-header,
              .dark .rbc-month-view thead th,
              .dark .rbc-month-view thead th.rbc-header,
              .dark .rbc-month-view .rbc-row-bg .rbc-header,
              .dark .rbc-month-view .rbc-header-content {
                background-color: #27272a !important;
                color: #e4e4e7 !important;
                border-color: #3f3f46 !important;
              }
              
              .dark .rbc-month-view table thead tr th {
                background-color: #27272a !important;
                color: #e4e4e7 !important;
                border-color: #3f3f46 !important;
              }
              
              /* Lignes et bordures du calendrier - grisées */
              .rbc-day-bg {
                border-color: #e5e7eb !important;
                background-color: #ffffff !important;
              }
              
              .rbc-month-view {
                border-color: #e5e7eb !important;
              }
              
              .rbc-month-view table {
                border-color: #e5e7eb !important;
              }
              
              .rbc-month-view table td {
                border-color: #e5e7eb !important;
              }
              
              .rbc-month-view table th {
                border-color: #e5e7eb !important;
              }
              
              .rbc-row {
                border-color: #e5e7eb !important;
              }
              
              .rbc-row-segment {
                border-color: #e5e7eb !important;
              }
              
              .dark .rbc-day-bg {
                border-color: #3f3f46 !important;
                background-color: #1a1a1a !important;
              }
              
              .dark .rbc-month-view {
                border-color: #3f3f46 !important;
              }
              
              .dark .rbc-month-view table {
                border-color: #3f3f46 !important;
              }
              
              .dark .rbc-month-view table td {
                border-color: #3f3f46 !important;
              }
              
              .dark .rbc-month-view table th {
                border-color: #3f3f46 !important;
              }
              
              .dark .rbc-row {
                border-color: #3f3f46 !important;
              }
              
              .dark .rbc-row-segment {
                border-color: #3f3f46 !important;
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
              
              /* Barre d'outils - arrondie et stylisée */
              .rbc-toolbar {
                padding: 16px !important;
                border-radius: 0 !important;
                background-color: #f9fafb !important;
                border-bottom: 1px solid #e5e7eb !important;
                flex-wrap: wrap !important;
                gap: 8px !important;
              }
              
              /* Styles pour mobile - toolbar responsive */
              @media (max-width: 640px) {
                .rbc-toolbar {
                  padding: 8px 4px !important;
                  gap: 4px !important;
                }
                
                .rbc-toolbar button {
                  font-size: 12px !important;
                  padding: 6px 8px !important;
                  min-width: auto !important;
                  flex: 1 1 auto !important;
                  max-width: calc(33.333% - 4px) !important;
                }
                
                .rbc-toolbar-label {
                  font-size: 14px !important;
                  padding: 0 4px !important;
                  flex: 1 1 100% !important;
                  text-align: center !important;
                  order: -1 !important;
                  margin-bottom: 8px !important;
                }
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
                transform: translateY(-1px) !important;
              }
              
              .dark .rbc-toolbar button.rbc-active {
                background-color: #9333ea !important;
                color: #ffffff !important;
                border-color: #9333ea !important;
                box-shadow: 0 2px 4px rgba(147, 51, 234, 0.3) !important;
              }
              
              /* Styles mobile pour dark mode */
              @media (max-width: 640px) {
                .dark .rbc-toolbar button {
                  font-size: 12px !important;
                  padding: 6px 8px !important;
                }
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
              
              .rbc-date-cell {
                padding: 8px !important;
                transition: all 0.2s ease !important;
              }
              
              .rbc-date-cell:hover {
                background-color: #f3f4f6 !important;
              }
              
              .dark .rbc-date-cell:hover {
                background-color: #27272a !important;
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
                border-radius: 8px !important;
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
            <div style={{ height: '600px', position: 'relative' }} className="rbc-calendar">
              {loadingReservations && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-black/80 z-10 rounded-lg">
                  <Spinner size="lg" />
                </div>
              )}
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                view="month"
                date={currentDate}
                onNavigate={setCurrentDate}
                onRangeChange={(range) => {
                  // Charger les réservations pour tous les mois visibles
                  if (range && Array.isArray(range)) {
                    range.forEach((date) => {
                      if (date instanceof Date) {
                        loadReservationsForMonth(date);
                      }
                    });
                  } else if (range && range.start && range.end) {
                    // Pour les vues autres que month
                    const start = new Date(range.start);
                    const end = new Date(range.end);
                    const current = new Date(start);
                    while (current <= end) {
                      loadReservationsForMonth(new Date(current));
                      current.setMonth(current.getMonth() + 1);
                    }
                  }
                }}
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
                  const isCanceled = event.reservation.status === 'canceled';
                  
                  let backgroundColor = '#3b82f6'; // Bleu par défaut
                  if (isCanceled) {
                    backgroundColor = '#ef4444'; // Rouge pour les réservations annulées
                  } else if (isManualBlock) {
                    backgroundColor = '#f59e0b'; // Orange pour les blocages manuels
                  }
                  
                  return {
                    style: {
                      backgroundColor,
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: '500',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
                      transition: 'all 0.2s ease',
                      opacity: isCanceled ? 0.7 : 1, // Légère transparence pour les annulées
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
                <div className="flex gap-2 w-full flex-col sm:flex-row">
                  {selectedReservation?.type !== 'manual_block_date' && (
                    <>
                      <Button
                        color="primary"
                        variant="flat"
                        onPress={handleEdit}
                        className="flex-1 min-h-[36px]"
                      >
                        Modifier
                      </Button>
                      <Button
                        color="danger"
                        variant="flat"
                        onPress={handleDelete}
                        isDisabled={isDeleting}
                        isLoading={isDeleting}
                        className="flex-1 min-h-[36px]"
                      >
                        {isDeleting ? 'Suppression...' : 'Supprimer'}
                      </Button>
                    </>
                  )}
                  <Button 
                    color="default" 
                    variant="light" 
                    onPress={onClose} 
                    className="flex-1 min-h-[36px]"
                  >
                    Fermer
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal de modification */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">Modifier la réservation</h2>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    type="number"
                    label="Prix"
                    placeholder="Prix en euros"
                    value={editFormData.price?.toString() || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        price: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    startContent={<span className="text-default-400">€</span>}
                  />

                  <Input
                    type="date"
                    label="Date de début"
                    value={editFormData.startDate || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, startDate: e.target.value })
                    }
                  />

                  <Input
                    type="date"
                    label="Date de fin"
                    value={editFormData.endDate || ''}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, endDate: e.target.value })
                    }
                  />

                  <Input
                    type="number"
                    label="Nombre de voyageurs"
                    min="1"
                    value={editFormData.numberOfTravelers?.toString() || ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        numberOfTravelers: e.target.value ? parseInt(e.target.value, 10) : undefined,
                      })
                    }
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <div className="flex gap-2 w-full">
                  <Button color="danger" variant="light" onPress={onClose} className="flex-1">
                    Annuler
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSaveEdit}
                    isDisabled={isUpdating}
                    isLoading={isUpdating}
                    className="flex-1"
                  >
                    {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
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

