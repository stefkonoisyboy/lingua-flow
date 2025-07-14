import {
  CreateSyncHistoryParams,
  ISyncHistoryDAL,
} from "../di/interfaces/dal.interfaces";
import { ISyncHistoryService } from "../di/interfaces/service.interfaces";

export class SyncHistoryService implements ISyncHistoryService {
  constructor(private readonly syncHistoryDAL: ISyncHistoryDAL) {}

  async create(data: CreateSyncHistoryParams) {
    await this.syncHistoryDAL.create(data);
  }

  async getByProjectId(projectId: string) {
    return this.syncHistoryDAL.getByProjectId(projectId);
  }
}
