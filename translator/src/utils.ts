import { readdir, readFile, stat, writeFile } from 'fs/promises';
import { resolve } from 'path';
import * as prettier from 'prettier';
import { CURRENT_WORKING_DIR } from '../config.ts';
import { Recordable } from './types.ts';

/**
 * 工具函数：格式化时间
 */
export const formatTime = (
  timestamp: number,
  format = 'YYYY-MM-DD hh:mm:ss',
) => {
  const _date = new Date(timestamp);
  const obj = {
    Y: _date.getFullYear(),
    M: _date.getMonth() + 1,
    D: _date.getDate(),
    h: _date.getHours(),
    m: _date.getMinutes(),
    s: _date.getSeconds(),
  };

  return Object.keys(obj).reduce((prev, key) => {
    const reg = new RegExp(`${key}+`);
    return prev.replace(reg, ($) => {
      return String(obj[key as keyof typeof obj]).padStart($.length, '0');
    });
  }, format);
};

/**
 * 从给定的文件路径读取数据
 */
export const getDataFromFilePath = async (filePath: string) => {
  let data;
  try {
    const str = await readFile(filePath, {
      encoding: 'utf-8',
    });
    data = JSON.parse(str);
  } catch (err) {
    // console.log('getDataFromFilePath err:', err);
    data = {};
  }
  return data;
};

/**
 * 获取指定目录下的所有文件
 */
export const getDirFiles = async (dirPath: string) => {
  const res = await stat(dirPath);
  if (!res.isDirectory()) {
    return console.log('请输入正确的目录路径');
  }
  return await readdir(dirPath);
};

/**
 * 并发控制
 */
type ParallelControlFn = (
  fns: Function[],
  parallelCount: number,
  maxRetryCount: number,
) => Promise<any[]>;
export const ParallelControl: ParallelControlFn = async (
  fns,
  parallelCount,
  maxRetryCount,
) => {
  const result: any[] = [];
  let count = -1;

  const run = (
    index: number,
    resolve: Function,
    reject: Function,
    retryCount: number = 0,
  ) => {
    const fn = () => Promise.resolve(fns[index]());
    fn()
      .then((data) => {
        result[index] = {
          type: 'success',
          data,
        };
        if (count >= fns.length - 1) {
          resolve(void 0);
        } else {
          run(++count, resolve, reject);
        }
      })
      .catch((reason) => {
        // 没有重试次数了
        if (retryCount >= maxRetryCount) {
          result[index] = {
            type: 'failed',
            reason,
          };
          if (count >= fns.length - 1) {
            resolve(void 0);
          } else {
            run(++count, resolve, reject);
          }
          return;
        }
        console.log(`prepare to retry... times: ${retryCount + 1}`);
        run(index, resolve, reject, retryCount + 1);
      });
  };
  const handler = (index: number) => {
    return new Promise((resolve, reject) => {
      run(index, resolve, reject);
    });
  };

  const runnings = fns.slice(0, parallelCount).map(() => handler(++count));
  await Promise.allSettled(runnings);
  return result;
};

/**
 * 将更新后的词库写入指定文件
 */
export const outputLangDataToJsonFile = async (
  langData: Record<string, any>,
  filePath: string,
) => {
  await writeFile(
    resolve(CURRENT_WORKING_DIR, filePath),
    await prettier.format(JSON.stringify(langData), {
      parser: 'json',
    }),
  ).catch((err: any) => {
    console.log(err);
  });
};

export const flatten = (obj: Recordable) => {
  const handler = (
    obj: Recordable,
    prefixList: string[],
    key: string,
    value: any,
  ) => {
    if (typeof value === 'string') {
      obj[[...prefixList, key].join('.')] = value;
    } else {
      for (const [_key, _value] of Object.entries(value)) {
        handler(obj, [...prefixList, key], _key, _value);
      }
    }
  };
  const result: Recordable = {};

  for (const [key, value] of Object.entries(obj)) {
    handler(result, [], key, value);
  }
  return result;
};
