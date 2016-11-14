(function($) {
	$(document).ready(function() {
		let view = View.getInstance();

		update_moment();

		let socket = Socket.getInstance();
		socket.set(new WebSocket('ws://' + window.location.host + ':8080'));
		
		let user;

		$('#signin').hide();

		socket.ready(function() {
			$('#signin').show();
		});

		// SEND CREDENTIALS
		$('#signin_form').on('submit', function(e) {
			e.preventDefault();

			let username = $('#signin_username_field').val();
			let password = $('#signin_password_field').val();
			
			if(password === '') {
				socket.notify({
					action : "signup",
					extra : {
						username : username
					}
				});

				return;
			}

			socket.notify({
				action : "signin",
				extra : {
					username : username,
					password : password
				}
			});
		});

		// SIGN IN/UP
		socket.get().addEventListener('message', function(e) {
			let data = JSON.parse(e.data);

			switch(data.action) {
				case "signup_success":
				case "signin_success":
					Materialize.toast(Translate('view/connected'), 10000);
					view.setPage({ name : "chat", url : "chat/", showChatBar : true });
					view.update();

					user = new User(data.extra);

					break;
				
				case "signup_failed":
					if(data.extra.message === 'translate:user/missing_password') {
						$('.signin_password').removeClass('hide');
						return;
					}

					Materialize.toast(Translate(data.extra.message), 10000);

					break;
			}
		});

		// ERROR
		socket.get().addEventListener('message', function(e) {
			let parsed_data = JSON.parse(e.data);

			switch(parsed_data.action) {
				case "signout":
					Materialize.toast(Translate('view/disconnect'), 10000);
					view.setPage({ name : "signin", url : "signin/", showChatBar : false });
					view.update();
					break;
			}
		});

		socket.get().addEventListener('error', function(e) {
			Materialize.toast(Translate('view/server_error'));
			view.setPage({ name : "signin", url : "signin/", showChatBar : false });
			view.update();

			$('#signin').hide();
		});

		// MESSAGE
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

		function message_submit(input) {
			socket.notify({
				action : "message",
				extra : {
					message : $(this).val()
				}
			});

			$(this).val('');
		};

		socket.get().addEventListener('message', function(e) {
			let parsed_data = JSON.parse(data);

			switch(parsed_data.action) {
				case "message_success":
					let message_element = $('<div class="message"><div class="message-container"><div class="message-user-info"><img class="message-avatar" src="./assets/images/avatars/1.png" alt=""><div class="message-username"></div><div class="message-pubdate"></div></div><div class="message-content"></div></div></div>');

					message_element.find('.message-username').text(parsed_data.extra.username);
					message_element.find('.message-avatar').attr('src', '/assets/images/avatars/' + '1' + '.png'); // CUSTOM AVATAR
					message_element.find('.message-pubdate').livestamp(parsed_data.extra.pubdate);
					message_element.find('.message-content').text(parsed_data.extra.message);
					
					$('.messages-container').append(message_element);

					$('.messages').animate({
						scrollTop: $('.messages').prop("scrollHeight")
					}, 500);

					break;
			}
		});

		// DOWNLOAD
		function new_download(data) {
			let complete_download_element = $('<div class="download"><div class="download-container"><div class="download-name"></div><div class="download-owner"></div><div class="download-pubdate"></div><div class="download-size"></div><a class="download-action waves-effect waves-light btn light-blue"><i class="material-icons left">file_download</i>Télécharger</a></div></div>');
			
			$('.downloads-content').append(complete_download_element);

			complete_download_element.find('.download-name').text(data.file.name + data.file.ext);
			complete_download_element.find('.download-owner').text(data.user.username);
			complete_download_element.find('.download-pubdate').livestamp(data.file.pubdate);
			complete_download_element.find('.download-size').text(formatBytes(data.file.size));
			complete_download_element.find('.download-action').attr('href', '/download/?file=' + data.file.access + '&name=' + data.file.name + data.file.ext);
		};

		socket.get().addEventListener('message', function(e) {
			let parsed_data = JSON.parse(e.data);

			switch(parsed_data.action) {
				case "new_download":
					new_download(parsed_data.extra);
					break;
			}
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
			download_element.find('.download-owner').text(user.getUsername());
			download_element.find('.download-size').text(formatBytes(file.size));

			let max_chunk_size = Math.pow(10, 3) * 32;
			let reader = new FileReader();

			let reader_callback = function() {
				let array = new Uint8Array(reader.result);

				let uploaded_chunks = -1;

				function upload_file_chunk() {
					socket.get().send(array.slice(uploaded_chunks * max_chunk_size, uploaded_chunks * max_chunk_size + max_chunk_size));
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
					socket.notify({
						action : "upload_init",
						extra : {
							file : {
								name : file.name,
								size : file.size,
								checksums : checksums
							}
						}
					});
				});

				let message_upload_event = function(e) {
					let parsed_data = JSON.parse(e.data);

					let action = parsed_data.action;

					console.log(parsed_data);

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
							socket.get().removeEventListener('message', message_upload_event);
							download_element.remove();
							break;

						case "upload_finished":
							reader.removeEventListener('loadend', reader_callback);
							socket.get().removeEventListener('message', message_upload_event);
							download_element.remove();
							break;
					}
				};

				socket.get(0).addEventListener('message', message_upload_event);
			};

			reader.addEventListener('loadend', reader_callback);

			reader.readAsArrayBuffer(file);
		};
	});
})(jQuery);

function update_moment() {
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
}