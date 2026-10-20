import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { StoreProfile, StoreProfileFormData } from "@/types/profile"
import { toast } from "sonner"

export const PROFILE_QUERY_KEY = ["store-profile"]
const PROFILE_STORAGE_KEY = "kiranatrack_profile_cache"

export const initialProfileSeed: StoreProfile = {
  shop_name: "Shree Ganesh Kirana Store",
  owner_name: "Ramesh Gupta",
  phone: "9876543210",
  address: "Shop #4, Main Market, APMC Road",
  gstin: "27AAAAA0000A1Z5",
  updated_at: new Date().toISOString(),
}

export function getStoredProfile(): StoreProfile {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed.shop_name === "string") {
        return parsed
      }
    }
  } catch {
    // Ignore storage errors
  }
  return initialProfileSeed
}

export function saveProfile(profile: StoreProfile) {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // Ignore storage errors
  }
}

let localProfileCache: StoreProfile = getStoredProfile()

export function useProfile() {
  return useQuery<StoreProfile, Error>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (!isPlaceholder) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .limit(1)
            .maybeSingle()

          if (!error && data) {
            localProfileCache = data as StoreProfile
            saveProfile(localProfileCache)
            return localProfileCache
          }
        } catch (err) {
          console.warn("[KiranaTrack] Supabase profile fetch fallback:", err)
        }
      }
      return localProfileCache
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: StoreProfileFormData): Promise<StoreProfile> => {
      const updated: StoreProfile = {
        ...localProfileCache,
        ...formData,
        updated_at: new Date().toISOString(),
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
      const isPlaceholder =
        !supabaseUrl ||
        supabaseUrl.includes("your-project") ||
        supabaseUrl.includes("placeholder-project")

      if (!isPlaceholder) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .upsert(updated)
            .select()
            .single()

          if (!error && data) {
            localProfileCache = data as StoreProfile
            saveProfile(localProfileCache)
            return localProfileCache
          }
        } catch (err) {
          console.warn("[KiranaTrack] Supabase profile upsert fallback:", err)
        }
      }

      localProfileCache = updated
      saveProfile(updated)
      return updated
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(PROFILE_QUERY_KEY, updated)
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      toast.success("Store profile updated", {
        description: `${updated.shop_name} • ${updated.owner_name}`,
      })
    },
    onError: (error) => {
      toast.error("Failed to update profile", {
        description: error.message,
      })
    },
  })
}
