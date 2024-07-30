const fs = require('fs');
const path = require('path');
const directoryPath = 'D:/xcode/emps/Emps.Web/Models/ExcelViewModels'; // 替换为你的目录路径

var filePath =
  'D:/xcode/emps/Emps.Kernel/Utility/Constants.cs'; //path.join(directoryPath, file);
fs.readFile(filePath, 'utf8', function (err, data) {
  if (err) {
    return console.log('Unable to read file: ' + err);
  }
  // \b\w+(?: \w+)*\b

  const lines = data.split('\n');
  const newLines = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let hasNewLine = false;
    //if (/AddError\(\$\"(.*)\"\);/.test(line)) {
     if (/\$\"(.*)\";/.test(line)) { // for const
      console.log(line);
      let str = line.match(/\$\"(.*)\";/)[1];
      //console.log(str);
      //line = line.replace(/\$\"(.*)\"/, '$"$1"');
      // 正则表达式匹配变量部分：/{(\w+)}/g
      // \w+ 匹配一个或多个字母、数字或下划线
      // g 全局匹配
      const regex = /\{([^}]+)\}/g;

      // 替换函数
      let index = 0;
      if(!str
        .match(regex)) {
            newLines.push(line);
            continue;
        }
      let str2 = '|||' +
      str
        .match(regex)
        .map((m) => '{' +m.slice(1, -1) + '}')
        .join('|||');
       // console.log(str2);
      str = str.replace(regex, (match, p1) => {
          // match: 整个匹配到的部分，如 {x}
          // p1: 第一个捕获组，即变量名
          //console.log(match, p1);
          return `%${index++}`;
        }) 
        // +
        
          const s3 = '[[[' + str +str2 + ']]]'
          line = line.replace(/\$\"(.*)\"/, '$"'+s3+'"');
          console.log(line);
    }
    newLines.push(line);
  }
  const newdata = newLines.join('\n');
  fs.writeFile(filePath, newdata, 'utf8', function (err) {
      if (err) {
          return console.log('Unable to write file: ' + err);
      }
      console.log('File replaced: ' + filePath);
  });
});
