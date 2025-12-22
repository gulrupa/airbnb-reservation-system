'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { title } from '@/components/primitives';

export default function LoginPage() {
  const { authenticated, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authenticated && !loading) {
      router.push('/');
    }
  }, [authenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (authenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-2 pt-6">
          <h1 className={title()}>Connexion</h1>
          <p className="text-default-500 text-center">
            Connectez-vous pour accéder à l'administration
          </p>
        </CardHeader>
        <CardBody className="pb-6">
          <Button
            color="primary"
            size="lg"
            className="w-full"
            onPress={login}
          >
            Se connecter avec Keycloak
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

