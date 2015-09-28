
var pdfRenderer = (function() {

	var fontSize = 10,
		titleSize = 24,
		artistSize = 16,
		headingSize = 12,
		tabSize = 9; 

	var regularFont = 'Helvetica';
	var boldFont = 'Helvetica-Bold';
	var tabFont = 'Courier';

	function box(doc, x1, y1, width, height) {
		return;
		doc.moveTo(x1, y1);
		doc.lineTo(x1+width, y1);
		doc.lineTo(x1+width, y1+height);
		doc.lineTo(x1, y1+height);
		doc.lineTo(x1, y1);
		doc.stroke();
	}

	function render(song, iframeId) {

		var doc = new PDFDocument();
		var stream = doc.pipe(blobStream());
		Chord.renderer = Chord.renderers.pdf;
		Chord.renderer.doc = doc;

		function writeLine(font, size, text, options) {

			doc.font(font).fontSize(size);
			box(doc, doc.x, doc.y, doc.widthOfString(text), doc.currentLineHeight(true))
			doc.text(text, options);
		}

		if (song.title) {
			writeLine(boldFont, titleSize, song.title, { align:'center'});
		}
		if (song.artist) {
			writeLine(regularFont, artistSize, song.artist, { align:'center'});
		}
		
		doc.translate(doc.page.margins.left, doc.page.margins.top + titleSize + artistSize*2);
		renderChords(doc, song.chords);

		//Now we're down to the song itself...
		for (var i = 0; i < song.lines.length; i++) {
			var l = song.lines[i];
			if (l.type == lineType.text) {
				writeLine(regularFont, fontSize, l.text);
			} else if (l.type == lineType.chordLine) {
				writeLine(boldFont, fontSize, l.text.replace(/ /g, '   ')); //Triple blank spaces in all-chord lines
			} else if (l.type == lineType.chordAndTextLine) {
				writeChordAndTextLines(doc, l);
			} else if (l.type == lineType.tabLine) {
				formatTabLine(l, true, false);
				writeLine(tabFont, tabSize, l.text);
			} else if (l.type == lineType.heading) {
				writeLine(boldFont, headingSize, l.text);
			} else if (l.type == lineType.emptyLine) {
				doc.fontSize(fontSize);
				doc.moveDown();
			} else if (l.type == lineType.seperator) {
				//Do nothing
			}
		}
		doc.save()
		   
		doc.end();
		stream.on('finish', function() {
		  	document.getElementById(iframeId).src = stream.toBlobURL('application/pdf');
		});
	}

	function writeChordAndTextLines(doc, line) {
		doc.font(regularFont).fontSize(fontSize);
		var wholeText = '';

		console.log('START X IS ' + doc.x);
		var p0 = line.parts[0];
		function chordWidth(c) {
			doc.font(boldFont);
			return doc.widthOfString(c);
		}
		function textWidth(t) {
			doc.font(regularFont);
			return doc.widthOfString(t);
		}

		//Chord starts the line, offset the text!
		if (p0.t.match(/^\s+$/) && p0.isChord) {
			while (textWidth(p0.t) < chordWidth(p0.c)) {
				p0.t = ' ' + p0.t;
			}
		}

		doc.font(regularFont);
	
		var x = doc.x;
		for (var i=0; i < line.parts.length; i++) {
			var p = line.parts[i];
			if (p.isChord) {
				p.cpos = doc.widthOfString(wholeText);
				console.log('Set ' + p.c + ' at ' + p.cpos + ', which is width of ' + wholeText);
			}
			wholeText += p.t;
		}

		doc.font(boldFont).fontSize(fontSize);
		for (var i=0; i < line.parts.length; i++) {
			var p = line.parts[i];
			if (p.isChord) {
				//console.log('Setting chord ' + p.c + ' at ' + p.cpos);
				doc._fragment(p.c, p.cpos, doc.y, {});
			}
		}

		doc.moveDown();
		doc.font(regularFont);
		doc._fragment(wholeText, doc.x, doc.y, {});

		doc.moveDown();
	}
	function createSongParts(lines) {
		var parts = [];
		var currentPart = null; 
		for (var i=0; i < lines.length; i++) {

		}
	}

	function renderChords(doc, chords) {

		var p = doc.page, m = doc.page.margins;
		var availableWidth = p.width - m.left - m.right;
		var availableHeight = p.height - m.top - m.bottom;

		var chordSize = 2;
		if (chords.length > 0) {
			var info = chords[0].calculateDimensions(chordSize);
			var chordsPerLine = Math.floor(availableWidth/info.width);
		}

		var chordLineCounts = getChordsPerLine(chordsPerLine, chords.length);


		for (var i = 0; i < chordLineCounts.length; i++) {
			var chordCount = chordLineCounts[i];
			var chords = chords.splice(0, chordCount);
			var totalWidth = chords.length*info.width;
			var startX = (availableWidth-totalWidth)/2;
			doc.save();
			doc.translate(startX, i*info.height);
			for (var j = 0; j < chords.length; j++) {
				var c = chords[j];
				c.renderer = Chord.renderers.pdf;
				c.draw(chordSize);
				doc.translate(info.width, 0)
			}
			doc.restore();
		}

		//Push the text position below the chords
		doc.text('', 0, info.height*chordLineCounts.length);
	}

	function getChordsPerLine(chordsPerLine, chordCount) {
		var wholeLines = Math.floor(chordCount / chordsPerLine);
		var chordsOnLastLine = chordCount % chordsPerLine;

		if (chordsOnLastLine == 0) {
			var lines = [];
			for (var i = 0; i < wholeLines; i++) {
				lines.push(chordsPerLine);
			}
			return lines;
		}

		while (chordsOnLastLine + wholeLines < chordsPerLine) {
			chordsPerLine--;
			chordsOnLastLine += wholeLines;
		}

		var lines = [chordsOnLastLine];
		for (var i = 0; i < wholeLines; i++) {
			lines.push(chordsPerLine);
		}

		return lines;
	}

	function formatTabLine(line, isFirstLine, isLastLine) {
		var subst;
		return;
		
		if (isFirstLine) {
			subst = {
				line 			: '─',
				singleStart 	: '&#9484;',
				doubleStart 	: '&#9555;',
				singleMiddle 	: '&#9516;',
				doubleMiddle 	: '&#9573;',
				singleEnd 		: '&#9488;',
				doubleEnd 		: '&#9558;'
			};
		} else if (isLastLine) {
			subst = {
				line 			: '─',
				singleStart 	: '&#9492;',
				doubleStart 	: '&#9561;',
				singleMiddle 	: '&#9524;',
				doubleMiddle 	: '&#9576;',
				singleEnd 		: '&#9496;',
				doubleEnd 		: '&#9564;'
			};
		} else {
			subst = {
				line 			: '─',
				singleStart 	: '&#9500;',
				doubleStart 	: '&#9567;',
				singleMiddle 	: '&#9532;',
				doubleMiddle 	: '&#9579;',
				singleEnd 		: '&#9508;',
				doubleEnd 		: '&#9570;'
			};
		}
		
		line.text = line.text.replace(/^\s*([EADGBE])?\|\|/i, '$1' + subst.doubleStart).replace(/^\s*([EADGBE])?\|/i, '$1' + subst.singleStart);
		line.text = line.text.replace(/\|\|\s*$/, subst.doubleEnd).replace(/\|\s*$/, subst.singleEnd);
		line.text = line.text.replace(/\|\|/, subst.doubleMiddle).replace(/\|/, subst.singleMiddle);
		line.text = line.text.replace(/-/g, subst.line);
	}

	Chord.renderers.pdf = {
		doc : null,
	    init : function(info) {
	    	this.info = info;
	    	var d = this.doc;
	        d.fillColor('black');

	        d.lineJoin('miter');
	        d.lineWidth(info.lineWidth);
	        d.lineCap('square');
	        d.strokeColor('black');

	    },
	    
	    line : function(x1,y1,x2,y2,width,cap) {
	        var d = this.doc;
	        d.save();
	        if (width) {
	            d.lineWidth(width);
	        }
	        d.lineCap(cap || 'square');
	        d.moveTo(x1,y1);
	        d.lineTo(x2,y2);
	        d.stroke();
	        d.restore();
	    },
	    
	    text : function(x,y,text,font,size,baseline,align) {
	        var d = this.doc;
	        d.font('Helvetica');
	        d.fontSize(size);

	        if (baseline == 'bottom') {
	        	y -= size;
	        } else if (baseline == 'middle') {
	        	y -= (size/2);
	        }
	        var width = d.widthOfString(text);
	        if (align == 'center') {
	        	x -= (width/2);
	        } else if (align == 'right') {
	        	x -= width;
	        }

	        d.text(text,x,y);
	    },
	    
	    rect : function(x,y,width,height, lineWidth) {
	        this.doc.rect(x-lineWidth/2.0,y-lineWidth/2.0,width+lineWidth,height+lineWidth).fill();
	    },
	    
	    circle : function(x,y,radius, fillCircle, lineWidth) {
	        var d = this.doc;;
	        d.circle(x,y,radius);
	
	        if (fillCircle) {
	            d.fill();
	        } else {
	            d.lineWidth(lineWidth);
	            d.stroke();
	        }
	    },
	    
	    diagram : function() {
	    	return null;
	    }
	};



	return {
		render : render
	};



})();
