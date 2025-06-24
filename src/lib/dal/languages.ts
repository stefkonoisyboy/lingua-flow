import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

export class LanguagesDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getAllLanguages() {
    const { data: languages, error } = await this.supabase
      .from('languages')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Error fetching languages: ${error.message}`);
    }

    return languages;
  }
} 