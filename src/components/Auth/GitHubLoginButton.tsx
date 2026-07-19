'use client';

import { Button, Avatar, Menu } from '@mantine/core';
import { Github, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useUsageLimit } from '@/hooks/useUsageLimit';

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
      leftSection={<Github size={16} />} 
      variant="default" 
      onClick={handleLogin}
      radius="md"
    >
      Login with GitHub
    </Button>
  );
}
