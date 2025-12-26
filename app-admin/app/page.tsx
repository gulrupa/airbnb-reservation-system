'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Spinner } from '@heroui/spinner';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { title, subtitle } from '@/components/primitives';
import { calendarApi } from '@/lib/calendar-api';
import type { Reservation } from '@/types/calendar';

export default function Home() {
  const { authenticated, loading } = useAuth();
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push('/login');
    }
  }, [authenticated, loading, router]);

  useEffect(() => {
    if (authenticated) {
      loadReservations();
    }
  }, [authenticated]);

  const loadReservations = async () => {
    try {
      setLoadingReservations(true);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // Charger les réservations du mois en cours et du mois suivant
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const endOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);
      
      const [currentMonthReservations, nextMonthReservations] = await Promise.all([
        calendarApi.getReservationsByDateRange(startOfMonth.toISOString(), endOfMonth.toISOString()),
        calendarApi.getReservationsByDateRange(nextMonth.toISOString(), endOfNextMonth.toISOString()),
      ]);

      // Filtrer uniquement les réservations valides (pas les blocages manuels)
      const allReservations = [...currentMonthReservations, ...nextMonthReservations].filter(
        (r) => r.type !== 'manual_block_date'
      );

      // Éliminer les doublons
      const uniqueReservations = Array.from(
        new Map(allReservations.map((r) => [r._id, r])).values()
      );

      setReservations(uniqueReservations);
    } catch (err) {
      console.error('Erreur lors du chargement des réservations:', err);
    } finally {
      setLoadingReservations(false);
    }
  };

  // Trouver la réservation en cours et la prochaine
  const { currentReservation, nextReservation } = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Réservation en cours : a commencé et n'est pas encore terminée
    const current = reservations.find((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return start <= now && end >= now;
    });

    // Prochaine réservation : la première qui commence après aujourd'hui
    const next = reservations
      .filter((r) => {
        const start = new Date(r.startDate);
        start.setHours(0, 0, 0, 0);
        return start > now;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

    return { currentReservation: current, nextReservation: next };
  }, [reservations]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateNights = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysUntil = (dateString: string) => {
    const target = new Date(dateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading || loadingReservations) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="text-center">
          <Spinner size="lg" />
        </div>
      </section>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <section className="flex flex-col gap-8 py-8 md:py-12">
      <div className="inline-block max-w-xl text-center justify-center mx-auto">
        <h1 className={title()}>Bienvenue sur&nbsp;</h1>
        <h1 className={title({ color: "violet" })}>Airbnb Reservation System</h1>
        <div className={subtitle({ class: "mt-4" })}>
          Gestion des réservations et calendriers Airbnb
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Réservation en cours */}
        <Card 
          className={`relative overflow-hidden transition-all duration-300 ${
            currentReservation 
              ? 'border-2 border-primary shadow-lg shadow-primary/20 bg-gradient-to-br from-primary/5 to-background' 
              : 'border border-default-200'
          }`}
        >
          {currentReservation && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          )}
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className={`p-2 rounded-lg ${currentReservation ? 'bg-primary/20' : 'bg-default-100'}`}>
              <svg 
                className={`w-6 h-6 ${currentReservation ? 'text-primary' : 'text-default-400'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold">Réservation en cours</h2>
              <p className="text-xs text-default-500">Actuellement active</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="pt-6">
            {currentReservation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Chip 
                    size="md" 
                    color="primary" 
                    variant="flat"
                    className="font-semibold"
                  >
                    {currentReservation.externalId}
                  </Chip>
                  <div className="flex items-center gap-1 text-sm text-default-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">{currentReservation.numberOfTravelers} voyageur{currentReservation.numberOfTravelers > 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-default-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Arrivée</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDate(currentReservation.startDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-default-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Départ</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDate(currentReservation.endDate)}
                    </p>
                  </div>
                </div>

                <Divider className="my-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Durée du séjour</p>
                      <p className="text-base font-bold text-foreground">
                        {calculateNights(currentReservation.startDate, currentReservation.endDate)} nuit
                        {calculateNights(currentReservation.startDate, currentReservation.endDate) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-default-100 mb-4">
                  <svg className="w-8 h-8 text-default-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-default-500 font-medium">Aucune réservation en cours</p>
                <p className="text-xs text-default-400 mt-1">Votre logement est disponible</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Prochaine réservation */}
        <Card 
          className={`relative overflow-hidden transition-all duration-300 ${
            nextReservation 
              ? 'border-2 border-success shadow-lg shadow-success/20 bg-gradient-to-br from-success/5 to-background' 
              : 'border border-default-200'
          }`}
        >
          {nextReservation && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          )}
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className={`p-2 rounded-lg ${nextReservation ? 'bg-success/20' : 'bg-default-100'}`}>
              <svg 
                className={`w-6 h-6 ${nextReservation ? 'text-success' : 'text-default-400'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-bold">Prochaine réservation</h2>
              <p className="text-xs text-default-500">
                {nextReservation ? `Dans ${getDaysUntil(nextReservation.startDate)} jour${getDaysUntil(nextReservation.startDate) > 1 ? 's' : ''}` : 'Aucune prévue'}
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="pt-6">
            {nextReservation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Chip 
                    size="md" 
                    color="success" 
                    variant="flat"
                    className="font-semibold"
                  >
                    {nextReservation.externalId}
                  </Chip>
                  <div className="flex items-center gap-1 text-sm text-default-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-medium">{nextReservation.numberOfTravelers} voyageur{nextReservation.numberOfTravelers > 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-default-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Arrivée</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDate(nextReservation.startDate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-default-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Départ</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {formatDate(nextReservation.endDate)}
                    </p>
                  </div>
                </div>

                <Divider className="my-2" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-success/10">
                      <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Durée du séjour</p>
                      <p className="text-base font-bold text-foreground">
                        {calculateNights(nextReservation.startDate, nextReservation.endDate)} nuit
                        {calculateNights(nextReservation.startDate, nextReservation.endDate) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-default-100 mb-4">
                  <svg className="w-8 h-8 text-default-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-default-500 font-medium">Aucune réservation à venir</p>
                <p className="text-xs text-default-400 mt-1">Votre calendrier est libre</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
