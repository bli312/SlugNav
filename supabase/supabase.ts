import { AppState, Platform } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabasePublishableKey, 
  {
    auth: {
      ...(Platform.OS !== 'web' 
        ? { storage: AsyncStorage }
        : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
)

// Handle session refreshing on native platforms.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}

export async function getClasses() {
  // Get the currently logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }

  if (!user) {
    throw new Error('User is not logged in')
  }

  // Read classrooms belonging to this user
  const { data, error } = await supabase
  .from('classes')
  .select('*')
  .eq('owner_id', user.id)
  .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}


export async function deleteClass(classId: string) {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: authError?.message || 'User not authenticated'
    }
  }
  
  const { error } = await supabase
  .from('classes')
  .delete()
  .eq('id', classId)
  .eq('owner_id', userId)

  if (error) {
    console.error('Error deleting class:', message)
    return { success: false, error }
  }

  return { success: true }
}

export async function readUploadedMedia() {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError) throw userError

  if (!user) {
    throw new Error('User is not logged in')
  }

  const { data, error } = await supabase
  .from('uploads')
  .select('*')
  .eq('user_id', user.id)
  .list(user.id)

  if (error) throw error

  const media = data.map((file) => {
    const filePath = `${user.id}/${file.name}`

    const { data: urlData } = supabase.storage
    from('uploads')
    .getPublicUrl(filePath)

    return {
      name: file.name,
      id: file.id,
      created_at: file.created_at,
      url: urlData.publicUrl
    }
  })
  
  return media
}

export async function deleteUploadedFile(filePath) {
  try {
    const { error } = await supabase.storage
    .from('uploads')
    .remove([filePath])

    if (error) {
      throw error
    }

    console.log('File deleted succesfully:', data)

    return data
  } catch (error) {
    console.error('Error deleting uploaded file:', error.message)
    throw error
  }
}
