import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useSupabaseAutoRefresh } from '@/hooks/use-supabase-auto-refresh';

export default function RootLayout() {
  useSupabaseAutoRefresh();

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
