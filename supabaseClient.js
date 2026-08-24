import { createClient } from "@supabase/supabase-js";

// Se o Project URL do seu Supabase for diferente, troca só a linha abaixo.
const SUPABASE_URL = "https://ecvcmmjbkyzvltgebwrr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_yYcFKHV0fnDcJvIeJsaxBQ_HnCga4k1";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
