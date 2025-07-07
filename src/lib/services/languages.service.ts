import { ILanguagesDAL } from "../di/interfaces/dal.interfaces";
import {
  ILanguagesService,
  Language,
} from "../di/interfaces/service.interfaces";

export class LanguagesService implements ILanguagesService {
  constructor(private languagesDal: ILanguagesDAL) {}

  async getAllLanguages(): Promise<Language[]> {
    const languages = await this.languagesDal.getAllLanguages();

    return languages.map((lang) => ({
      id: lang.id,
      name: lang.name,
      code: lang.code,
      flagUrl: lang.flag_url,
      isRtl: lang.is_rtl,
    }));
  }
}
