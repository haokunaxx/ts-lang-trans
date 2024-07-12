import inquirer from 'inquirer';
import { resolve } from 'path';
import { CURRENT_WORKING_DIR } from '../config.ts';
import { getDirFiles } from './utils.ts';

/**
 * 询问需要重新翻译的失败的记录文件相对于当前项目根目录的路径
 */
export const askForFailureRecordFilePath = async (
  failureRecordsSaveDir: string,
) => {
  const dirPath = resolve(CURRENT_WORKING_DIR, failureRecordsSaveDir);
  const files = await getDirFiles(dirPath);
  if (!files || !files.length) {
    console.log('当前目录下没有需要重新翻译的文件');
    return;
  }
  const { item } = await askForSelectedListItem(
    '哪一个失败的文件需要重新进行翻译',
    [...files],
  );
  return item;
  // const { filePath } = await inquirer.prompt([
  //   {
  //     type: 'list',
  //     name: 'filePath',
  //     message: '哪一个失败的文件需要重新进行翻译',
  //     choices: [...files],
  //   },
  // ]);
  // return filePath;
};

export const askForContinue = (message: string) => {
  return inquirer.prompt([
    {
      type: 'confirm',
      name: 'isContinue',
      default: true,
      message,
    },
  ]);
};

export const askForSelectedListItem = (
  message: string,
  choices: ({ name: string; value: string } | string)[],
) => {
  return inquirer.prompt([
    {
      type: 'list',
      name: 'item',
      message,
      choices: choices as any,
    },
  ]);
};
