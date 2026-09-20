import type { JSX } from "react";
import { Outlet } from "react-router";
import { AppShell, Footer, Header } from "@wso2/oxygen-ui";

// The wireframe draws only `navbar "Pay"` on every screen — a brand-only top
// bar, no sidebar, no user menu: this is a public, unauthenticated, one-shot
// checkout link with no account and no other screens to navigate to. So the
// shell here is AppShell.Navbar + AppShell.Main + AppShell.Footer with no
// AppShell.Sidebar — there are no rail items the DSL draws to put in one.
export default function AppLayout(): JSX.Element {
  return (
    <AppShell>
      <AppShell.Navbar>
        <Header minimal>
          <Header.Brand>
            <Header.BrandTitle>Pay</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
        </Header>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>

      <AppShell.Footer>
        <Footer>
          <Footer.Copyright>&copy; {new Date().getFullYear()}</Footer.Copyright>
        </Footer>
      </AppShell.Footer>
    </AppShell>
  );
}
