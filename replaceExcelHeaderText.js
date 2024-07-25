const fs = require('fs');
const path = require('path');
const directoryPath = 'D:/xcode/emps/Emps.Web/Models/ExcelViewModels'; // 替换为你的目录路径
 
fs.readdir(directoryPath, function (err, files) {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    files.forEach(function (file) {
        if (file === '.gitkeep') {
            return;
        }
        var filePath = path.join(directoryPath, file);
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
        });
    });
});