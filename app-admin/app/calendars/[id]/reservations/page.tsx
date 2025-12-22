'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { calendarApi } from '@/lib/calendar-api';
import type { Reservation, CalendarUrl } from '@/types/calendar';

/**
 * Page affichant les réservations d'un calendrier spécifique
 * Accessible via /calendars/[id]/reservations
 * Affiche les informations du calendrier et la liste de ses réservations
 */
export default function CalendarReservationsPage() {
  // État d'authentification
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Récupération de l'ID du calendrier depuis l'URL
  const params = useParams();
  const calendarId = params.id as string;

  // États pour les données
  const [calendar, setCalendar] = useState<CalendarUrl | null>(null); // Données du calendrier
  const [reservations, setReservations] = useState<Reservation[]>([]); // Liste des réservations
  const [loading, setLoading] = useState(true); // État de chargement
  const [error, setError] = useState<string | null>(null); // Message d'erreur

  // Redirection vers la page de login si non authentifié
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/login');
    }
  }, [authenticated, authLoading, router]);

  // Chargement des données une fois authentifié et avec un ID de calendrier
  useEffect(() => {
    if (authenticated && calendarId) {
      loadData();
    }
  }, [authenticated, calendarId]);

  /**
   * Charge les données du calendrier et ses réservations en parallèle
   * Utilise Promise.all pour optimiser les performances
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Chargement en parallèle du calendrier et de ses réservations
      const [calendarData, reservationsData] = await Promise.all([
        calendarApi.getById(calendarId),
        calendarApi.getReservations(calendarId),
      ]);

      setCalendar(calendarData);
      setReservations(reservationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
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
        <Button 
          variant="flat" 
          onPress={() => router.push('/calendars')} 
          className="mb-3 sm:mb-4"
          size="sm"
        >
          ← Retour aux calendriers
        </Button>
        {calendar && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <h1 className="text-lg sm:text-2xl font-bold">
                Réservations - {calendar.name || 'Sans nom'}
              </h1>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-2 text-sm sm:text-base">
                <p className="break-words">
                  <span className="font-semibold">URL :</span>{' '}
                  <span className="text-default-600 text-xs sm:text-sm">{calendar.url}</span>
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">Plateforme :</span>
                  <Chip size="sm" variant="flat">
                    {calendar.platform}
                  </Chip>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">Statut :</span>
                  <Chip
                    size="sm"
                    color={calendar.isActive ? 'success' : 'default'}
                    variant="flat"
                  >
                    {calendar.isActive ? 'Actif' : 'Inactif'}
                  </Chip>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
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
          <h2 className="text-lg sm:text-xl font-semibold">
            Réservations ({reservations.length})
          </h2>
        </CardHeader>
        <CardBody className="p-0 sm:p-6">
          {/* Version desktop : Tableau */}
          <div className="hidden md:block overflow-x-auto">
            <Table aria-label="Table des réservations">
              <TableHeader>
                <TableColumn>ID Externe</TableColumn>
                <TableColumn>Date de début</TableColumn>
                <TableColumn>Date de fin</TableColumn>
                <TableColumn>Prix</TableColumn>
                <TableColumn>Voyageurs</TableColumn>
                <TableColumn>Type</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Aucune réservation">
                {reservations.map((reservation) => (
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

          {/* Version mobile : Cards */}
          <div className="md:hidden space-y-3 p-4">
            {reservations.length === 0 ? (
              <p className="text-center text-default-500 py-8">Aucune réservation</p>
            ) : (
              reservations.map((reservation) => (
                <Card key={reservation._id} className="shadow-sm">
                  <CardBody className="p-4">
                    <div className="space-y-3">
                      {/* ID Externe */}
                      <div>
                        <p className="text-xs text-default-500 mb-1">ID Externe</p>
                        <p className="font-mono text-sm font-semibold break-all">
                          {reservation.externalId}
                        </p>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-default-500 mb-1">Date de début</p>
                          <p className="text-sm font-medium">
                            {formatDate(reservation.startDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500 mb-1">Date de fin</p>
                          <p className="text-sm font-medium">
                            {formatDate(reservation.endDate)}
                          </p>
                        </div>
                      </div>

                      {/* Prix et Voyageurs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-default-500 mb-1">Prix</p>
                          <p className="text-sm font-semibold">
                            {new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                            }).format(reservation.price)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500 mb-1">Voyageurs</p>
                          <p className="text-sm font-medium">{reservation.numberOfTravelers}</p>
                        </div>
                      </div>

                      {/* Type */}
                      <div>
                        <p className="text-xs text-default-500 mb-1">Type</p>
                        <Chip
                          size="sm"
                          color={reservation.type === 'manual_block_date' ? 'warning' : 'primary'}
                          variant="flat"
                        >
                          {reservation.type === 'manual_block_date'
                            ? 'Blocage manuel'
                            : 'Réservation'}
                        </Chip>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

