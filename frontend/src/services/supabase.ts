import 'react-native-get-random-values';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY} from '@env';

// Initialise the Supabase client using environment variables
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);