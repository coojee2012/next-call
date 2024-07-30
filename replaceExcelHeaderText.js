const fs = require('fs');
const path = require('path');
const DirPath = 'D:/xcode/emps'; // 替换为你的目录路径

function isDirectory(path) {
    try {
      const stats = fs.statSync(path);
      return stats.isDirectory();
    } catch (error) {
      // 如果路径不存在或发生其他错误，返回 false
      return false;
    }
}

const replaceException = (directoryPath) => {   
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
          return console.log('Unable to scan directory: ' + err);
        }
        files.forEach(function (file) {
          if (file === '.gitkeep') {
            return;
          }
          
          var filePath = path.join(directoryPath, file);
          if(isDirectory(filePath)) {
            replaceException(filePath);
            return;
          }

          const extension = path.extname(filePath);
          //console.log(filePath);
          if (extension !== '.cs') {
            return;
          }
          fs.readFile(filePath, 'utf8', function (err, data) {
            if (err) {
              return console.log('Unable to read file: ' + err);
            }
            // \b\w+(?: \w+)*\b
            // var replacedData = data.replace(/\[GridColumn\(\)\]/g, '[GridColumn(HeaderText = "[[[]]]")]'); // 替换为你的正则表达式和新字符串
            // fs.writeFile(filePath, replacedData, 'utf8', function (err) {
            //     if (err) {
            //         return console.log('Unable to write file: ' + err);
            //     }
            //     console.log('File replaced: ' + filePath);
            // });
            // const lines = data.split('\n');
            // const newLines = [];
            // for(let i=0;i<lines.length;i++) {
            //     let line = lines[i];
            //     let hasNewLine = false;
            //     if(/\[ExcelEditColumn/.test(line)) {
            //         if(!line.includes('HeaderText')) {
            //             line = line.replace(/\[ExcelEditColumn\(/,'[ExcelEditColumn(HeaderText = "[[[]]]", ');
            //         }
            //         let next_line = lines[i+1];
            //             if( !line.includes('Visible = false') && /public\s/.test(next_line)){
            //                 hasNewLine = true;
            //             }
      
            //     }
            //     newLines.push(line);
            //     if(hasNewLine) {
            //         newLines.push('		[GridColumn(HeaderText = "[[[]]]")]');
            //     }
      
            // }
            // const newdata = newLines.join("\n");
            // fs.writeFile(filePath, newdata, 'utf8', function (err) {
            //     if (err) {
            //         return console.log('Unable to write file: ' + err);
            //     }
            //     console.log('File replaced: ' + filePath);
            // });
      
            // for exception replace
      
            const lines = data.split('\n');
            const newLines = [];
            for (let i = 0; i < lines.length; i++) {
              let line = lines[i];
             
              if (/Exception\(\$"(.*)"/.test(line)) {
              //if (/\$\"(.*)\";/.test(line)) {
                // for const
                console.log(line);
                let str = line.match(/\$"(.*)"/)[1];
                //console.log(str);
                //line = line.replace(/\$\"(.*)\"/, '$"$1"');
                // 正则表达式匹配变量部分：/{(\w+)}/g
                // \w+ 匹配一个或多个字母、数字或下划线
                // g 全局匹配
                const regex = /\{([^}]+)\}/g;
      
                // 替换函数
                let index = 0;
                if (!str.match(regex)) {
                  newLines.push(line);
                  continue;
                }
                let str2 =
                  '|||' +
                  str
                    .match(regex)
                    .map((m) => '{' + m.slice(1, -1) + '}')
                    .join('|||');
                // console.log(str2);
                str = str.replace(regex, (match, p1) => {
                  // match: 整个匹配到的部分，如 {x}
                  // p1: 第一个捕获组，即变量名
                  //console.log(match, p1);
                  return `%${index++}`;
                });
                // +
      
                const s3 = '[[[' + str + str2 + ']]]';
                line = line.replace(/\$\"(.*)\"/, '$"' + s3 + '"');
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
        });
      });
 };


 const replaceMessage = (directoryPath) => {   
    fs.readdir(directoryPath, function (err, files) {
        if (err) {
          return console.log('Unable to scan directory: ' + err);
        }
        files.forEach(function (file) {
          if (file === '.gitkeep') {
            return;
          }
          
          var filePath = path.join(directoryPath, file);
          if(isDirectory(filePath)) {
            replaceMessage(filePath);
            return;
          }

          const extension = path.extname(filePath);
          //console.log(filePath);
          if (extension !== '.cs') {
            return;
          }
          fs.readFile(filePath, 'utf8', function (err, data) {
            if (err) {
              return console.log('Unable to read file: ' + err);
            }
      
            const lines = data.split('\n');
            const newLines = [];
            for (let i = 0; i < lines.length; i++) {
              let line = lines[i];
             
              if (/essage\s=\s\$"(.*)"/.test(line)) {
          
                console.log(line);
                let str = line.match(/\$"(.*)"/)[1];
                console.log(str);
                const regex = /\{([^}]+)\}/g;
      
                // 替换函数
                let index = 0;
                if (!str.match(regex)) {
                  line = line.replace(/\$"(.*)"/, '$"[[[' + str + ']]]"');
                  console.log(line);
                  newLines.push(line);
                  continue;
                }
                let str2 =
                  '|||' +
                  str
                    .match(regex)
                    .map((m) => '{' + m.slice(1, -1) + '}')
                    .join('|||');
                // console.log(str2);
                str = str.replace(regex, (match, p1) => {
                  return `%${index++}`;
                });
               
      
                const s3 = '[[[' + str + str2 + ']]]';
                line = line.replace(/\$\"(.*)\"/, '$"' + s3 + '"');
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
        });
      });
 };


 replaceMessage('D:/xcode/emps');

