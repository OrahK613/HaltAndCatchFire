
var index = 0;
var sum = 0;


for(index = 2; index < process.argv.length; index++)
{
	sum += +process.argv[index];
}

console.log(sum)