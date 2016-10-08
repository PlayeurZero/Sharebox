$(document).ready(function() {
	$(".button-collapse").sideNav();

	let websocket = new WebSocket('ws://localhost:8080');

	websocket.addEventListener('open', function() {
		websocket.addEventListener('message', function(e) {
			let data = JSON.parse(e.data);
		});

		$("#signin_form").on('submit', function(e) {
			e.preventDefault();

			websocket.send(JSON.stringify({
				action : "signin",
				extra : {
				username : $("#signin_username_field").val(),
				password : $("#signin_password_field").val()
				}
			}));
		});

		$("#upload_file").on('change', function(e) {
			let file = e.target.files[0];

			let reader = new FileReader();
			reader.addEventListener('loadend', function() {
				let array = new Uint8Array(reader.result);

				// function upload() {
				// 	// for(let chunk of split_array) {
				// 	// 	websocket.send(chunk);
				// 	// }
				// };

				let uploaded_chunks = -1;
				let file_upload = function() {
					// console.log(md5(split_array[uploaded_chunks]));
					// console.log(md5(array.slice(uploaded_chunks * 16384, uploaded_chunks + 16384)));
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

		/*$('#upload_file').on('change', function(e) {
			let file = e.target.files[0];
			// let max_chunk_size = Math.pow(2, 10) * 16;

			var reader = new FileReader();

			reader.addEventListener('load', function() {
				let array = new Uint8Array(reader.result);
				let split_array = [];

				let i = 0;
				let tmp = array.slice(0, 16384);
				while(tmp.length > 0) {
					split_array.push(tmp);

					tmp = array.slice(i, i + 16384);
					i += 16384;
				}

				// xxx = new Uint8Array(reader.result);
				// let j = 0;
				// for(a of split_array) {
				// 	for(b of a) {
				// 		xxx[xxx.length] = a;
				// 	}
				// }

				$('#upload1').on('click', function() {
					console.log('oui');
					websocket.send(JSON.stringify({
						action : 'upload_init',
						extra : {
							size : array.byteLength
						}
					}));
				});

				$('#upload2').on('click', function() {
					// websocket.send(JSON.stringify({
					// 	action : 'upload_submit'
					// }));

					setTimeout(function() {
						websocket.send(JSON.stringify({
							action : 'upload_submit'
						}));
					}, 2000);

					upload();
				});

				function upload() {
					for(let chunk of split_array) {
						websocket.send(chunk);
					}
				};

				// upload();
				
				// websocket.send(array);
			});

			reader.readAsArrayBuffer(file);
		});*/
	});
});