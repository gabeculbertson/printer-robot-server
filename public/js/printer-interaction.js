var socket = io('/');
var modeHandlers = {};

socket.on("text-message", function(text){
	$("#text-history-inner").append("<br>" + text);
});

function addHandler(key){
	modeHandlers[key] = function(){
		console.log('emitting: ' + key);
		socket.emit("key", key);
	};
}

socket.on("mode", function(mode){
	if(mode.type == "choice"){
		$("#text-in").hide();
		$("#choices").show();
		$("#choices").html("");
		for(var i in mode.choices){
			console.log(mode.choices[i]);
			var k = mode.choices[i].key;
			$("#choices").append('<div class="choice" key="' + k + '"><div class="key-img"><div class="inner">' + k + '</div></div>&nbsp;' + mode.choices[i].text + '</div>');
			addHandler(k);
		}
		$("#choices").css("opacity", 0);
		$("#choices").animate({
			opacity: 1
		}, 200);
	} else{
		$("#text-in").show();
		$("#text-in").val("");
		$("#choices").hide();
		$("#text-in").focus();
	}
});

$(document).ready(function(){
	var delay = getUrlParameter("delay");
	if(delay){
		socket.emit("delay", delay);
	}

	$(document).keypress(function(e){
		console.log(e.key);
		if(e.key in modeHandlers){
			modeHandlers[e.key]();
			modeHandlers = {};
			$(".key-img").css("opacity", 0);
			$(".choice[key!='"+ e.key + "']").animate({ opacity: 0 }, 200);
		}
	});

	$("#text-in").keypress(function(e){
		socket.emit('keypress');

		if(e.keyCode == 13){
			if($("#text-in").val() == ""){
				return;
			}

			// var html = $("#text-in").out
			// var newObj = $("#text-in").clone();
			// $("#wrapper").append('<div id="text-out" class="typed-text">' + $("#text-in").val() + '</div>');
			// newObj = $("#text-out");
			// newObj.css("position", "absolute");
			// var pos = $("#text-in").position();
			// newObj.css("left", pos.left);
			// newObj.css("top", pos.top);
			// newObj.attr("id", "");
			// newObj.animate({ top: "-=300" }, 3000, "linear", function(){
			// 	console.log("removing");
			// 	newObj.remove();
			// });

			setTimeout(function(){
				$("#text-in").val("");
				console.log('cleared');
			}, 100);

			var text = $("#text-in").val();
			socket.emit('text-message', text);
			console.log("printing: " + text);
			$.post('/print-img', { text: text });
			$("#text-in").val("");
		}
	});
});