var entityRequest = require('./entity-request');

module.exports = function(app, route){
	app.post(route, function(req, res){
		entityRequest.getEntities(req.query.text, function(msg){
			res.json(msg);
		});
	});
}