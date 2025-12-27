'use client';

import { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { jobsApi } from '@/lib/jobs-api';

/**
 * Section de gestion des jobs dans la page Paramètres
 * Permet de déclencher manuellement chaque job (synchronisation calendriers, emails, traitement événements)
 */
export function JobsSection() {
  const [loading, setLoading] = useState<{
    calendarSync: boolean;
    emailSync: boolean;
    eventProcessor: boolean;
    statistiques: boolean;
  }>({
    calendarSync: false,
    emailSync: false,
    eventProcessor: false,
    statistiques: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleJob = async (
    jobName: 'calendarSync' | 'emailSync' | 'eventProcessor' | 'statistiques',
    jobFunction: () => Promise<{ message: string }>,
    jobLabel: string,
  ) => {
    setLoading((prev) => ({ ...prev, [jobName]: true }));
    setError(null);
    setSuccess(null);

    try {
      const result = await jobFunction();
      setSuccess(`${jobLabel}: ${result.message}`);
    } catch (err: any) {
      setError(
        `Erreur lors du déclenchement de ${jobLabel}: ${
          err.message || 'Erreur inconnue'
        }`,
      );
    } finally {
      setLoading((prev) => ({ ...prev, [jobName]: false }));
      // Effacer les messages après 5 secondes
      setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-lg sm:text-xl font-semibold">Jobs de synchronisation</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Message de succès */}
          {success && (
            <div className="p-3 bg-success-50 text-success-700 rounded-lg border border-success-200">
              {success}
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="p-3 bg-danger-50 text-danger-700 rounded-lg border border-danger-200">
              {error}
            </div>
          )}

          {/* Job: Synchronisation des calendriers */}
          <div className="p-4 border border-default-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Synchronisation des calendriers</h3>
                <p className="text-xs text-default-500">
                  Synchronise tous les calendriers actifs et met à jour les réservations
                </p>
              </div>
              <Button
                color="primary"
                variant="flat"
                onPress={() =>
                  handleJob(
                    'calendarSync',
                    jobsApi.triggerCalendarSync,
                    'Synchronisation des calendriers',
                  )
                }
                isDisabled={loading.calendarSync}
                isLoading={loading.calendarSync}
                size="sm"
                startContent={
                  !loading.calendarSync && (
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
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                      />
                    </svg>
                  )
                }
              >
                {loading.calendarSync ? 'En cours...' : 'Lancer'}
              </Button>
            </div>
          </div>

          {/* Job: Synchronisation des emails */}
          <div className="p-4 border border-default-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Synchronisation des emails Airbnb</h3>
                <p className="text-xs text-default-500">
                  Récupère les nouveaux emails Airbnb et crée les événements correspondants
                </p>
              </div>
              <Button
                color="primary"
                variant="flat"
                onPress={() =>
                  handleJob(
                    'emailSync',
                    jobsApi.triggerEmailSync,
                    'Synchronisation des emails',
                  )
                }
                isDisabled={loading.emailSync}
                isLoading={loading.emailSync}
                size="sm"
                startContent={
                  !loading.emailSync && (
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
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                      />
                    </svg>
                  )
                }
              >
                {loading.emailSync ? 'En cours...' : 'Lancer'}
              </Button>
            </div>
          </div>

          {/* Job: Traitement des événements */}
          <div className="p-4 border border-default-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Traitement des événements</h3>
                <p className="text-xs text-default-500">
                  Traite les événements non traités et met à jour le statut et le prix des réservations
                </p>
              </div>
              <Button
                color="primary"
                variant="flat"
                onPress={() =>
                  handleJob(
                    'eventProcessor',
                    jobsApi.triggerEventProcessor,
                    'Traitement des événements',
                  )
                }
                isDisabled={loading.eventProcessor}
                isLoading={loading.eventProcessor}
                size="sm"
                startContent={
                  !loading.eventProcessor && (
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
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                      />
                    </svg>
                  )
                }
              >
                {loading.eventProcessor ? 'En cours...' : 'Lancer'}
              </Button>
            </div>
          </div>

          {/* Job: Calcul des statistiques */}
          <div className="p-4 border border-default-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Calcul des statistiques</h3>
                <p className="text-xs text-default-500">
                  Calcule et sauvegarde toutes les statistiques (revenus, taux de remplissage, etc.)
                </p>
              </div>
              <Button
                color="primary"
                variant="flat"
                onPress={() =>
                  handleJob(
                    'statistiques',
                    jobsApi.triggerStatistiques,
                    'Calcul des statistiques',
                  )
                }
                isDisabled={loading.statistiques}
                isLoading={loading.statistiques}
                size="sm"
                startContent={
                  !loading.statistiques && (
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
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                      />
                    </svg>
                  )
                }
              >
                {loading.statistiques ? 'En cours...' : 'Lancer'}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

