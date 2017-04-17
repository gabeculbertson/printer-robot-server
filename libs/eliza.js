var ElizaBot = require('elizabot');
var eliza = new ElizaBot();// ElizaBot();

// to set the internal memory size override property `memSize':
eliza.memSize = 100; // (default: 20)

var initial = eliza.getInitial();

module.exports.getResponse = function(text){
	var reply = eliza.transform(text);
	return reply;
}