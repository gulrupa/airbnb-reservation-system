'use client';

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarBrand,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import NextLink from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { useState } from "react";

export const Navbar = () => {
  const { authenticated, loading, login, logout, keycloak } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <HeroUINavbar maxWidth="xl" position="sticky" onMenuOpenChange={setIsMenuOpen} isMenuOpen={isMenuOpen}>
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
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
          <NextLink href="/annonces">
            <Button variant="flat" size="sm">
              Annonces
            </Button>
          </NextLink>
          <ThemeSwitch />
        </NavbarItem>
        <NavbarItem>
          {!loading && (
            <>
              {authenticated ? (
                <Button
                  color="danger"
                  variant="flat"
                  size="sm"
                  onPress={logout}
                >
                  Déconnexion
                </Button>
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

      <NavbarMenu>
        {authenticated && (
          <>
            <NavbarMenuItem>
              <NextLink
                href="/calendars"
                className="w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button variant="flat" className="w-full justify-start">
                  Calendriers
                </Button>
              </NextLink>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <NextLink
                href="/annonces"
                className="w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button variant="flat" className="w-full justify-start">
                  Annonces
                </Button>
              </NextLink>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <div className="flex items-center justify-between w-full">
                <span className="text-sm">Thème</span>
                <ThemeSwitch />
              </div>
            </NavbarMenuItem>
            <NavbarMenuItem>
              <Button
                color="danger"
                variant="flat"
                className="w-full"
                onPress={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
              >
                Déconnexion
              </Button>
            </NavbarMenuItem>
          </>
        )}
        {!authenticated && !loading && (
          <NavbarMenuItem>
            <Button
              color="primary"
              variant="flat"
              className="w-full"
              onPress={() => {
                setIsMenuOpen(false);
                login();
              }}
            >
              Connexion
            </Button>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </HeroUINavbar>
  );
};
