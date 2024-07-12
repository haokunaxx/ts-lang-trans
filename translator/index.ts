import dotenv from 'dotenv'
import { unlink } from 'fs/promises'
import { resolve } from 'path'
import { CURRENT_WORKING_DIR } from './config.ts'
import {
  askForContinue,
  askForFailureRecordFilePath,
  askForSelectedListItem
} from './src/prompt.ts'
import { processingTranslation } from './src/translate.ts'
import { ConfigType, Recordable } from './src/types.ts'
import {
  flatten,
  getDataFromFilePath,
  outputLangDataToJsonFile
} from './src/utils.ts'
dotenv.config({
  path: resolve(CURRENT_WORKING_DIR, '.env.local')
})

const params = process.argv.slice(2)
const operation = params[0]

const Config: ConfigType = {
  localLang: 'zh-CHS',
  localLangFilePath: './locales/zh-CN.json',
  waitForTranslationFilePath: './temp.json',
  failureRecordsSaveDir: './logs',
  translationService: 'youdao',
  targetLangs: [
    {
      lang: 'en',
      filePath: './locales/en-US.json'
    }
  ],
  maxGroupLimit: 100,
  maxParallel: 2,
  maxRetryTimes: 2
}

// 翻译新词条
const translateNewWords = async (config: typeof Config) => {
  const { waitForTranslationFilePath } = config
  if (!waitForTranslationFilePath)
    return console.error(`请指定需要翻译的文件的路径`)
  const filePath = resolve(CURRENT_WORKING_DIR, waitForTranslationFilePath)
  console.log('当前需要进行翻译的文件路径为' + filePath)

  const data = flatten(await getDataFromFilePath(filePath))
  if (!Object.keys(data).length) return
  await processingTranslation(data, config)
  const { isContinue } = await askForContinue('是否要清空待翻译的词条文件')
  if (isContinue) {
    // 清空待翻译的词条数据
    await outputLangDataToJsonFile({}, filePath)
  }
  console.log('翻译完成')
}

// 翻译失败的记录重试
const translateFailureRecord = async (config: typeof Config) => {
  const { failureRecordsSaveDir } = config
  const fileName = await askForFailureRecordFilePath(failureRecordsSaveDir)
  if (!fileName) return
  const filePath = resolve(
    CURRENT_WORKING_DIR,
    `${failureRecordsSaveDir}/${fileName}`
  )
  const failureData: {
    [key: string]: {
      filePath: string
      lang: string
      list: Record<string, string>
    }
  } = await getDataFromFilePath(filePath)

  const translationTasks: {
    waitingTranslationData: Recordable<string>
    config: typeof Config
  }[] = []

  for (const [lang, info] of Object.entries(failureData)) {
    translationTasks.push({
      waitingTranslationData: info.list,
      config: {
        ...config,
        targetLangs: [
          {
            lang,
            filePath: info.filePath
          }
        ]
      }
    })
  }
  for (const item of translationTasks) {
    await processingTranslation(item.waitingTranslationData, item.config)
  }
  await unlink(filePath)
  console.log('翻译完成')
}

const entry = async () => {
  if (operation === 'new') {
    await translateNewWords(Config)
  } else if (operation === 'retry') {
    await translateFailureRecord(Config)
  } else {
    const { item } = await askForSelectedListItem('做咩', [
      {
        name: '翻译新词条',
        value: 'new'
      },
      {
        name: '翻译失败的文件',
        value: 'retry'
      }
    ])
    if (item === 'new') {
      await translateNewWords(Config)
    } else {
      await translateFailureRecord(Config)
    }
  }
}

entry()
