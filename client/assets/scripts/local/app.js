function async(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: window.requestAnimationFrame.bind(null, function() {
            if (done) {
                return;
            }

            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        }),

        iteration: function() {
            return index - 1;
        },

        break: function() {
            done = true;
            callback();
        }
    };

    loop.next();
    return loop;
};

function formatBytes(bytes,decimals) {
	if(bytes == 0) return '0 byte';
	var k = 1000;
	var dm = decimals + 1 || 3;
	var sizes = ['o', 'ko', 'Mo', 'Go', 'To', 'Po', 'Eo', 'Zo', 'Yo'];
	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm).replace('.', ',')) + ' ' + sizes[i];
}

$(document).ready(function() {
	moment.locale('fr', {
		months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
		monthsShort : "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
		weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
		weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
		weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
		longDateFormat : {
			LT : "HH:mm",
			LTS : "HH:mm:ss",
			L : "DD/MM/YYYY",
			LL : "D MMMM YYYY",
			LLL : "D MMMM YYYY LT",
			LLLL : "dddd D MMMM YYYY LT"
		},
		calendar : {
			sameDay: "[Aujourd'hui à] LT",
			nextDay: '[Demain à] LT',
			nextWeek: 'dddd [à] LT',
			lastDay: '[Hier à] LT',
			lastWeek: 'dddd [dernier à] LT',
			sameElse: 'L'
		},
		relativeTime : {
			future : "dans %s",
			past : "il y a %s",
			s : "quelques secondes",
			m : "une minute",
			mm : "%d minutes",
			h : "une heure",
			hh : "%d heures",
			d : "un jour",
			dd : "%d jours",
			M : "un mois",
			MM : "%d mois",
			y : "une année",
			yy : "%d années"
		},
		ordinalParse : /\d{1,2}(er|ème)/,
		ordinal : function (number) {
			return number + (number === 1 ? 'er' : 'ème');
		},
		meridiemParse: /PD|MD/,
		isPM: function (input) {
			return input.charAt(0) === 'M';
		},
		// in case the meridiem units are not separated around 12, then implement
		// this function (look at locale/id.js for an example)
		// meridiemHour : function (hour, meridiem) {
		//     return /* 0-23 hour, given meridiem token and hour 1-12 */
		// },
		meridiem : function (hours, minutes, isLower) {
			return hours < 12 ? 'PD' : 'MD';
		},
		week : {
			dow : 1, // Monday is the first day of the week.
			doy : 4  // The week that contains Jan 4th is the first week of the year.
		}
	});
	moment.locale('fr');
	$(".button-collapse").sideNav();

	let websocket = new WebSocket('ws://localhost:8080');

	window.location.hash = 'sign';

	let user = null;

	websocket.addEventListener('open', function() {
		websocket.addEventListener('message', function(e) {
			let parsed_data = JSON.parse(e.data);
			
			let action = parsed_data.action;

			console.log(parsed_data)

			switch(action) {
				case "signup_failed" :
					signup_failed(parsed_data.extra);
					break;

				case "signin_success" :
					sign_success(parsed_data.extra);
					break;

				case "signup_success": 
					sign_success(parsed_data.extra);
					break;

				case "message_success":
					message_success(parsed_data.extra);
					break;

				case "new_download":
					new_download(parsed_data.extra);
					break;
			}
		});

		let signup_failed = function(data) {
			$(".signin_password").removeClass("hide");
		};

		let sign_success = function(data) {
			window.location.hash = 'chat';

			user = {
				username : data.username,
				avatar : data.avatar
			};
		};

		$('.chat .chat-field').on('keydown', function(e) {
			if(!(e.keyCode == 13 && !(e.shiftKey))) {
				return;
			}

			e.preventDefault();

			message_submit.call(this);
		});

		$('.chat-submit').on('click', function(e) {
			message_submit.call($('.chat .chat-field').get(0));
		});

		let message_submit = function(input) {
			websocket.send(JSON.stringify({
				action : "message",
				extra : {
					message : $(this).val()
				}
			}));

			$(this).val('');
		};

		let message_success = function(data) {
			let message_element = $('<div class="message"><div class="message-container"><div class="message-user-info"><img class="message-avatar" src="./assets/images/avatars/1.png" alt=""><div class="message-username"></div><div class="message-pubdate"></div></div><div class="message-content"></div></div></div>');

			message_element.find('.message-username').text(data.username);
			message_element.find('.message-avatar').attr('src', './assets/images/avatars/' + '1' + '.png'); // CUSTOM AVATAR
			message_element.find('.message-pubdate').livestamp(data.pubdate);
			message_element.find('.message-content').text(data.message);
			
			$('.messages-container').append(message_element);

			$('.messages').animate({
				scrollTop: $('.messages').prop("scrollHeight")
			}, 500);
		};

		let new_download = function(data) {
			let complete_download_element = $('<div class="download"><div class="download-container"><div class="download-name"></div><div class="download-owner"></div><div class="download-pubdate"></div><div class="download-size"></div><a class="download-action waves-effect waves-light btn light-blue"><i class="material-icons left">file_download</i>Télécharger</a></div></div>');
			
			$('.downloads-content').append(complete_download_element);

			complete_download_element.find('.download-name').text(data.file.name + data.file.ext);
			complete_download_element.find('.download-owner').text(data.user.username);
			complete_download_element.find('.download-pubdate').livestamp(data.file.pubdate);
			complete_download_element.find('.download-size').text(formatBytes(data.file.size));
			complete_download_element.find('.download-action').attr('href', 'download/?file=' + data.file.access + '&name=' + data.file.name + data.file.ext);
		}

		$("#signin_form").on('submit', function(e) {
			e.preventDefault();

			let username = $("#signin_username_field").val();
			let password = $("#signin_password_field").val();

			if(password === '') {
				websocket.send(JSON.stringify({
					action : "signup",
					extra : {
						username : username
					}
				}));

				return;
			}

			websocket.send(JSON.stringify({
				action : "signin",
				extra : {
					username : username,
					password : password
				}
			}));
		});

		$('.downloads-container')
			.on('dragover', function(e) {
				e.preventDefault();
				$(this).addClass('active');
			})
			.on('dragenter', function(e) {
				e.stopPropagation();
				e.preventDefault();
			})
			.on('dragleave', function(e) {
				e.stopPropagation();
				e.preventDefault();

				$(this).removeClass('active');
			})
			.on('drop', function(e) {
			e.preventDefault();
			e.stopPropagation();

			$(this).removeClass('active');

			let file = e.originalEvent.dataTransfer.files[0];

			upload_file(file);
		});

		$(document).on('drop', function(e) {
			e.preventDefault();
		});

		function upload_file(file) {
			$('.downloads-container').removeAttr('active');

			if(!file.type) {
				return;
			}

			let download_element = $('<div class="download"><div class="download-container"><div class="download-name"></div><div class="download-owner"></div><div class="download-size"></div><div class="loader download-loader"><div class="determinate" style="width: 0%"></div><div class="buffer" style="width: 0%"></div><div class="dashed"></div></div></div></div>');
			$('.downloads-content').append(download_element);

			download_element.find('.download-name').text(file.name);
			download_element.find('.download-owner').text(user.username);
			download_element.find('.download-size').text(formatBytes(file.size));

			let max_chunk_size = Math.pow(10, 3) * 32;
			let reader = new FileReader();

			let reader_callback = function() {
				let array = new Uint8Array(reader.result);

				let uploaded_chunks = -1;

				function upload_file_chunk() {
					websocket.send(array.slice(uploaded_chunks * max_chunk_size, uploaded_chunks * max_chunk_size + max_chunk_size));
				};

				let checksums = [];
				let max_chunks = Math.ceil(array.length / max_chunk_size);
				// for(let i = 0; i < Math.ceil(array.length / max_chunk_size); i++) {
				// 	checksums.push(md5(array.slice(i * max_chunk_size, i * max_chunk_size + max_chunk_size).join(',')));
				// }
				
				async(max_chunks, function(loop) {
					let i = loop.iteration();
					download_element.find('.download-loader').find('.buffer').css('width', (i + 1 * 100 / max_chunks) + '%');
					checksums.push(md5(array.slice(i * max_chunk_size, i * max_chunk_size + max_chunk_size).join(',')));
					loop.next();
				}, function() {
					websocket.send(JSON.stringify({
						action : "upload_init",
						extra : {
							file : {
								name : file.name,
								size : file.size,
								checksums : checksums
							}
						}
					}));

					console.log(checksums)
				});

				let message_upload_event = function(e) {
					let parsed_data = JSON.parse(e.data);

					let action = parsed_data.action;

					switch(action) {
						case "upload_wait_data":
							uploaded_chunks++;
							upload_file_chunk();
							download_element.find('.download-loader').find('.determinate').css('width', (((1 + uploaded_chunks) * 100) / max_chunks) + '%');
							break;

						case "upload_fragment_corrupted":
							uploaded_chunks--;
							upload_file_chunk();
							break;

						case "upload_abort":
							reader.removeEventListener('loadend', reader_callback);
							websocket.removeEventListener('message', message_upload_event);
							download_element.remove();
							break;

						case "upload_finished":
							reader.removeEventListener('loadend', reader_callback);
							websocket.removeEventListener('message', message_upload_event);
							download_element.remove();
							break;
					}
				};

				websocket.addEventListener('message', message_upload_event);
			};

			reader.addEventListener('loadend', reader_callback);

			reader.readAsArrayBuffer(file);
		};

		// $("#upload_file").on('change', function(e) {
		// 	let file = e.target.files[0];

		// 	let reader = new FileReader();
		// 	reader.addEventListener('loadend', function() {
		// 		let array = new Uint8Array(reader.result);

		// 		let uploaded_chunks = -1;
		// 		let file_upload = function() {
		// 			websocket.send(array.slice(uploaded_chunks * 16384, uploaded_chunks * 16384 + 16384));
		// 		};

		// 		let checksums = [];
		// 		for(let i = 0; i < Math.ceil(array.length / 16384); i++) {
		// 			checksums.push(md5(array.slice(i * 16384, i * 16384 + 16384)));
		// 		}

		// 		websocket.addEventListener('message', function(e) {
		// 			let parsed_data = JSON.parse(e.data);

		// 			let action = parsed_data.action;

		// 			switch(action) {
		// 				case "upload_wait_data":
		// 					uploaded_chunks++;
		// 					file_upload();
		// 					break
		// 				case "upload_fragment_corrupted" :
		// 					uploaded_chunks--;
		// 					file_upload();
		// 					break;
		// 			}
		// 		})

		// 		websocket.send(JSON.stringify({
		// 			action : "upload_init",
		// 			extra : {
		// 				file : {
		// 					name : file.name,
		// 					size : file.size,
		// 					checksums : checksums
		// 				}
		// 			}
		// 		}));
		// 	});

		// 	reader.readAsArrayBuffer(file);
		// });
	});
});