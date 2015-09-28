$(document).ready(function(){

	function renderSheet() {
		var text = $('#source-sheet').val();
		var song = songParser.parse(text);
		pdfRenderer.render(song, 'rendered-sheet');
	}

	$('#source-sheet').on('input', renderSheet);

	$.get('example.txt', function(data) {
		$('#source-sheet').val(data);
		renderSheet();
	});
});
