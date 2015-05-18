
var pdfRenderer = (function() {

	function render(lines, iframeId) {

		var doc = new PDFDocument();
		var stream = doc.pipe(blobStream());

		var fontSize = 10,
			titleSize = 24,
			artistSize = 16,
			headingSize = 12,
			tabSize = 9; 

		var regularFont = 'Helvetica';
		var boldFont = 'Helvetica-Bold';
		var tabFont = 'Courier';

		Chord.renderer = Chord.renderers.pdf;
		Chord.renderer.doc = doc;

		var renderedChords = false;

		function writeLine(font, size, text, options) {
			doc.font(font).fontSize(size).text(text, options);
		}

		processTextAndChordLines(lines);

		for (var i = 0; i < lines.length; i++) {
			var l = lines[i];
			if (l.type == lineType.text) {
				writeLine(regularFont, fontSize, l.text);
			} else if (l.type == lineType.chordLine) {
				writeLine(boldFont, fontSize, l.text);
			} else if (l.type == lineType.tabLine) {
				formatTabLine(l, true, false);
				writeLine(tabFont, tabSize, l.text);
			} else if (l.type == lineType.title) {
				writeLine(boldFont, titleSize, l.text, { align:'center'});
			} else if (l.type == lineType.artist) {
				writeLine(regularFont, artistSize, l.text, { align:'center'});
			} else if (l.type == lineType.heading) {
				writeLine(boldFont, headingSize, l.text);
			} else if (l.type == lineType.emptyLine) {
				doc.fontSize(fontSize);
				doc.moveDown();
			} else if (l.type == lineType.chordDef) {
				if (renderedChords) {
					continue;
				}
				doc.translate(doc.page.margins.left, doc.page.margins.top + titleSize + artistSize*2);
				renderChords(doc, lines);
				renderedChords = true;
				
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

	function processTextAndChordLines(lines) {
		var pairs = [];
		for (var i=0; i < lines.length; i++) {
			if (lines[i].type == lineType.chordLine && lines[i+1] && lines[i+1].type == lineType.text) {
				pairs.push({chords:lines[i], text:lines[i+1], parts : []});
			}
		}

		for (var i=0; i < pairs.length; i++) {
			var p = pairs[i];
			var text = p.text.text;
			var chords = p.chords.text;

			while (chords.length < text.length) {
				chords += ' ';
			}

			var chordParts = chords.match(/([\w]+ +)/g);
			var tpos = 0;

			for (var j=0; j < chordParts.length; j++) {
				var cp = chordParts[j];
				var tp = text.substr(tpos, cp.length);
				tpos += cp.length;
				p.parts.push({c:cp, t:tp});
				console.log(cp + '----' + tp);
			}
		}


	}

	function renderChords(doc, lines) {

		var p = doc.page, m = doc.page.margins;
		var availableWidth = p.width - m.left - m.right;
		var availableHeight = p.height - m.top - m.bottom;
		var sortedChords = getAllChordsSorted(lines);

		var chordSize = 2;
		if (sortedChords.length > 0) {
			var info = sortedChords[0].calculateDimensions(chordSize);
			var chordsPerLine = Math.floor(availableWidth/info.width);
		}

		var chordLineCounts = getChordsPerLine(chordsPerLine, sortedChords.length);


		for (var i = 0; i < chordLineCounts.length; i++) {
			var chordCount = chordLineCounts[i];
			var chords = sortedChords.splice(0, chordCount);
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

	function getAllChordsSorted(lines) {
		var chords = [];
		for (var i = 0; i < lines.length; i++) {
			var l = lines[i];
			if (l.type == lineType.chordDef) {
				for (var j=0; j < l.chords.length; j++) {
					var c = l.chords[j];
					c.sortRank = j*10 + i;
					chords.push(c);
				}
			}
		}
		chords.sort(function(a,b) {
			return a.sortRank-b.sortRank;
		});

		return chords;
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
		console.log(line.text);
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
