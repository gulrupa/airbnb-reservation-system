'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Spinner } from '@heroui/spinner';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { statistiquesApi, type Statistiques } from '@/lib/statistiques-api';
import type { Reservation } from '@/types/calendar';

/**
 * Page de statistiques
 * Affiche les revenus et taux de remplissage
 */
export default function StatistiquesPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [statistiques, setStatistiques] = useState<Statistiques | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalReservations, setModalReservations] = useState<Reservation[]>([]);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [loadingReservations, setLoadingReservations] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Redirection vers la page de login si non authentifié
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/login');
    }
  }, [authenticated, authLoading, router]);

  // Chargement des données
  useEffect(() => {
    if (authenticated) {
      loadData();
    }
  }, [authenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await statistiquesApi.getStatistics();
      setStatistiques(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMonthReservations = async () => {
    try {
      setLoadingReservations(true);
      const monthReservations = await statistiquesApi.getCurrentMonthReservations();
      setModalReservations(monthReservations);
      setModalTitle(`Réservations du mois (${monthReservations.length})`);
      onOpen();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des réservations');
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleOpenFutureReservations = async () => {
    try {
      setLoadingReservations(true);
      const futureReservations = await statistiquesApi.getFutureReservations();
      setModalReservations(futureReservations);
      setModalTitle(`Réservations à venir (${futureReservations.length})`);
      onOpen();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des réservations');
    } finally {
      setLoadingReservations(false);
    }
  };

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

  // Formater un montant en euros
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
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

  if (!statistiques) {
    return (
      <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
        <Card>
          <CardBody>
            <p className="text-center text-default-500">
              Aucune statistique disponible pour le moment.
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Statistiques</h1>

        {error && (
          <Card className="mb-4 border-danger">
            <CardBody>
              <p className="text-danger text-sm">{error}</p>
            </CardBody>
          </Card>
        )}

        {/* Cartes principales - Revenus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            isPressable
            onPress={handleOpenMonthReservations}
          >
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold">Revenus du mois</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {formatCurrency(statistiques.currentMonthRevenue)}
              </p>
              <p className="text-sm text-default-500 mt-1">
                {statistiques.currentMonthReservations} réservation{statistiques.currentMonthReservations > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-primary mt-2">Cliquez pour voir les détails</p>
            </CardBody>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow"
            isPressable
            onPress={handleOpenFutureReservations}
          >
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold">Revenus à venir</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-success">
                {formatCurrency(statistiques.futureRevenue)}
              </p>
              <p className="text-sm text-default-500 mt-1">Réservations futures</p>
              <p className="text-xs text-success mt-2">Cliquez pour voir les détails</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold">Revenus de l'année</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-secondary">
                {formatCurrency(statistiques.yearRevenue)}
              </p>
              <p className="text-sm text-default-500 mt-1">Année {new Date().getFullYear()}</p>
            </CardBody>
          </Card>
        </div>

        {/* Statistiques supplémentaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-base font-semibold">Taux de remplissage</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-warning">
                {statistiques.occupancyRate.toFixed(1)}%
              </p>
              <p className="text-sm text-default-500 mt-1">Année en cours</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-base font-semibold">Taux de remplissage du mois</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-warning">
                {statistiques.currentMonthOccupancyRate.toFixed(1)}%
              </p>
              <p className="text-sm text-default-500 mt-1">Mois en cours</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-base font-semibold">Revenu moyen</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-default-700">
                {formatCurrency(statistiques.averageRevenuePerReservation)}
              </p>
              <p className="text-sm text-default-500 mt-1">Par réservation</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-base font-semibold">Prix moyen par nuit</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-default-700">
                {formatCurrency(statistiques.averageRevenuePerNight)}
              </p>
              <p className="text-sm text-default-500 mt-1">Par nuit (global)</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-base font-semibold">Prix moyen par nuit du mois</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {formatCurrency(statistiques.currentMonthAveragePricePerNight)}
              </p>
              <p className="text-sm text-default-500 mt-1">Mois en cours</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-base font-semibold">Durée moyenne réservation</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-default-700">
                {statistiques.averageReservationDuration.toFixed(1)} nuit
                {statistiques.averageReservationDuration > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-default-500 mt-1">Global</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-base font-semibold">Durée moyenne du mois</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-primary">
                {statistiques.currentMonthAverageReservationDuration.toFixed(1)} nuit
                {statistiques.currentMonthAverageReservationDuration > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-default-500 mt-1">Mois en cours</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-base font-semibold">Total nuits</h2>
            </CardHeader>
            <CardBody>
              <p className="text-2xl sm:text-3xl font-bold text-default-700">
                {statistiques.totalNights}
              </p>
              <p className="text-sm text-default-500 mt-1">Nuits réservées</p>
            </CardBody>
          </Card>
        </div>

        {/* Date de calcul */}
        <div className="mt-4 text-center">
          <p className="text-xs text-default-400">
            Dernière mise à jour :{' '}
            {new Date(statistiques.calculatedAt).toLocaleString('fr-FR', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>
        </div>
      </div>

      {/* Modal des réservations */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-xl font-bold">{modalTitle}</h2>
              </ModalHeader>
              <ModalBody>
                {loadingReservations ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : modalReservations.length === 0 ? (
                  <p className="text-center text-default-500 py-8">
                    Aucune réservation trouvée
                  </p>
                ) : (
                  <div className="space-y-3">
                    {modalReservations.map((reservation) => (
                      <Card key={reservation._id} className="shadow-sm">
                        <CardBody className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Chip size="sm" color="primary" variant="flat">
                                  {reservation.externalId}
                                </Chip>
                                <span className="text-sm text-default-500">
                                  {reservation.numberOfTravelers} voyageur{reservation.numberOfTravelers > 1 ? 's' : ''}
                                </span>
                              </div>
                              <p className="text-lg font-semibold text-primary">
                                {formatCurrency(reservation.price)}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-default-500">Date de début</p>
                                <p className="text-sm font-medium">{formatDate(reservation.startDate)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-default-500">Date de fin</p>
                                <p className="text-sm font-medium">{formatDate(reservation.endDate)}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-default-500">Durée</p>
                              <p className="text-sm font-medium">
                                {calculateNights(reservation.startDate, reservation.endDate)} nuit
                                {calculateNights(reservation.startDate, reservation.endDate) > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
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
    </div>
  );
}

