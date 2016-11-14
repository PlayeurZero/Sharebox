"use strict";

class View {
	constructor() {
		this.setPage({ name : "signin", url : "signin/", showChatBar : false });
	};

	/**
	 * @param {Object} var1
	 * @param {String} var1.name
	 * @param {String} var1.path
	 */
	setPage(var1) {
		if(!(typeof var1 === 'object')) {
			return;
		}

		this._page = var1;
		this.update();
	};

	getPage() {
		return this._page;
	};

	update() {
		let page = this.getPage();

		window.history.pushState(page.name, null, '/' + page.url);
		$('.target').hide();
		$('.target#' + page.name).show();
		
		if(page.showChatBar) {
			$('.chat').show();
		} else {
			$('.chat').hide();
		}
	};

	static getInstance() {
		if(this._instance == null) {
			this._instance = new this();
		}

		return this._instance;
	};
};