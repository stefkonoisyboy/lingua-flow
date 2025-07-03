import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.types";

export class PaginationDAL {
  constructor(private supabase: SupabaseClient<Database>) {}

  async fetchAllPages<T>(
    query: ReturnType<typeof this.supabase.from>,
    pageSize: number = 1000
  ): Promise<T[]> {
    let allData: T[] = [];
    let lastPage = false;
    let page = 0;

    while (!lastPage) {
      const { data, error } = await query.range(
        page * pageSize,
        (page + 1) * pageSize - 1
      );

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
