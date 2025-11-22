'use client';

import { generalSettings } from '@/config/general.config';
import { Container } from '@/components/common/container';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <div className="flex flex-col md:flex-row justify-center items-center gap-3 py-5">
          <div className="flex gap-2 font-normal text-sm">
            <span className="text-muted-foreground">{currentYear} &copy;</span>
            <a
              href="https://cohabhub.com"
              target="_blank"
              className="text-secondary-foreground hover:text-primary"
            >
              Cohab
            </a>
          </div>
          {/* <nav className="flex order-1 md:order-2 gap-4 font-normal text-sm text-muted-foreground">
            <a
              href="https://cohabhub.com"
              target="_blank"
              className="hover:text-primary"
            >
              Documentation
            </a>
            <a
              href="https://cohabhub.com"
              target="_blank"
              className="hover:text-primary"
            >
              À propos
            </a>
            <a
              href="https://cohabhub.com"
              target="_blank"
              className="hover:text-primary"
            >
              FAQ
            </a>
            <a
              href="https://cohabhub.com"
              target="_blank"
              className="hover:text-primary"
            >
              Support
            </a>
          </nav> */}
        </div>
      </Container>
    </footer>
  );
}
