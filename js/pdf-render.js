
var pdfRenderer = (function() {

	function render(lines, iframeId) {

		var doc = new PDFDocument();
		var stream = doc.pipe(blobStream());

		var iframe = document.createElement('iframe');
		var fontSize = 10,
			titleSize = 24,
			artistSize = 16,
			headingSize = 14; 
		var regularFont = 'Helvetica';
		var boldFont = 'Helvetica-Bold';
		for (var i = 0; i < lines.length; i++) {
			var l = lines[i];
			if (i > 10) doc.moveTo(300, 300);
			if (l.type == lineType.text) {
				doc.font(regularFont).fontSize(fontSize).text(l.text);
			} else if (l.type == lineType.chordLine) {
				doc.font(boldFont).fontSize(fontSize).text(l.text);
			} else if (l.type == lineType.title) {
				doc.font(boldFont).fontSize(titleSize).text(l.text, { align:'center'});
			} else if (l.type == lineType.artist) {
				doc.fontSize(artistSize).text(l.text, { align:'center'});
			} else if (l.type == lineType.heading) {
				doc.font(boldFont).fontSize(headingSize).text(l.text);
			} else if (l.type == lineType.emptyLine) {
				doc.fontSize(fontSize);
				doc.moveDown();
			} else if (l.type == lineType.seperator) {
				//Do nothing
			}

		}
		   
		// some vector graphics
		doc.save()
		  //lineTo(100, 250)
		  // .lineTo(200, 250)
		  // .fill("#FF3300");
		   
		//doc.circle(280, 200, 50)
		  // .fill("#6600FF");
		   
		// an SVG path
		//doc.scale(0.6)
		//   .translate(470, 130)
		//   .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
		//   .fill('red', 'even-odd')
		//   .restore();
		   
		// and some justified text wrapped into columns
		//doc.text('And here is some wrapped text...', 100, 300)
		//   .font('Times-Roman', 13)
		//   .moveDown()
		//   .text("lorem", {
		//     width: 412,
		//     align: 'justify',
		//     indent: 30,
		//     columns: 2,
		//     height: 300,
		//     ellipsis: true
		//   });
		   
		// end and display the document in the iframe to the right
		doc.end();
		stream.on('finish', function() {
		  document.getElementById(iframeId).src = stream.toBlobURL('application/pdf');
		});

	}

	return {
		render : render
	};
})();
