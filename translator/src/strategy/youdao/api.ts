import axios from 'axios';
import { createHash } from 'crypto';
import qs from 'querystring';
import { youdao_APP_KEY, youdao_KEY } from '../../../config.ts';

const truncate = (q: string) => {
  const len = q.length;
  if (len <= 20) return q;
  return q.substring(0, 10) + len + q.substring(len - 10, len);
};

/**
 * 请求有道 api 进行翻译
 */
export const youdaoApi = async (
  words: string[],
  from: string = 'zh-CHS',
  to: string = 'en',
) => {
  const hash = createHash('sha256');
  const appKey = youdao_APP_KEY || process.env.APP_KEY,
    key = youdao_KEY || process.env.KEY,
    salt = Math.random().toString(32).substring(5, 16),
    curtime = Math.round(new Date().getTime() / 1000);

  const sign = hash
    .update(appKey + truncate(words.join('')) + salt + curtime + key)
    .digest('hex');

  return axios({
    url: 'https://openapi.youdao.com/v2/api',
    method: 'post',
    params: {
      from,
      to,
      signType: 'v3',
      q: words,
      appKey,
      salt,
      curtime,
      sign,
    },
    paramsSerializer(params: any) {
      return qs.stringify(params);
    },
  });
};
