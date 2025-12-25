'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { annonceApi } from '@/lib/annonce-api';
import type { Reservation } from '@/types/calendar';
import type { Annonce } from '@/types/annonce';

/**
 * Page affichant les indisponibilités d'une annonce spécifique
 * Accessible via /annonces/[id]/indisponibilites
 * Affiche les informations de l'annonce et la liste de ses indisponibilités
 */
export default function AnnonceIndisponibilitesPage() {
  // État d'authentification
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Récupération de l'ID de l'annonce depuis l'URL
  const params = useParams();
  const annonceId = params.id as string;

  // États pour les données
  const [annonce, setAnnonce] = useState<Annonce | null>(null); // Données de l'annonce
  const [unavailabilities, setUnavailabilities] = useState<Reservation[]>([]); // Liste des indisponibilités
  const [loading, setLoading] = useState(true); // État de chargement
  const [error, setError] = useState<string | null>(null); // Message d'erreur
  const [isMobile, setIsMobile] = useState(false); // État pour détecter mobile

  // Détection de la taille de l'écran
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Redirection vers la page de login si non authentifié
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/login');
    }
  }, [authenticated, authLoading, router]);

  // Chargement des données une fois authentifié et avec un ID d'annonce
  useEffect(() => {
    if (authenticated && annonceId) {
      loadData();
    }
  }, [authenticated, annonceId]);

  /**
   * Charge les données de l'annonce et ses indisponibilités en parallèle
   * Utilise Promise.all pour optimiser les performances
   */
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Chargement en parallèle de l'annonce et de ses indisponibilités
      const [annonceData, unavailabilitiesData] = await Promise.all([
        annonceApi.getById(annonceId),
        annonceApi.getUnavailabilities(annonceId),
      ]);

      setAnnonce(annonceData);
      setUnavailabilities(unavailabilitiesData);
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
          onPress={() => router.push('/parametres')} 
          className="mb-3 sm:mb-4"
          size="sm"
        >
          ← Retour aux paramètres
        </Button>
        {annonce && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <h1 className="text-lg sm:text-2xl font-bold">
                Indisponibilités - {annonce.title}
              </h1>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="space-y-2 text-sm sm:text-base">
                {annonce.description && (
                  <p>
                    <span className="font-semibold">Description :</span>{' '}
                    <span className="text-default-600">{annonce.description}</span>
                  </p>
                )}
                {annonce.address && (
                  <p>
                    <span className="font-semibold">Adresse :</span>{' '}
                    <span className="text-default-600">{annonce.address}</span>
                  </p>
                )}
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
            Indisponibilités ({unavailabilities.length})
          </h2>
        </CardHeader>
        <CardBody className="p-0 sm:p-6">
          {/* Version desktop : Tableau */}
          {!isMobile && (
            <div className="overflow-x-auto">
              <Table aria-label="Table des indisponibilités">
                <TableHeader>
                  <TableColumn>ID Externe</TableColumn>
                  <TableColumn>Date de début</TableColumn>
                  <TableColumn>Date de fin</TableColumn>
                  <TableColumn>Prix</TableColumn>
                  <TableColumn>Voyageurs</TableColumn>
                  <TableColumn>Type</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Aucune indisponibilité">
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

          {/* Version mobile : Cards */}
          {isMobile && (
            <div className="space-y-3 p-3 sm:p-4">
              {unavailabilities.length === 0 ? (
                <p className="text-center text-default-500 py-8">Aucune indisponibilité</p>
              ) : (
                unavailabilities.map((reservation) => (
                  <Card key={reservation._id} className="shadow-sm border border-default-200">
                    <CardBody className="p-4 sm:p-5">
                      <div className="space-y-3 sm:space-y-4">
                        {/* ID Externe */}
                        <div>
                          <p className="text-xs text-default-500 mb-1">ID Externe</p>
                          <p className="font-mono text-sm text-default-900 break-all">
                            {reservation.externalId}
                          </p>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-default-500 mb-1">Date de début</p>
                            <p className="text-sm text-default-900">
                              {formatDate(reservation.startDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-default-500 mb-1">Date de fin</p>
                            <p className="text-sm text-default-900">
                              {formatDate(reservation.endDate)}
                            </p>
                          </div>
                        </div>

                        {/* Prix et Voyageurs */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-default-500 mb-1">Prix</p>
                            <p className="text-sm font-semibold text-default-900">
                              {new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              }).format(reservation.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-default-500 mb-1">Voyageurs</p>
                            <p className="text-sm text-default-900">
                              {reservation.numberOfTravelers}
                            </p>
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
          )}
        </CardBody>
      </Card>
    </div>
  );
}

