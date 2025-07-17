import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";
import { IPaginationDAL } from "../di/interfaces/dal.interfaces";

export const DEFAULT_PAGE_SIZE = 1000;

export class PaginationDAL implements IPaginationDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async fetchAllPages<T>(
    query: ReturnType<typeof this.supabase.from>,
    pageSize: number = DEFAULT_PAGE_SIZE
  ) {
    let allData: T[] = [];
    let lastPage = false;
    let page = 0;

    while (!lastPage) {
      const { data, error } = await query
        .order("id", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) {
        throw new Error(`Failed to fetch data: ${error.message}`);
      }

      if (!data || data.length === 0) {
        break;
      }

      allData = [...allData, ...data];

      if (data.length < pageSize) {
        lastPage = true;
      }

      page++;
    }

    return allData;
  }
}
