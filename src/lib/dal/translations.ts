import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

export class TranslationsDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getProjectTranslations(projectIds: string[]) {
    const { data: translations, error: translationsError } = await this.supabase
      .from('translations')
      .select(`
        status,
        key_id,
        translation_keys!inner (
          project_id
        )
      `)
      .in('translation_keys.project_id', projectIds);

    if (translationsError) {
      throw new Error(`Error fetching translations: ${translationsError.message}`);
    }

    return translations;
  }
} 