import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

let supabaseInstance: SupabaseClient | null = null

export const getSuperbaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        ...AppState(.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        peristSession: true,
        detectSessionInUrl: false,
      }
      if (Platform.OS !== 'web') {
        AppState.addEventListener('change', (state) => {
          if (state === 'active') {
            supabaseInstance?.auth.startAutoRefresh()
          } else {
            supabaseInstance?.auth.stopAutoRefresh()
          }
        })
      }
      supabaseInstance.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
          supabaseInstance?.auth.stopAutoRefresh()
        } else if (event === 'TOKEN_REFRESHED') {
          supabaseInstance?.auth.startAutoRefresh()
        }
      })
      supabaseInstance.auth.startAutoRefresh()
    })
  }
  return supabaseInstance
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}
