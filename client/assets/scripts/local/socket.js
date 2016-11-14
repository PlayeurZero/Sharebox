"use strict";

class Socket {
	constructor(var1) {
		if(!(typeof var1 === 'object')) {
			return;
		}

		if(var1.url) {
			this.set(new WebSocket(var1.url));
		}
	};

	set(var1) {
		this._socket = var1;
	};

	get() {
		return this._socket;
	};

	notify(var1) {
		try {
			this.get().send(JSON.stringify(var1));
		} catch(e) {}
	};

	ready(var1) {
		this.get().addEventListener('open', var1);	
	};

	static getInstance() {
		if(this._instance == null) {
			this._instance = new this();
		}

		return this._instance;
	};
};