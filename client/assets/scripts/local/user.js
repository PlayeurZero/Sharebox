"use strict";

class User {
	/**
	 * @param {Object} var1
	 * @param {String} var1.username
	 * @param {Number} var1.avatar
	 */
	constructor(var1) {
		if(!(typeof var1 === 'object')) {
			return;
		}

		if(var1.username) {
			this.setUsername(var1.username);
		}

		if(var1.avatar) {
			this.setAvatar(var1.avatar);
		}
	};

	/**
	 * @param {String} var1
	 */
	setUsername(var1) {
		if(!(typeof var1 === 'string')) {
			return;
		}

		this._username = var1;
	};

	/**
	 * @returns {String}
	 */
	getUsername() {
		return this._username;
	};

	setAvatar(var1) {
		if(typeof var1 === 'string') {
			var1 = Number.parseInt(var1);
		}

		if(!(typeof var1 === 'number' && !(isNaN(var1)))) {
			return;
		}

		this._avatar = var1;
	};

	/**
	 * @returns {Number}
	 */
	getAvatar() {
		return this._avatar;
	};
};