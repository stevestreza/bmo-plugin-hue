var util = require("util");
var async = require("async");

var Hue = require("node-hue-api");
var HueApi = Hue.HueApi;

module.exports = function(bmo, store) {
	function getUser(cb) {
		store.get("user", function (err, doc, key) {
			if (doc && doc.bridgeIP && doc.username) {
				doc.hue = new HueApi(doc.bridgeIP, doc.username);
			}
			cb(doc);
		});
	}

	function getLights (cb) {
		getUser(function (user) {
			if (!user) {
				cb(null, null);
				return;
			}

			user.hue.lights(function(err, response) {
				if (response && response.lights) {
					cb(response.lights, user);
				} else {
					cb(null, user);
				}
			});
		});
	}

	bmo.plugin.register("hue", {
		register: function (responder) {
			var hue = new HueApi();
			// console.log("Locating bridges ", hue);
			// responder("Locating bridges…");
			// hue.locateBridges(function (err, result) {
			// 	responder("Found bridges");
			// console.log("Bridges ", result);
			// if (bridges.length == 0) {
			// 	console.log("No Hue bridges found");
			// 	return;
			// }
			// 
			// var bridge = bridges[0];
			var bridge = {ipaddress: "10.0.1.28"};
				hue.createUser(bridge.ipaddress, null, null, function (err, username) {
					if (err && err.message) {
						responder("Error: " + err.message);
					} else {
						var user = {
							username: username,
							bridgeIP: bridge.ipaddress
						};

						store.save("user", user, function(){
							responder("Hue Create User " + JSON.stringify(user));
						});
					}
				});
			// });
		},
		user: function (responder) {
			getUser(function (user) { 
				responder("Hue user: " + JSON.stringify(user)); 
			});
		},
		lights: function (responder) {
			getLights(function (lights, user) {
				if (lights) {
					async.map(response.lights, function(light, cb) {
						cb(null, light.name);
					}, function(err, lightNames){
						lightNames = lightNames.join(", ");
						responder("Lights: " + lightNames);
					});
				}
			});
		},
		brightness: function (brightness, responder) {
			getLights(function (lights, user) {
				if (lights) {
					var state = Hue.lightState.create().on().brightness(brightness);
					async.forEach(lights, function(light, cb) {
						user.hue.setLightState(light.id, state, function (err, result) {
							cb(null);
						});
					}, function(err) {
					});
				} else {
					responder("Couldn't get lights");
				}
			});
		},
		sleep: function(minutes, responder) {

		}
	});
};