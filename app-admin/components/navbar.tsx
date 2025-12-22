'use client';

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";

export const Navbar = () => {
  const { authenticated, loading, login, logout, keycloak } = useAuth();

  return (
    <HeroUINavbar maxWidth="xl" position="sticky">
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink className="flex justify-start items-center gap-1" href="/">
            <Logo />
            <p className="font-bold text-inherit">Airbnb Reservation</p>
          </NextLink>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <NextLink href="/calendars">
            <Button variant="flat" size="sm">
              Calendriers
            </Button>
          </NextLink>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem>
          {!loading && (
            <>
              {authenticated ? (
                <div className="flex items-center gap-3">
                  {keycloak?.tokenParsed && (
                    <span className="text-sm text-default-600">
                      {keycloak.tokenParsed.preferred_username || keycloak.tokenParsed.email}
                    </span>
                  )}
                  <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    onPress={logout}
                  >
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  onPress={login}
                >
                  Connexion
                </Button>
              )}
            </>
          )}
        </NavbarItem>
      </NavbarContent>
    </HeroUINavbar>
  );
};
