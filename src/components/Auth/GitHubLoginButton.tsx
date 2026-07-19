'use client';

import { Button, Avatar, Menu } from '@mantine/core';
import { LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUsageLimit } from '@/hooks/useUsageLimit';

function GithubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function GitHubLoginButton() {
  const { user, isInitializing } = useUsageLimit();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isInitializing) {
    return <Button loading variant="light" radius="md">...</Button>;
  }

  if (user) {
    return (
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Avatar 
            src={user.user_metadata.avatar_url} 
            radius="xl" 
            style={{ cursor: 'pointer' }}
          />
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Logged in as {user.user_metadata.user_name || user.email}</Menu.Label>
          <Menu.Divider />
          <Menu.Item 
            color="red" 
            leftSection={<LogOut size={14} />}
            onClick={handleLogout}
          >
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    );
  }

  return (
    <Button 
      leftSection={<GithubIcon size={16} />} 
      variant="default" 
      onClick={handleLogin}
      radius="md"
    >
      Login with GitHub
    </Button>
  );
}
