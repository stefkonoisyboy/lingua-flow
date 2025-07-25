import { ILanguagesDAL } from "../di/interfaces/dal.interfaces";
import { ILanguagesService } from "../di/interfaces/service.interfaces";

export class LanguagesService implements ILanguagesService {
  constructor(private languagesDal: ILanguagesDAL) {}

  async getAllLanguages() {
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
