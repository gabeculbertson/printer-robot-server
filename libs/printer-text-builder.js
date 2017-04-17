var methods = {
	"set": function(context, params){
		context[params[1]] = params[2];
	},
	"write": function(context, params){
		context.write();
	}
}

function extractMethods(context, text){
	re = /\{(.*?)\}/g;
    do {
    	m = re.exec(text);
	    if (m) {
	    	var params = m[1].split(',');
	    	for(var i = 0; i < params.length; i++){
	    		params[i] = params[i].trim();
	    	}
	    	var method = params[0];
	    	methods[method](context, params);
	    	text = text.replace(m[0], "");
	    }
	} while (m);
	return text;
}

function insertContext (context, text){
	re = /\[(.*?)\]/g;
    do {
    	m = re.exec(text);
	    if (m) {
	    	var val = context[m[1]];
	    	text = text.replace(m[0], val);
	    }
	} while (m);
	return text;
}

module.exports.handle = function(context, text){
	text = extractMethods(context, text);
	text = insertContext(context, text);
	return text;
}

// var test_context = { };
// var test_string = "this is a string with context: [totalWords]";
// var test_method_string = "this is a string {set, totalWords, 77} with a method";
// console.log(extractMethods(test_context, test_method_string));
// console.log(insertContext(test_context, test_string));