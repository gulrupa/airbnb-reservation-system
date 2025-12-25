'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, Tab } from '@heroui/tabs';
import { Spinner } from '@heroui/spinner';
import { CalendarsSection } from '@/components/parametres/CalendarsSection';
import { AnnoncesSection } from '@/components/parametres/AnnoncesSection';
import { JobsSection } from '@/components/parametres/JobsSection';

/**
 * Page de paramètres de l'application
 * 
 * Cette page regroupe tous les paramètres de configuration de l'application :
 * - Calendriers : gestion des calendriers externes (Airbnb, Booking, etc.)
 * - Annonces : gestion des annonces et leurs associations avec les calendriers
 * - Jobs : déclenchement manuel des jobs de synchronisation (calendriers, emails, événements)
 * 
 * Les paramètres sont organisés en onglets pour une navigation facile.
 */
export default function ParametresPage() {
  const { authenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirection vers la page de login si non authentifié
  useEffect(() => {
    if (!authLoading && !authenticated) {
      router.push('/login');
    }
  }, [authenticated, authLoading, router]);

  // Affichage d'un spinner pendant le chargement de l'authentification
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  // Ne rien afficher si non authentifié (redirection gérée par useEffect)
  if (!authenticated) {
    return null;
  }

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Paramètres</h1>

        {/* Onglets pour organiser les différents paramètres */}
        <Tabs 
          aria-label="Options de paramètres" 
          className="w-full"
          classNames={{
            tabList: "gap-2 sm:gap-4 w-full relative rounded-lg p-0 bg-default-100/50",
            cursor: "w-full bg-background shadow-lg",
            tab: "max-w-fit px-3 sm:px-6 h-10 sm:h-12",
            tabContent: "group-data-[selected=true]:text-primary text-sm sm:text-base font-medium"
          }}
        >
          <Tab 
            key="calendars" 
            title={
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">📅</span>
                <span>Calendriers</span>
              </div>
            }
          >
            <div className="mt-4 sm:mt-6">
              <CalendarsSection />
            </div>
          </Tab>
          
          <Tab 
            key="annonces" 
            title={
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">🏠</span>
                <span>Annonces</span>
              </div>
            }
          >
            <div className="mt-4 sm:mt-6">
              <AnnoncesSection />
            </div>
          </Tab>

          <Tab 
            key="jobs" 
            title={
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">⚙️</span>
                <span>Jobs</span>
              </div>
            }
          >
            <div className="mt-4 sm:mt-6">
              <JobsSection />
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}

