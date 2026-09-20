import { type RouteProps } from "react-router";
import AppLayout from "../layouts/AppLayout";
import PaymentDetailsPage from "../pages/PaymentDetailsPage";
import PayMethodPage from "../pages/PayMethodPage";
import PaymentResultPage from "../pages/PaymentResultPage";
import NoLinkPage from "../pages/NoLinkPage";

export interface AppRoute extends Omit<RouteProps, "children"> {
  children?: AppRoute[];
  label?: string;
}

// This app has one flow — PaymentDetails -> PayMethod -> PaymentResult — walked
// against one payment link at a time, so the link token rides the URL under
// every screen rather than living in app state. There is no sign-in and no
// role, so every screen sits under the one shell with no guard in front of it.
const appRoutes: AppRoute[] = [
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <NoLinkPage />, label: "No link" },
      { path: "/:linkToken", element: <PaymentDetailsPage />, label: "PaymentDetails" },
      { path: "/:linkToken/pay", element: <PayMethodPage />, label: "PayMethod" },
      { path: "/:linkToken/result", element: <PaymentResultPage />, label: "PaymentResult" },
      { path: "*", element: <NoLinkPage />, label: "No link" },
    ],
  },
];

export default appRoutes;
