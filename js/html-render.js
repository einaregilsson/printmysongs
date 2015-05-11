function render() {
	var lines = parse();
	renderChords(lines);
	renderSheet(lines);
}

function renderChords(lines) {
	$('#chords').html('');
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		if (line.type == CHORDDEF) {
			for (var j = 0; j < line.chords.length; j++) {
				var chord = line.chords[j];
				$('#chords').append(chord.getDiagram(options.chordSize, options.renderer));
			}
		}
	}

	//Fix the size of the song, to allow proper overflowing
	$('#song').css('height', ($('#paper-page').height() - $('#chords').height()) + 'px');
}

function renderSheet(lines) {
	
	var songDiv = '#song .first-col';
	$(songDiv).html('');
	var currentDiv;
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i];
		console.log(line.type + ' : ' + line.text);
		var endCurrentDiv = true;
		if (line.type == HEADING || line.type == TEXT || line.type == CHORDLINE) {
			currentDiv = currentDiv || $('<div />').addClass('song-part').appendTo(songDiv);
			endCurrentDiv = false;
		}
		
		if (line.type == CHORDDEF) {
			continue;
		} else if (line.type == EMPTYLINE && $(songDiv).html() != '') {
		
			if (lines[i-1] && lines[i-1].type == HEADING) {
				endCurrentDiv = false;
				currentDiv.append($('<br>'));
			} else {
				$(songDiv).append($('<br>'));
			}
		} else if (line.type == TITLE) {
			$('#sheet h1').html(line.text);
			$('title').html(line.text);
		} else if (line.type == ARTIST) {
			$('#sheet h2').html(line.text);
		} else if (line.type == TEXT) {
			$('<span />').addClass('songline').html(line.text).appendTo(currentDiv);
			currentDiv.append($('<br>'));
		} else if (line.type == CHORDLINE) {
			if (lines[i+1] && lines[i+1].type == TABLINE) {
				continue; //The tab will take this with it
			}
			$('<span />').addClass('chordline').html(line.text).appendTo(currentDiv);
			$(currentDiv).append($('<br>'));
		} else if (line.type == HEADING) {
			$('<h3>').html(line.text).appendTo(currentDiv)
		} else if (line.type == TABLINE) {
			var tabText = [];
			if (lines[i-1] && lines[i-1].type == CHORDLINE) {
				tabText.push(lines[i-1].text);
			}
			while (lines[i] && lines[i].type == TABLINE) {
				var isFirst = i == 0 || lines[i-1].type != TABLINE;
				var isLast = !lines[i+1] || lines[i+1].type != TABLINE;
				formatTabLine(lines[i], isFirst, isLast);
				tabText.push(lines[i].text);
				i++;
			}
			$('<div />').addClass('tabline').css('fontSize', options.tablatureSize + 'px').html(tabText.join('\n')).appendTo(songDiv);
		} else if (line.type == SEPERATOR) {
			if (i>0 && lines[i-1].type != HEADING){
				$('<span />').addClass('songline').html(line.text).appendTo(songDiv);
				$(songDiv).append($('<br>'));
			} else {
				endCurrentDiv = false;
			}
		}

		console.log('SONGDIV IS ' + $(songDiv).height() + ' , song is ' + $('#song').height());
		if ($(songDiv).height() > $('#song').height()) {
			currentDiv.remove();
			songDiv = '#song .second-col';
			currentDiv.appendTo(songDiv);
		}
		
		if (endCurrentDiv) {
			currentDiv = null;
		}
	}
	//console.log(output.join('\n'))
}

function formatTabLine(line, isFirstLine, isLastLine) {
	var subst;
	
	if (isFirstLine) {
		subst = {
			line 			: '&#9472;',
			singleStart 	: '&#9484;',
			doubleStart 	: '&#9555;',
			singleMiddle 	: '&#9516;',
			doubleMiddle 	: '&#9573;',
			singleEnd 		: '&#9488;',
			doubleEnd 		: '&#9558;'
		};
	} else if (isLastLine) {
		subst = {
			line 			: '&#9472;',
			singleStart 	: '&#9492;',
			doubleStart 	: '&#9561;',
			singleMiddle 	: '&#9524;',
			doubleMiddle 	: '&#9576;',
			singleEnd 		: '&#9496;',
			doubleEnd 		: '&#9564;'
		};
	} else {
		subst = {
			line 			: '&#9472;',
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
