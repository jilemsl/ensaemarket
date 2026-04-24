"use client";
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const WALLPAPERS: Record<string, string> = {
  '/login':   'login.png',
  '/stats':   'killbill.png',
  '/sync':    'killbill.png',
  '/profil':  'vegas3.png',
  '/avatars': 'vegas3.png',
  '/admin':   'princessbride.png',
  '/creer':   'localhero3.png',
};

export default function WallpaperBackground() {
  const pathname = usePathname();
  const [file, setFile] = useState<string | null>(null);

  useEffect(() => {
    if (pathname === '/') {
      supabase.auth.getUser().then(({ data }) => {
        setFile(data.user ? 'ensae.png' : 'login.png');
      });
    } else {
      setFile(WALLPAPERS[pathname] ?? null);
    }
  }, [pathname]);

  if (!file) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        backgroundImage: `url(/backgrounds/${file})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}
