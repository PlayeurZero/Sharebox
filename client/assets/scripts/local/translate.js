function Translate(message) {
	var db = {
		"view/connected" : "Vous êtes maintenant connecté!",
		"view/server_error" : "Problème avec la connexion, merci d'actualiser la page.",
		get : function(message) {
			let out = this[message];

			if(!(out)) {
				out = message;
			}

			return out;
		}
	};

	return db.get(message);
};