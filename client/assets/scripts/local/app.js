$(document).ready(function() {
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
			message_element.find('.message-pubdate').text('now');
			message_element.find('.message-content').text(data.message);
			
			$('.messages-container').append(message_element);
		};

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

		$("#upload_file").on('change', function(e) {
			let file = e.target.files[0];

			let reader = new FileReader();
			reader.addEventListener('loadend', function() {
				let array = new Uint8Array(reader.result);

				let uploaded_chunks = -1;
				let file_upload = function() {
					websocket.send(array.slice(uploaded_chunks * 16384, uploaded_chunks * 16384 + 16384));
				};

				let checksums = [];
				for(let i = 0; i < Math.ceil(array.length / 16384); i++) {
					checksums.push(md5(array.slice(i * 16384, i * 16384 + 16384)));
				}

				websocket.addEventListener('message', function(e) {
					let parsed_data = JSON.parse(e.data);

					let action = parsed_data.action;

					switch(action) {
						case "upload_wait_data":
							uploaded_chunks++;
							file_upload();
							break
						case "upload_fragment_corrupted" :
							uploaded_chunks--;
							file_upload();
							break;
					}
				})

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
			});

			reader.readAsArrayBuffer(file);
		});
	});
});