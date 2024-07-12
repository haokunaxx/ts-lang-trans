export const youdaoFormat = (data: any[]) => {
  return data.map((item) => {
    return item.type === 'success' && item.data.data.errorCode === '0'
      ? {
          type: item.type,
          data: item.data.data.translateResults,
        }
      : {
          type: 'failed',
          reason: item.reason || item.data?.data,
        };
  });
};
