module.exports = {
  root: true,
  env: {
      node: true
  },
  extends: [
      'plugin:vue/vue3-essential',
      'eslint:recommended',
    //'@vue/typescript/recommended',
  ],
  parserOptions: {
      ecmaVersion: 2020
  },
  rules: {
    "no-unused-vars":"off",
    "no-console":"off",
    "no-debugger":"off",
    "no-multiple-empty-lines":"off",
    "no-trailing-spaces":"off",
    "no-var":"off",
    "consistent-this":"off",
    "indent":"off",
    "no-dupe-args":"off",
    "max-lines":"off",
    "object-curly-newline":"off",
    "vue/multi-word-component-names": "off",
    "vue/no-unused-components": "off",
    "no-case-declarations":"off",
      // // 禁止使用v-html
      // 'vue/no-v-html': 0,
      // // 禁止使用v-text
      // 'vue/no-v-text': 0,
      // // 禁止使用v-pre
      // 'vue/no-v-pre': 0,
      // // 禁止使用v-cloak
      // 'vue/no-v-cloak': 0,
      // // 禁止使用v-once
      // 'vue/no-v-once': 0,
      // 'vue/attribute-hyphenation': 0,
      // // 自定义组件名称 - 驼峰和连字符
      // 'vue/component-definition-name-casing': 0,
      // // html 闭括号-换行
      // 'vue/html-closing-bracket-newline': [2, {
      //     singleline: 'never',
      //     multiline: 'always'
      // }],
      // // html 闭括号之前无空格
      // 'vue/html-closing-bracket-spacing': 2,
      // // html 需要有结束标签，除了自闭合标签
      // 'vue/html-end-tags': 2,
      // // 缩进html
      // 'vue/html-indent': ['error', 4, {
      //     attribute: 1,
      //     baseIndent: 1,
      //     closeBracket: 0,
      //     alignAttributesVertically: true,
      //     ignores: []
      // }],
      // 'vue/max-attributes-per-line': [2, {
      //     singleline: 4,
      //     multiline: 4
      // }],
      // // 禁止组件已注册但未使用的情况
      // 'vue/no-unused-components': [2],
      // 'no-multiple-empty-lines': 2,
      // 'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      // 'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      // 'no-constant-condition': 2, // 禁止在条件中使用常量表达式 if(true) if(1)
      // 'no-trailing-spaces': 1, // 一行结束后面不要有空格
      // 'no-var': 2, // 禁用var，用let和const代替
      // 'consistent-this': [2, 'that'], // this别名
      // indent: ['error', 4],
      // 'no-dupe-args': [2],
      // // 文件的最大行数
      // 'max-lines': ['error', {
      //     max: 600,
      //     skipBlankLines: true, // 忽略空白行
      //     skipComments: true // 忽略只包含注释的行
      // }],
      // // 遇见对象花括号换行
      // 'object-curly-newline': ['error', {
      //     ObjectExpression: 'always',
      //     ObjectPattern: {
      //         multiline: true
      //     },
      //     ImportDeclaration: 'never',
      //     ExportDeclaration: {
      //         multiline: true, minProperties: 3
      //     }
      // }]
  },
  overrides: [
    {
      files: ['src/views/**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 0,
      },
    },
  ],
}

