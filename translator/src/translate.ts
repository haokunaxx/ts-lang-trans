import { resolve } from 'path';
import { CURRENT_WORKING_DIR } from '../config.ts';
import { patch, patchSuccess, recordFailure } from './patch.ts';
import { ConfigType, TranslateResult } from './types.ts';
import {
  formatTime,
  getDataFromFilePath,
  outputLangDataToJsonFile,
  ParallelControl,
} from './utils.ts';

import { getStrategyByService, Services } from './service.ts';

const translateFailedObj: Record<string, any> = {};

/**
 * 对待翻译的所有词条进行分组
 */
const groupLocalDataWaitingTranslation = (
  dataWaitingTranslation: Record<string, any>,
  maxTranslateGroupLimit: number,
) => {
  const keys = Object.keys(dataWaitingTranslation);
  return keys.reduce((prev: Record<string, any>[], key, index) => {
    if (!(index % maxTranslateGroupLimit)) {
      prev.push({});
    }
    prev[prev.length - 1][key] = dataWaitingTranslation[key];
    return prev;
  }, []);
};

/**
 * 更新本地首选语言的对应文件
 */
const updateLocalLangData = (
  langData: Record<string, any>,
  dataWaitingTranslation: Record<string, string>,
) => {
  Object.keys(dataWaitingTranslation).forEach((key) => {
    patch(key, dataWaitingTranslation[key], langData);
  });
};

/**
 * 获取翻译的异步任务
 */
const getRemoteTranslateTasks = (
  queryWordsGroup: string[][],
  localLang: string,
  targetLang: string,
  translationService: Services,
) => {
  const { api } = getStrategyByService(translationService);
  return queryWordsGroup.map((queryWords) => {
    return () =>
      // FIXME: 411 errorCode
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(api(queryWords, localLang, targetLang));
        }, 1000);
      });
  });
};

/**
 * 翻译指定语言
 */
const translate = async (
  asyncTranslationTasks: (() => Promise<any>)[],
  maxParallel: number,
  maxRetryTimes: number,
): Promise<TranslateResult[]> => {
  const translateResultList: any[] = await ParallelControl(
    asyncTranslationTasks,
    maxParallel,
    maxRetryTimes,
  );
  return translateResultList;
};

// 终端打印失败的记录
const logFailure = (queryWords: string[], lang: string, reason: any) => {
  console.log('词条翻译失败========================');
  console.log('翻译的词条为:', queryWords.join('、'));
  console.log('目标语言为:', lang);
  console.log('原因是:', reason);
  console.log('------------------------------------');
};

/**
 * 处理翻译结果
 */
const handleTranslateResult = (
  _translateResultList: TranslateResult[],
  targetLangExistingData: Record<string, any>,
  helpMap: Map<string, string>,
  targetLang: string,
  queryWordsGroup: string[][],
  langFilePath: string,
  translationService: Services,
) => {
  // 根据当前翻译的服务商获取对应的格式化策略
  const { format } = getStrategyByService(translationService);

  const translateResultList = format(_translateResultList);

  translateResultList.forEach((translateResult, index) => {
    if (translateResult.type === 'success') {
      // 更新当前成功的词条
      patchSuccess(translateResult.data, targetLangExistingData, helpMap);
    } else {
      logFailure(queryWordsGroup[index], targetLang, translateResult.reason);
      // 记录当前失败的词条
      recordFailure(
        targetLang,
        queryWordsGroup[index],
        helpMap,
        langFilePath,
        translateFailedObj,
      );
    }
  });
};

/**
 * 翻译的过程
 */
export const processingTranslation = async (
  dataWaitingTranslation: Record<string, string>,
  config: ConfigType,
) => {
  const {
    localLang,
    localLangFilePath,
    targetLangs,
    maxGroupLimit = 100,
    maxParallel = 2,
    maxRetryTimes = 2,
    failureRecordsSaveDir,
    translationService,
  } = config;

  const helpMap = new Map<string, string>();

  const localLangData = await getDataFromFilePath(
    resolve(CURRENT_WORKING_DIR, localLangFilePath),
  );
  // if (Object.keys(localLangData).length === 0) return;
  // 对待翻译的词条数据进行分组
  const groupData = groupLocalDataWaitingTranslation(
    dataWaitingTranslation,
    maxGroupLimit,
  );

  // 保存翻译的词条顺序，之后根据索引和翻译的结果来记录成功或者失败的结果
  const queryWordsGroup: string[][] = [];
  groupData.forEach((groupItem) => {
    const queryWords: string[] = [];
    for (const [key, value] of Object.entries(groupItem)) {
      helpMap.set(value, key);
      queryWords.push(value);
    }
    queryWordsGroup.push(queryWords);
  });

  //多个目标语言逐个进行翻译
  for (const targetLang of targetLangs) {
    const { lang, filePath } = targetLang;

    // 目标语言已翻译的数据
    const targetLangExistingData = await getDataFromFilePath(
      resolve(CURRENT_WORKING_DIR, filePath),
    );

    // 根据分组的数据和目标语言获取异步任务
    const asyncTranslationTasks = getRemoteTranslateTasks(
      queryWordsGroup,
      localLang,
      lang,
      translationService,
    );

    // 执行翻译任务
    const translateResultList = await translate(
      asyncTranslationTasks,
      maxParallel,
      maxRetryTimes,
    );

    // 处理翻译结果
    // handleTranslateResult(
    //   format(translateResultList) as TranslateResult[],
    //   targetLangExistingData,
    //   helpMap,
    //   lang,
    //   queryWordsGroup,
    //   filePath,
    // );
    handleTranslateResult(
      translateResultList,
      targetLangExistingData,
      helpMap,
      lang,
      queryWordsGroup,
      filePath,
      translationService,
    );

    // 输出翻译后的目标语言词库
    await outputLangDataToJsonFile(targetLangExistingData, filePath);
  }

  // 更新首选语言词库
  updateLocalLangData(localLangData, dataWaitingTranslation);

  // 将更新后的首选语言词库输出到文件
  await outputLangDataToJsonFile(localLangData, localLangFilePath);

  // 输出失败的词条数据
  if (Object.keys(translateFailedObj).length > 0) {
    console.log('存在翻译失败的数据：', translateFailedObj);
    console.log('正在输出翻译失败的词条数据：');
    await outputLangDataToJsonFile(
      translateFailedObj,
      resolve(
        CURRENT_WORKING_DIR,
        `${failureRecordsSaveDir}/${formatTime(Date.now(), 'MM-DD_hh:mm:ss')}.json`,
      ),
    );
    console.log('翻译失败的词条文件已生成');
  }
};
