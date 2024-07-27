const fs = require('fs');
 
function readLinesFromFile(filePath) {
  fs.readFile(filePath, 'utf-8', (err, content) => {
    if (err) {
      console.error(err);
      return;
    }
    const noTrans = []
    const lines = content.split('\n');
    for(let i=0; i<lines.length; i++) {
        const line = lines[i]
        if(/^msgstr/.test(line)) {
            const msgstrs = line.split(/\s/)
            // console.log(msgstrs[0] + "=====" + msgstrs[1], msgstrs[1] == '""');
            if(msgstrs[1] === '""') {
                const msgids = lines[i-1].split(/\s/);
                msgids.shift()
                if(msgids[0] == '""' || /^"@/.test(msgids[0])) {
                    continue;
                }
                const words = msgids.join(" ").slice(1, -2);
                console.log(words)
                noTrans.push(words)
            }            
        }
        
    }

    fs.writeFileSync('output.txt', noTrans.join('\n'));
  });
}
 
readLinesFromFile('D:/xcode/emps/Emps.Web/locale/zh-Hans/messages.po');