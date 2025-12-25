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
  }>({
    calendarSync: false,
    emailSync: false,
    eventProcessor: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleJob = async (
    jobName: 'calendarSync' | 'emailSync' | 'eventProcessor',
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
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Synchronisation des calendriers</h3>
                <p className="text-xs text-default-500">
                  Synchronise tous les calendriers actifs et met à jour les réservations
                </p>
              </div>
              <Button
                color="primary"
                onPress={() =>
                  handleJob(
                    'calendarSync',
                    jobsApi.triggerCalendarSync,
                    'Synchronisation des calendriers',
                  )
                }
                isDisabled={loading.calendarSync}
                isLoading={loading.calendarSync}
              >
                {loading.calendarSync ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    En cours...
                  </>
                ) : (
                  'Lancer'
                )}
              </Button>
            </div>
          </div>

          {/* Job: Synchronisation des emails */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Synchronisation des emails Airbnb</h3>
                <p className="text-xs text-default-500">
                  Récupère les nouveaux emails Airbnb et crée les événements correspondants
                </p>
              </div>
              <Button
                color="primary"
                onPress={() =>
                  handleJob(
                    'emailSync',
                    jobsApi.triggerEmailSync,
                    'Synchronisation des emails',
                  )
                }
                isDisabled={loading.emailSync}
                isLoading={loading.emailSync}
              >
                {loading.emailSync ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    En cours...
                  </>
                ) : (
                  'Lancer'
                )}
              </Button>
            </div>
          </div>

          {/* Job: Traitement des événements */}
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">Traitement des événements</h3>
                <p className="text-xs text-default-500">
                  Traite les événements non traités et met à jour le statut et le prix des réservations
                </p>
              </div>
              <Button
                color="primary"
                onPress={() =>
                  handleJob(
                    'eventProcessor',
                    jobsApi.triggerEventProcessor,
                    'Traitement des événements',
                  )
                }
                isDisabled={loading.eventProcessor}
                isLoading={loading.eventProcessor}
              >
                {loading.eventProcessor ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    En cours...
                  </>
                ) : (
                  'Lancer'
                )}
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

