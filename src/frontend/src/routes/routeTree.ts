import { createRootRoute, createRoute } from "@tanstack/react-router";
import BeneficiaryCapsulePage from "../pages/BeneficiaryCapsulePage";
import BeneficiaryLoginPage from "../pages/BeneficiaryLoginPage";
import DashboardPage from "../pages/DashboardPage";
import LandingPage from "../pages/LandingPage";
import RootLayout from "./RootLayout";

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const accessRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/access",
  component: BeneficiaryLoginPage,
});

const capsuleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/capsule/$ownerPrincipal",
  component: BeneficiaryCapsulePage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  accessRoute,
  capsuleRoute,
]);
