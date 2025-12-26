'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Button } from '@heroui/button';
import moment from 'moment';
import 'moment/locale/fr';
import { reservationApi } from '@/lib/reservation-api';
import type { Reservation } from '@/types/calendar';

// Configuration de moment en français
moment.locale('fr');

/**
 * Page de planning avec liste des réservations
 * Affiche les réservations à partir d'aujourd'hui avec les délais entre elles
 */
export default function PlanningPage() {
  // État d'authentification
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // États pour les données
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      const [reservationsData] = await Promise.all([
        reservationApi.getFuture()
      ]);

      setReservations(reservationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filtre les réservations
   * Ne garde que les réservations à partir d'aujourd'hui
   */
  const filteredReservations: Reservation[] = useMemo(() => {
    const today = moment().startOf('day');
    
    return reservations
      .filter((reservation) => {
        // Filtrer les blocages manuels
        if (reservation.type === 'manual_block_date') {
          return false;
        }
        // Ne garder que les réservations à partir d'aujourd'hui
        const endDate = moment(reservation.endDate);
        return endDate.isSameOrAfter(today);
      })
      .sort((a, b) => {
        // Trier par date de début
        const dateA = moment(a.startDate);
        const dateB = moment(b.startDate);
        return dateA.diff(dateB);
      });
  }, [reservations]);

  /**
   * Calcule le délai entre deux réservations
   */
  const calculateDelay = (reservation1: Reservation, reservation2: Reservation): string => {
    const end1 = moment(reservation1.endDate);
    const start2 = moment(reservation2.startDate);
    const diff = start2.diff(end1);

    if (diff < 0) {
      // Chevauchement
      return 'Chevauchement';
    }

    const duration = moment.duration(diff);
    const totalDays = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();

    if (totalDays > 0) {
      const hoursText = hours > 0 ? ` et ${hours}h` : '';
      return `${totalDays} jour${totalDays > 1 ? 's' : ''}${hoursText}`;
    } else if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else {
      return 'Aucun délai';
    }
  };

  /**
   * Formate une date avec l'heure
   */
  const formatDateTime = (dateString: string) => {
    return moment(dateString).format('DD/MM/YYYY [à] HH:mm');
  };

  /**
   * Formate une date
   */
  const formatDate = (dateString: string) => {
    return moment(dateString).format('DD/MM/YYYY');
  };

  /**
   * Formate une heure
   */
  const formatTime = (dateString: string) => {
    return moment(dateString).format('HH:mm');
  };

  /**
   * Récupère l'URL du calendrier iCal avec le protocole webcal://
   * Le protocole webcal:// permet d'ouvrir directement dans l'application de calendrier
   */
  const getWebcalUrl = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.booking.gul-si.fr';
    const httpsUrl = `${apiUrl}/reservations/future/ical`;
    return httpsUrl.replace(/^https?:\/\//, 'webcal://');
  };

  /**
   * Ouvre le lien iCal avec le protocole webcal:// pour ajout automatique
   */
  const addToCalendar = () => {
    window.location.href = getWebcalUrl();
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Planning des réservations</h1>
          <Button
            color="primary"
            variant="flat"
            onPress={addToCalendar}
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
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                />
              </svg>
            }
          >
            Ajouter au calendrier
          </Button>
        </div>

        {error && (
          <Card className="mb-4 border-danger">
            <CardBody>
              <p className="text-danger text-sm">{error}</p>
            </CardBody>
          </Card>
        )}

        {filteredReservations.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-center text-default-500 py-8">
                Aucune réservation à venir
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card className="shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Réservations à venir
                </h2>
                <Chip size="sm" variant="flat" color="primary">
                  {filteredReservations.length} réservation{filteredReservations.length > 1 ? 's' : ''}
                </Chip>
              </div>
            </CardHeader>
            <CardBody className="p-4">
              <div className="space-y-6">
                {filteredReservations.map((reservation, index) => {
                  const previousReservation = index > 0 ? filteredReservations[index - 1] : null;
                  const delay = previousReservation 
                    ? calculateDelay(previousReservation, reservation)
                    : null;

                  return (
                    <div key={reservation._id} className="space-y-3">
                      {/* Délai avec la réservation précédente - affiché en premier */}
                      {delay && (
                        <div className="flex items-center justify-center py-2 px-4 bg-default-100 dark:bg-default-50 rounded-lg border border-default-200">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-default-700">Délai entre les réservations :</span>
                            <Chip 
                              size="md" 
                              variant="flat" 
                              color={delay === 'Chevauchement' ? 'danger' : delay === 'Aucun délai' ? 'warning' : 'success'}
                              className="font-bold"
                            >
                              {delay}
                            </Chip>
                          </div>
                        </div>
                      )}

                      {/* Bloc de réservation */}
                      <div className="border-l-4 border-primary bg-default-50 dark:bg-default-100 rounded-r-lg shadow-sm">
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <Chip size="sm" variant="flat" color="primary" className="font-semibold">
                              {reservation.externalId}
                            </Chip>
                            {reservation.numberOfTravelers > 0 && (
                              <span className="text-sm text-default-600 font-medium">
                                {reservation.numberOfTravelers} voyageur{reservation.numberOfTravelers > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          
                          {/* Dates et heures */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-white dark:bg-default-200 p-4 rounded-lg border border-default-200">
                              <p className="text-default-500 text-xs mb-2 font-medium uppercase tracking-wide">Début</p>
                              <p className="font-bold text-xl mb-1">{formatDate(reservation.startDate)}</p>
                              <p className="text-default-700 font-semibold text-lg">{formatTime(reservation.startDate)}</p>
                            </div>
                            <div className="bg-white dark:bg-default-200 p-4 rounded-lg border border-default-200">
                              <p className="text-default-500 text-xs mb-2 font-medium uppercase tracking-wide">Fin</p>
                              <p className="font-bold text-xl mb-1">{formatDate(reservation.endDate)}</p>
                              <p className="text-default-700 font-semibold text-lg">{formatTime(reservation.endDate)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

