function formatBytes(bytes,decimals) {
	if(bytes == 0) return '0 o';

	var k = 1000;

	var dm = decimals + 1 || 3;

	var sizes = ['o', 'ko', 'Mo', 'Go', 'To', 'Po', 'Eo', 'Zo', 'Yo'];

	var i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm).replace('.', ',')) + ' ' + sizes[i];
};