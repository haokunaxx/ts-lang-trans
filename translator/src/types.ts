import { Services } from './service';

export type Recordable<T = any> = Record<string, T>;

export type TranslateResult =
  | {
      type: 'success';
      data: {
        query: string;
        translation: string;
      }[];
    }
  | {
      type: 'failed';
      reason: any;
    };

/* 支持的语言：（https://ai.youdao.com/DOCSIRMA/html/trans/api/plwbfy/index.html）
   常用： 
    - zh-CHS 简体中文
    - zh-CHT 繁体中文
    - en 英文
    - ko 韩语
    - ja 日语
    - de 德语
    - fr 法语
    - es 西班牙语
*/
export interface ConfigType {
  localLang: string;
  localLangFilePath: string;
  waitForTranslationFilePath: string;
  failureRecordsSaveDir: string;
  translationService: Services;
  targetLangs: {
    lang: string;
    filePath: string;
  }[];

  maxGroupLimit?: number; //对所有需要翻译的词条进行分组，此项配置每个组的最大数
  maxRetryTimes?: number; //每个组的最多重试次数
  maxParallel?: number; //最大并行数
}
