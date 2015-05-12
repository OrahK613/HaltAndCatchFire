var fs = require('fs')

var buffer = fs.readFileSync(process.argv[1]).toString()

var numnewlines = buffer.split(' ').length - 1;

console.log(numnewlines);