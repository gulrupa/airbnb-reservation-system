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
  const { authenticated, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

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

  // Ne rien afficher si l'utilisateur n'a pas le rôle admin (redirection gérée par useEffect)
  if (!isAdmin()) {
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
          variant="underlined"
          classNames={{
            base: "w-full",
            tabList: "gap-0 sm:gap-2 w-full relative rounded-none p-0 border-b border-divider bg-transparent",
            cursor: "bg-primary h-0.5",
            tab: "max-w-fit px-4 sm:px-8 h-12 sm:h-14 data-[selected=true]:text-primary",
            tabContent: "group-data-[selected=true]:text-primary text-sm sm:text-base font-semibold transition-colors",
            panel: "mt-6 sm:mt-8"
          }}
        >
          <Tab 
            key="calendars" 
            title={
              <div className="flex items-center gap-2 sm:gap-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2} 
                  stroke="currentColor" 
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" 
                  />
                </svg>
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
              <div className="flex items-center gap-2 sm:gap-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2} 
                  stroke="currentColor" 
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" 
                  />
                </svg>
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
              <div className="flex items-center gap-2 sm:gap-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2} 
                  stroke="currentColor" 
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655-5.653a2.548 2.548 0 010-3.586L11.42 15.17z" 
                  />
                </svg>
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

