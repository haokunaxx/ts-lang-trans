/**
 * 翻译成功时更新当前成功的词条
 * @param {}
 */
export const patch = (
  key: string,
  value: string,
  targetObj: Record<string, any>,
  separator: string = '.',
) => {
  const keyArr = key.split(separator);
  let i = 0;
  let temp = targetObj;
  while (i < keyArr.length - 1) {
    const key = keyArr[i++];
    temp = temp[key] = temp[key] || {};
  }
  temp[keyArr[i]] = value;
};

export const patchSuccess = (
  data: {
    query: string; //需要翻译的内容
    translation: string; //翻译的结果
  }[],
  langExistingData: Record<string, any>,
  helpMap: Map<string, string>,
) => {
  data.forEach(({ query, translation }) => {
    const key = helpMap.get(query);
    if (!key) return;
    patch(key, translation, langExistingData);
  });
};

/**
 * 翻译失败时记录当前失败的词条
 * @param {}
 */
export const recordFailure = (
  lang: string,
  queryWords: string[],
  helpMap: Map<string, string>,
  langFilePath: string,
  translateFailedObj: Record<string, any>,
) => {
  translateFailedObj[lang] = translateFailedObj[lang] || {
    lang,
    filePath: langFilePath,
    list: {},
  };
  queryWords.forEach((queryWord) => {
    const key = helpMap.get(queryWord);
    if (!key) return;
    translateFailedObj[lang]['list'][key] = queryWord;
  });
};
