import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://mqnzjwlmzveyqvvdqhsh.supabase.co"
const supabaseKey = "sb_publishable_5idnoEyjqY6A5kInpW_bzg_7s6DhF-U"

export const supabase = createClient(supabaseUrl, supabaseKey)