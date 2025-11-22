import { ReactNode } from 'react';
import Link from 'next/link';
import { I18N_LANGUAGES, Language } from '@/i18n/config';
import {
  Calendar,
  CreditCard,
  Globe,
  Moon,
  Receipt,
  Settings,
  Shield,
  User,
  UserCircle,
  Wallet,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/providers/i18n-provider';
import { useAuth } from '@/providers/auth-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

export function UserDropdownMenu({ trigger }: { trigger: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { changeLanguage, language } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleLanguage = (lang: Language) => {
    changeLanguage(lang.code);
  };

  const handleThemeToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" side="bottom" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <img
              className="w-9 h-9 rounded-full border border-border"
              src={'/media/avatars/300-2.png'}
              alt="User avatar"
            />
            <div className="flex flex-col">
              <Link
                href="/dashboard?tab=profile"
                className="text-sm text-mono hover:text-primary font-semibold"
              >
                {user?.name || user?.email || 'Utilisateur'}
              </Link>
              <Link
                href={`mailto:${user?.email || ''}`}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {user?.email || ''}
              </Link>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Menu Items */}
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard?tab=profile"
            className="flex items-center gap-2"
          >
            <UserCircle />
            Mon profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard?tab=reservations"
            className="flex items-center gap-2"
          >
            <Calendar />
            Mes réservations
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard?tab=billing"
            className="flex items-center gap-2"
          >
            <Wallet />
            Mon portefeuille
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard?tab=invoices"
            className="flex items-center gap-2"
          >
            <Receipt />
            Mes factures
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Settings Submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Settings />
            Paramètres
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard?tab=settings"
                className="flex items-center gap-2"
              >
                <Settings />
                Paramètres du compte
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard?tab=billing"
                className="flex items-center gap-2"
              >
                <CreditCard />
                Facturation
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard?tab=settings"
                className="flex items-center gap-2"
              >
                <Shield />
                Sécurité
              </Link>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Language Submenu with Radio Group */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2 [&_[data-slot=dropdown-menu-sub-trigger-indicator]]:hidden hover:[&_[data-slot=badge]]:border-input data-[state=open]:[&_[data-slot=badge]]:border-input">
            <Globe />
            <span className="flex items-center justify-between gap-2 grow relative">
              Langue
              <Badge
                variant="outline"
                className="absolute end-0 top-1/2 -translate-y-1/2"
              >
                {language.name}
                <img
                  src={language.flag}
                  className="w-3.5 h-3.5 rounded-full"
                  alt={language.name}
                />
              </Badge>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuRadioGroup
              value={language.code}
              onValueChange={(value) => {
                const selectedLang = I18N_LANGUAGES.find(
                  (lang) => lang.code === value,
                );
                if (selectedLang) handleLanguage(selectedLang);
              }}
            >
              {I18N_LANGUAGES.map((item) => (
                <DropdownMenuRadioItem
                  key={item.code}
                  value={item.code}
                  className="flex items-center gap-2"
                >
                  <img
                    src={item.flag}
                    className="w-4 h-4 rounded-full"
                    alt={item.name}
                  />
                  <span>{item.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        {/* Footer */}
        <DropdownMenuItem
          className="flex items-center gap-2"
          onSelect={(event) => event.preventDefault()}
        >
          <Moon />
          <div className="flex items-center gap-2 justify-between grow">
            Mode sombre
            <Switch
              size="sm"
              checked={theme === 'dark'}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </DropdownMenuItem>
        <div className="p-2 mt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              await logout();
              router.push('/signin');
            }}
          >
            Déconnexion
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
