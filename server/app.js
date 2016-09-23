"use strict";

let Sharebox = require('core/sharebox');

let sharebox_options = {
	socket_server : {
		port : 8080
	},
	
	http_server : {
		port : 80,
		folders : {
			client : 'client'
		},
		compression : {
			enabled : true
		}
	}
};

let sharebox = new Sharebox(sharebox_options);
sharebox.run();