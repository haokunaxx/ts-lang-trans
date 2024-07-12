import { youdaoApi, youdaoFormat } from './strategy/youdao/index.ts';

const StrategyMap = {
  youdao: {
    api: youdaoApi,
    format: youdaoFormat,
  },
};

export type Services = keyof typeof StrategyMap;
export const getStrategyByService = (service: keyof typeof StrategyMap) => {
  return StrategyMap[service];
};
