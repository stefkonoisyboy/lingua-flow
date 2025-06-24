import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { LanguagesDAL } from '../dal/languages';

export class LanguagesService {
  private languagesDal: LanguagesDAL;

  constructor(supabase: SupabaseClient<Database>) {
    this.languagesDal = new LanguagesDAL(supabase);
  }

  async getAllLanguages() {
    return this.languagesDal.getAllLanguages();
  }
} 