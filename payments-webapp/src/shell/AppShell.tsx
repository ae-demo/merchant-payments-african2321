import type { JSX } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell as OxygenAppShell,
  Footer,
  Header,
  Sidebar,
  UserMenu,
} from "@wso2/oxygen-ui";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Wallet,
  Landmark,
  Building2,
  Users,
  LogOut,
} from "@wso2/oxygen-ui-icons-react";
import { APP_NAME } from "../appName";
import { Can, useAuthz, useHeldRoles } from "../authz/gates";
import { signOut } from "../authz/session";
import { SCREEN_ROUTES } from "../authz/screens";

const RAIL_ICONS: Record<string, JSX.Element> = {
  dashboard: <LayoutDashboard size={18} />,
  "payment-requests": <FileText size={18} />,
  transactions: <Receipt size={18} />,
  payouts: <Wallet size={18} />,
  "bank-account": <Landmark size={18} />,
  profile: <Building2 size={18} />,
  "admin-merchants": <Users size={18} />,
  "admin-transactions": <Receipt size={18} />,
  "admin-payouts": <Wallet size={18} />,
};

const MERCHANT_RAIL_KEYS = new Set([
  "dashboard",
  "payment-requests",
  "transactions",
  "payouts",
  "bank-account",
  "profile",
]);

export function AppShell(): JSX.Element {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { username } = useAuthz();
  const roles = useHeldRoles();

  const railScreens = SCREEN_ROUTES.filter((screen) => screen.inRail);
  const merchantItems = railScreens.filter((s) => MERCHANT_RAIL_KEYS.has(s.key));
  const adminItems = railScreens.filter((s) => !MERCHANT_RAIL_KEYS.has(s.key));

  const active = railScreens.find((s) => pathname.startsWith(s.path))?.key;

  async function handleSignOut(): Promise<void> {
    await signOut();
  }

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Toggle />
          <Header.Brand onClick={() => navigate("/")}>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} showName />
              <UserMenu.Header
                name={username || "Signed in"}
                email={username}
                role={roles.join(", ") || undefined}
              />
              <UserMenu.Logout icon={<LogOut size={16} />} onClick={handleSignOut} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Sidebar>
        <Sidebar activeItem={active}>
          <Sidebar.Nav>
            {merchantItems.length > 0 && (
              <Sidebar.Category>
                <Sidebar.CategoryLabel>Payments</Sidebar.CategoryLabel>
                {merchantItems.map((screen) => (
                  <Can op={screen.loads!} key={screen.key}>
                    <Sidebar.Item id={screen.key} link={<Link to={screen.path} />}>
                      <Sidebar.ItemIcon>{RAIL_ICONS[screen.key]}</Sidebar.ItemIcon>
                      <Sidebar.ItemLabel>{screen.label}</Sidebar.ItemLabel>
                    </Sidebar.Item>
                  </Can>
                ))}
              </Sidebar.Category>
            )}
            {adminItems.length > 0 && (
              <Sidebar.Category>
                <Sidebar.CategoryLabel>Administration</Sidebar.CategoryLabel>
                {adminItems.map((screen) => (
                  <Can op={screen.loads!} key={screen.key}>
                    <Sidebar.Item id={screen.key} link={<Link to={screen.path} />}>
                      <Sidebar.ItemIcon>{RAIL_ICONS[screen.key]}</Sidebar.ItemIcon>
                      <Sidebar.ItemLabel>{screen.label}</Sidebar.ItemLabel>
                    </Sidebar.Item>
                  </Can>
                ))}
              </Sidebar.Category>
            )}
          </Sidebar.Nav>
        </Sidebar>
      </OxygenAppShell.Sidebar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>&copy; {APP_NAME}</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
