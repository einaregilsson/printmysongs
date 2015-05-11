$(document).ready(function(){

	function renderSheet() {
		var text = $('#source-sheet').val();
		var lines = songParser.parse(text);
		pdfRenderer.render(lines, 'rendered-sheet');
	}

	$('#source-sheet').on('input', renderSheet);

	$.get('example.txt', function(data) {
		$('#source-sheet').val(data);
		renderSheet();
	});
});
