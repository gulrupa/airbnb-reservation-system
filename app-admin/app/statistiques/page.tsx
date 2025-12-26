'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Spinner } from '@heroui/spinner';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Select, SelectItem } from '@heroui/select';
import { statistiquesApi, type Statistiques, type StatistiquesMensuelles } from '@/lib/statistiques-api';
import type { Reservation } from '@/types/calendar';

/**
 * Page de statistiques
 * Affiche les revenus et taux de remplissage
 */
export default function StatistiquesPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const [statistiques, setStatistiques] = useState<Statistiques | null>(null);
  const [statistiquesMensuelles, setStatistiquesMensuelles] = useState<StatistiquesMensuelles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalReservations, setModalReservations] = useState<Reservation[]>([]);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [loadingReservations, setLoadingReservations] = useState(false);
  const currentYear = new Date().getFullYear();
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
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
      loadAvailableYears();
    }
  }, [authenticated]);

  // Recharger les données quand l'année ou le mois change
  useEffect(() => {
    if (authenticated) {
      loadData();
      loadMonthlyData();
    }
  }, [selectedYear, selectedMonth, authenticated]);

  const loadAvailableYears = async () => {
    try {
      const years = await statistiquesApi.getAvailableYears();
      const currentYear = new Date().getFullYear();
      // S'assurer que l'année en cours est toujours dans la liste
      const allYears = years.length > 0 ? years : [currentYear];
      if (!allYears.includes(currentYear)) {
        allYears.push(currentYear);
        allYears.sort();
      }
      setAvailableYears(allYears);
    } catch (err) {
      console.error('Erreur lors du chargement des années:', err);
      // En cas d'erreur, utiliser au moins l'année en cours
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await statistiquesApi.getStatistics(selectedYear);
      setStatistiques(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    if (selectedMonth === null) return;
    try {
      const monthlyStats = await statistiquesApi.getMonthlyStatistics(selectedYear, selectedMonth);
      setStatistiquesMensuelles(monthlyStats);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques mensuelles:', err);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    let newMonth = selectedMonth;
    let newYear = selectedYear;

    if (direction === 'prev') {
      if (newMonth === 0) {
        // Passer à décembre de l'année précédente
        newMonth = 11;
        newYear -= 1;
        // Vérifier si l'année est disponible
        if (!availableYears.includes(newYear)) {
          return; // Ne pas naviguer si l'année n'est pas disponible
        }
      } else {
        newMonth -= 1;
      }
    } else {
      // next
      if (newMonth === 11) {
        // Passer à janvier de l'année suivante
        newMonth = 0;
        newYear += 1;
        // Vérifier si l'année est disponible
        if (!availableYears.includes(newYear)) {
          return; // Ne pas naviguer si l'année n'est pas disponible
        }
      } else {
        newMonth += 1;
      }
    }

    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    
    // Scroller vers la section des statistiques du mois après un court délai pour laisser le temps au DOM de se mettre à jour
    setTimeout(() => {
      const element = document.getElementById('statistiques-mois');
      if (element) {
        const yOffset = -80; // Offset pour éviter que la navbar cache le contenu
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const currentIndex = availableYears.indexOf(selectedYear);
    
    if (direction === 'prev') {
      if (currentIndex > 0) {
        const newYear = availableYears[currentIndex - 1];
        setSelectedYear(newYear);
        // Si on change d'année et que ce n'est pas l'année en cours, sélectionner janvier
        if (newYear !== new Date().getFullYear()) {
          setSelectedMonth(0);
        } else {
          setSelectedMonth(new Date().getMonth());
        }
      }
    } else {
      // next
      if (currentIndex < availableYears.length - 1) {
        const newYear = availableYears[currentIndex + 1];
        setSelectedYear(newYear);
        // Si on change d'année et que ce n'est pas l'année en cours, sélectionner janvier
        if (newYear !== new Date().getFullYear()) {
          setSelectedMonth(0);
        } else {
          setSelectedMonth(new Date().getMonth());
        }
      }
    }
    
    // Scroller vers la section des statistiques de l'année après un court délai
    setTimeout(() => {
      const element = document.getElementById('statistiques-annee');
      if (element) {
        const yOffset = -15; // Offset pour éviter que la navbar cache le contenu
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleOpenMonthReservations = async () => {
    try {
      setLoadingReservations(true);
      const monthReservations = await statistiquesApi.getMonthReservations(selectedYear, selectedMonth);
      setModalReservations(monthReservations);
      setModalTitle(`Réservations de ${monthNames[selectedMonth]} ${selectedYear} (${monthReservations.length})`);
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

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const getDisplayData = () => {
    // Utiliser les stats mensuelles si disponibles
    if (statistiquesMensuelles) {
      return {
        revenue: statistiquesMensuelles.revenue,
        reservations: statistiquesMensuelles.reservations,
        occupancyRate: statistiquesMensuelles.occupancyRate,
        averagePricePerNight: statistiquesMensuelles.averagePricePerNight,
        averageReservationDuration: statistiquesMensuelles.averageReservationDuration,
      };
    }
    // Utiliser les stats du mois en cours si on est sur l'année en cours et le mois en cours
    if (selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth()) {
      return {
        revenue: statistiques.currentMonthRevenue,
        reservations: statistiques.currentMonthReservations,
        occupancyRate: statistiques.currentMonthOccupancyRate,
        averagePricePerNight: statistiques.currentMonthAveragePricePerNight,
        averageReservationDuration: statistiques.currentMonthAverageReservationDuration,
      };
    }
    return null;
  };

  const displayData = getDisplayData();

  return (
    <div className="container mx-auto p-3 sm:p-6 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Statistiques</h1>
          
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select
              label="Année"
              selectedKeys={[selectedYear.toString()]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) {
                  const newYear = parseInt(selected, 10);
                  setSelectedYear(newYear);
                  // Si on change d'année et que ce n'est pas l'année en cours, sélectionner janvier
                  if (newYear !== new Date().getFullYear()) {
                    setSelectedMonth(0);
                  } else {
                    setSelectedMonth(new Date().getMonth());
                  }
                  // Scroller vers la section des statistiques de l'année après un court délai
                  setTimeout(() => {
                    const element = document.getElementById('statistiques-annee');
                    if (element) {
                      const yOffset = -80; // Offset pour éviter que la navbar cache le contenu
                      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                  }, 100);
                }
              }}
              className="w-full sm:w-40"
              items={availableYears.map((year) => ({ key: year.toString(), label: year.toString() }))}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>

            <Select
              label="Mois"
              selectedKeys={[selectedMonth.toString()]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) {
                  setSelectedMonth(parseInt(selected, 10));
                }
              }}
              className="w-full sm:w-48"
              items={monthNames.map((month, index) => ({ key: index.toString(), label: month }))}
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>
          </div>
        </div>

        {error && (
          <Card className="mb-4 border-danger">
            <CardBody>
              <p className="text-danger text-sm">{error}</p>
            </CardBody>
          </Card>
        )}

        {/* Section Revenus à venir - En haut */}
        <div className="mb-6">
          <div className="mb-3">
            <h2 className="text-xl sm:text-2xl font-bold text-success">Revenus à venir</h2>
            <p className="text-sm text-default-500 mt-1">Réservations futures (toutes dates confondues)</p>
          </div>
          <div className="flex justify-center">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow w-full max-w-md border-success/30"
              isPressable
              onPress={handleOpenFutureReservations}
            >
              <CardBody className="p-6 text-center">
                <p className="text-4xl sm:text-5xl font-bold text-success mb-2">
                  {formatCurrency(statistiques.futureRevenue)}
                </p>
                <p className="text-sm text-default-500 mb-3">Réservations futures</p>
                <p className="text-xs text-success font-medium">Cliquez pour voir les détails</p>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Section Statistiques du mois */}
        <Card id="statistiques-mois" className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 flex flex-col">
                <h2 className="text-xl sm:text-2xl font-bold">
                  Statistiques de {monthNames[selectedMonth]} {selectedYear}
                </h2>
                <p className="text-sm text-default-500 mt-1">
                  {monthNames[selectedMonth]} {selectedYear}
                </p>
              </div>
              
              {/* Flèches de navigation */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  onPress={() => navigateMonth('prev')}
                  isDisabled={selectedMonth === 0 && !availableYears.includes(selectedYear - 1)}
                  aria-label="Mois précédent"
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
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </Button>
                
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  onPress={() => navigateMonth('next')}
                  isDisabled={selectedMonth === 11 && !availableYears.includes(selectedYear + 1)}
                  aria-label="Mois suivant"
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
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            {displayData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  isPressable
                  onPress={handleOpenMonthReservations}
                >
                  <CardHeader className="pb-2">
                    <h3 className="text-base font-semibold">Revenus du mois</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">
                      {formatCurrency(displayData.revenue)}
                    </p>
                    <p className="text-sm text-default-500 mt-1">
                      {displayData.reservations} réservation{displayData.reservations > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-primary mt-2">Cliquez pour voir les détails</p>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="text-base font-semibold">Taux de remplissage</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl sm:text-3xl font-bold text-warning">
                      {displayData.occupancyRate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-default-500 mt-1">
                      {monthNames[selectedMonth]}
                    </p>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="text-base font-semibold">Prix moyen par nuit</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">
                      {formatCurrency(displayData.averagePricePerNight)}
                    </p>
                    <p className="text-sm text-default-500 mt-1">
                      {monthNames[selectedMonth]}
                    </p>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="text-base font-semibold">Durée moyenne</h3>
                  </CardHeader>
                  <CardBody>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">
                      {displayData.averageReservationDuration.toFixed(1)} nuit
                      {displayData.averageReservationDuration > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-default-500 mt-1">
                      {monthNames[selectedMonth]}
                    </p>
                  </CardBody>
                </Card>
              </div>
            ) : (
              <p className="text-center text-default-500 py-8">
                Aucune statistique disponible pour ce mois
              </p>
            )}
          </CardBody>
        </Card>

        {/* Section Statistiques de l'année */}
        <Card id="statistiques-annee" className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex-1 flex flex-col">
                <h2 className="text-xl sm:text-2xl font-bold">Statistiques de l'année {selectedYear}</h2>
                <p className="text-sm text-default-500 mt-1">Données calculées uniquement sur l'année sélectionnée</p>
              </div>
              
              {/* Flèches de navigation pour les années */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  onPress={() => navigateYear('prev')}
                  isDisabled={availableYears.indexOf(selectedYear) === 0}
                  aria-label="Année précédente"
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
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </Button>
                
                <Button
                  isIconOnly
                  variant="flat"
                  size="sm"
                  onPress={() => navigateYear('next')}
                  isDisabled={availableYears.indexOf(selectedYear) === availableYears.length - 1}
                  aria-label="Année suivante"
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
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-secondary/20">
                <CardHeader className="pb-2">
                  <h3 className="text-base font-semibold">Revenus de l'année</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-2xl sm:text-3xl font-bold text-secondary">
                    {formatCurrency(statistiques.yearRevenue)}
                  </p>
                  <p className="text-sm text-default-500 mt-1">Année {selectedYear}</p>
                </CardBody>
              </Card>

              <Card className="border-warning/20">
                <CardHeader className="pb-2">
                  <h3 className="text-base font-semibold">Taux de remplissage</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-2xl sm:text-3xl font-bold text-warning">
                    {statistiques.occupancyRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-default-500 mt-1">Année {selectedYear}</p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <h3 className="text-base font-semibold">Total nuits</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-2xl sm:text-3xl font-bold text-default-700">
                    {statistiques.totalNights}
                  </p>
                  <p className="text-sm text-default-500 mt-1">Nuits réservées</p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <h3 className="text-base font-semibold">Revenu moyen</h3>
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
                  <h3 className="text-base font-semibold">Prix moyen par nuit</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-2xl sm:text-3xl font-bold text-default-700">
                    {formatCurrency(statistiques.averageRevenuePerNight)}
                  </p>
                  <p className="text-sm text-default-500 mt-1">Année {selectedYear}</p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <h3 className="text-base font-semibold">Durée moyenne réservation</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-2xl sm:text-3xl font-bold text-default-700">
                    {statistiques.averageReservationDuration.toFixed(1)} nuit
                    {statistiques.averageReservationDuration > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-default-500 mt-1">Année {selectedYear}</p>
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>

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

