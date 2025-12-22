'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { title, subtitle } from '@/components/primitives';

export default function Home() {
  const { authenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.push('/login');
    }
  }, [authenticated, loading, router]);

  if (loading) {
    return (
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="text-center">
          <p className="text-lg">Chargement...</p>
        </div>
      </section>
    );
  }

  if (!authenticated) {
    return null;
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title()}>Bienvenue sur&nbsp;</h1>
        <h1 className={title({ color: "violet" })}>Airbnb Reservation System</h1>
        <div className={subtitle({ class: "mt-4" })}>
          Gestion des réservations et calendriers Airbnb
        </div>
      </div>

      <div className="mt-8 w-full max-w-2xl">
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Tableau de bord</h2>
          </CardHeader>
          <CardBody>
            <p className="text-default-600">
              Vous êtes connecté. Utilisez le menu de navigation pour accéder aux différentes fonctionnalités.
            </p>
          </CardBody>
        </Card>
      </div>
    </section>
  );
}
