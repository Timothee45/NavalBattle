var http = require('http');
var fs = require('fs');

// Chargement du fichier index.html affiché au client
var server = http.createServer(function(req, res) {
	if (req.url == "/") {
	    sendFile('./index.html', "text/html");
	} else {
		sendFile('.' + req.url, "text/css");
	}

	function sendFile(file, contentType) {
	    fs.readFile(file, 'utf-8', function(error, content) {
	        res.writeHead(200, {"Content-Type": contentType});
	        res.end(content, 'utf-8');
	    });
	}
});

// Chargement de socket.io
var io = require('socket.io').listen(server);

var maxSize = 10;
var playerArray = [];
var gameData = {};
var maxPoints = 17;
var maxLaunches = 3;
var currentPlayerNum = 0;
var currentPlayer = "";
var boatConf = {5: 1, 4: 1, 3: 2, 2: 1};
var isTest = false;

// Quand un client se connecte, on le note dans la console
io.sockets.on('connection', function (socket) {
    socket.on('auth', function(message) {
    	if (message.length != 0) {
    		if (playerArray.includes(message)) {
	    		socket.emit('my-auth', {
					"status": "ko",
					"message": "Pseudo déja utilisé!!!",
					"data": message,});
			} else {
		    	if (playerArray.length < 2) {
			    	socket.pseudo = message;

			    	playerArray.push(message);

			    	gameData[message] = addData();
			    	gameData[message]["num"] = playerArray.length;

			    	if (playerArray.length == 2) {
			    		gameData[playerArray[0]]["opponent"] = playerArray[1];
			    		gameData[playerArray[1]]["opponent"] = playerArray[0];

			    		currentPlayer = playerArray[currentPlayerNum];
			    	}

		    		socket.emit('my-auth', {
						"status": "ok",
						"message": "",
						"data": message,});
			    } else {
		    		socket.emit('my-auth', {
						"status": "ko",
						"message": "Trop de joueurs dans la partie.",
						"data": "WAIT_OTHER_GAME"});
			    }
			}
    	} else {
    		socket.emit('my-auth', {
				"status": "ko",
				"message": "Pseudo vide!!",
				"data": message,});
    	}
    });

    function ParcBoat(x, y, boatsCoords, boatArray, sens) {
    	if (sens == "horizon") {
    		x = parseInt(x) + 1;
    	} else {
			y = parseInt(y) + 1;
    	}
    	var newCoord = y + "-" + x;
    	if (boatsCoords.includes(newCoord)) {
    		boatArray.push(newCoord);
    		ParcBoat(x, y, boatsCoords, boatArray, sens);
    	}

    	return boatArray;
    }

	function GetBoats(boatsCoords) {
		var nbrCoords = boatsCoords.length
		var currentCoord;
		var boatLength;
		var result = true;
		var boatsEnnum = {};

		for (var i=0; i<nbrCoords; i++) {
			currentCoord = boatsCoords[i].split("-");
			var boatArray = {"horizontal": [], "vertical": [], }

			boatArray["horizontal"] = ParcBoat(currentCoord[1], currentCoord[0], boatsCoords, [boatsCoords[i]], "horizon");
			boatArray["vertical"] = ParcBoat(currentCoord[1], currentCoord[0], boatsCoords, [boatsCoords[i]], "verti");

			if (boatArray["horizontal"].length != 1 && boatArray["vertical"].length != 1) {
				result = false;
				break;
			} else {
				var finalBoatArray = boatArray["horizontal"].length != 1 ? boatArray["horizontal"] : boatArray["vertical"];

				boatsCoords = boatsCoords.filter(function(item) {
					return !(finalBoatArray.includes(item));
				});

				var boatSize = finalBoatArray.length;

				if (boatSize in boatsEnnum) {
					boatsEnnum[boatSize]++;
				} else {
					boatsEnnum[boatSize] = 1;
				}

				var dataBoat = {
					"coords": finalBoatArray,
					"size": boatSize,
					"touches": 0,
				}

				gameData[socket.pseudo]["boats"].push(dataBoat);

				i = i - 1;
				nbrCoords = boatsCoords.length;
			}
		}

		if (!BoatConfigRespected(boatsEnnum)) {
			result = false;
		}

		return result;
	}

	function BoatConfigRespected(boatsEnnum) {
		var resultBoat = true;

		if (Object.keys(boatConf).length != Object.keys(boatsEnnum).length) {
			resultBoat = false;
		}

		if (resultBoat) {
			for (var key in boatConf) {
				if (key in boatsEnnum && boatConf[key] == boatsEnnum[key]) {
				} else {
					resultBoat = false;
					break;
				}
			}
		}

		return resultBoat;
	}

	socket.on('defend', function (message) {
		if (message.length == maxPoints || isTest) {
			message.forEach(function(element) {
				boatCoordinates = element.split("-");

				placeBoat(boatCoordinates[0], boatCoordinates[1]);
			});

			var done = GetBoats(message);

			if (!done) {
				socket.emit('my-defend', {
					"status": "ko",
					"message": "Erreur dans le placement des bateaux ou dans leur nombres. Les bateaux ne peuvent pas êtres collés.",
					"data": message,});
			} else {
				socket.emit('my-defend', {
					"status": "ok",
					"message": "Importation réussie.",
					"data": message,});
			}
		} else {
			socket.emit('my-defend', {
				"status": "ko",
				"message": "Pas assez de bateaux!!!",
				"data": message,});
		}
	});

	socket.on('launches', function (message) {
		var nbrTouches = 0;
		var dataReturn = {"shots": {}, "boatsSinked": [], "currentPlayer": ""};
		var bonus = 0;
		var sinkedBoat;

		if (socket.pseudo == currentPlayer) {
			if (message.length == maxLaunches || isTest) {
				message.forEach( function(element) {
					launchCoordinates = element.split("-");

					bonus = fireToCoord(launchCoordinates[0], launchCoordinates[1]);
					sinkedBoat = checkBoatHits(launchCoordinates[0], launchCoordinates[1]);
					nbrTouches += bonus;
					dataReturn["shots"][element] = false;

					if (sinkedBoat.length != 0) {
						dataReturn["boatsSinked"].push(sinkedBoat);
					}

					if (bonus != 0) {
						dataReturn["shots"][element] = true;
					}
				});

				gameData[socket.pseudo]["points"] += nbrTouches;

				nextPlayer();

				dataReturn["currentPlayer"] = currentPlayer;

				socket.broadcast.emit('launches', {
					"status": "ok",
					"message": "Vous avez été touché " + nbrTouches + " fois.",
					"data": dataReturn,});
				socket.emit('my-launches', {
					"status": "ok",
					"message": "Vous avez fait " + nbrTouches + " touches.",
					"data": dataReturn,});
				SendScores();
			} else {
				socket.emit('my-launches', {
					"status": "ko",
					"message": "Vous ne pouvez tirer que " + maxLaunches + " fois.",
					"data": dataReturn,});
			}
		} else {
			socket.emit('my-launches', {
				"status": "ko",
				"message": "Ce n'est pas encore votre tour!!",
				"data": dataReturn,});
		}
	});

	function SendScores() {
		var returnedData = {"scores": {}, "winner": "",};
		var currentPoints;

		for (var key in gameData) {
			currentPoints = gameData[key]["points"];
			returnedData["scores"][key] = currentPoints;

			if (currentPoints == maxPoints) {
				returnedData["winner"] = socket.pseudo;
			}
		}

		socket.broadcast.emit('scores', returnedData);
		socket.emit('scores', returnedData);
	}

	function placeBoat(x, y) {
		gameData[socket.pseudo]["boatsGrid"][x - 1][y - 1] = 1;
	}

	function fireToCoord(x, y) {
		var yourData = gameData[socket.pseudo];
		yourData["launches"][x - 1][y - 1] = 1;
		var touche = 0;

		target = gameData[yourData["opponent"]]["boatsGrid"][x - 1][y - 1];
		if (target == 1) {
			touche = 1;
		}

		target = -1;

		return touche;
	}

	function checkBoatHits(x, y) {
		var yourData = gameData[socket.pseudo];
		var returnData = [];

		for (var num in gameData[yourData["opponent"]]["boats"]) {
			var boat = gameData[yourData["opponent"]]["boats"][num];

			if (boat["coords"].includes(x + "-" + y)) {
				boat["touches"]++;

				if (boat["touches"] == boat["size"]) {
					returnData = boat["coords"];
				}
				break;
			}
		}

		return returnData;
	}
});

function addData() {
	var myData = {
		"launches": [],
		"boatsGrid": [],
		"boats": [],
		"points": 0,
		"num": 0,
		"opponent": "",
	}

	for (var i=1; i<=maxSize; i++ ) {
		myData["launches"].push(Array(maxSize).fill(0));
		myData["boatsGrid"].push(Array(maxSize).fill(0));
	}

	return myData;
}

function nextPlayer() {
	currentPlayerNum = currentPlayerNum + 1;

	if (currentPlayerNum > 1) {
		currentPlayerNum = 0;
	}

	currentPlayer = playerArray[currentPlayerNum];
}

server.listen(8080);
