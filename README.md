# 说明文档

  **目前只支持有道翻译**

## 使用
### 添加有道翻译的 APP_KEY 和 KEY。
两种方式：
1. 前往 translator/config.ts文件，将`youdao_APP_KEY`和`youdao_KEY`替换成自己的 key
2. 新建 .env.local 文件
写入以下内容
```typescript
APP_KEY=你的 Key
KEY=你的 Key
```
### 终端执行翻译命令

```typescript
  pnpm i 
  pnpm run translate
  // 或者
  pnpm run translate new //翻译新词条
  pnpm run translate retry //重试翻译失败的记录
```
说明：
- 直接使用 translate 命令会在终端进行询问，让用户选择翻译新词条还是重试翻译失败的记录

### 翻译结果

- 用于翻译的新词条·文件（需要翻译的文件）在temp.json(可配置)
- 翻译结果会输出在locales/xxx.json(可配置)
- 失败的日志会输出在 logs/xx-xx_xx:xx:xx.json(可配置)，用于重试



## 配置项
### localLang 本地语言，首选语言

支持的语言：https://ai.youdao.com/DOCSIRMA/html/trans/api/plwbfy/index.html 

常用： 
- zh-CHS 简体中文
- zh-CHT 繁体中文
- en 英文
- ko 韩语
- ja 日语
- de 德语
- fr 法语
- es 西班牙语
- ...


### localLangFilePath 本地首选语言词条文件地址
默认为`./locales/zh-CN.json`

### waitForTranslationFilePath 新词条文件地址
默认为 `./temp.json` 

### failureRecordsSaveDir 翻译失败的记录保存地址
默认为 `./logs`

### translationService 翻译服务提供商
目前只支持 `youdao`(有道翻译)
默认为 `youdao`

### targetLangs 翻译的目标语言数组
默认为 
```typescript
  [{
    lang: 'en',
    filePath: './locales/en-US.json'
  }]
```

### maxGroupLimit 每次翻译的最大词条数量
默认为 100

### maxParallel 最大并行翻译数量
默认为 2

### maxRetryTimes 最大重试次数
默认为 2


## 其他

### 新词条文件说明
**json格式**, 嵌套或者不嵌套都可以。 如下
```typescript
//嵌套
{
  "menu": {
    "home": "首页",
    "about": "关于我们"
  },
}
//或者不嵌套
{
  "menu.home": "首页",
  "menu.about": "关于我们"
}
```

### 失败记录文件说明
```typescript
{
  "en": {
    //目标语言
    "lang": "en", 
    //目标文件词条地址
    "filePath": "./locales/en-US.json", 
    // 某次翻译的时候目标语言的失败词条
    "list": {
      "sys.api.networkExceptionMsg": "网络异常，请检查您的网络连接是否正常!",
      "sys.api.errMsg401": "用户没有权限（令牌、用户名、密码错误）!",
      "sys.api.errMsg403": "用户得到授权，但是访问是被禁止的。!",
      "sys.api.errMsg404": "网络请求错误,未找到该资源!"
    }
  },
  "ko": {
    //...
  }
}
```

