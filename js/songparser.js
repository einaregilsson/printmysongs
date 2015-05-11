
var songParser = (function() {

	function isTabLine(line) {
		if (!line) {
			return false;
		}
		var hyphenCount = 0;
		for (var i = 0; i < line.text.length; i++) {
			if (line.text.charAt(i) == '-') {
				hyphenCount++;
			}
		}
		if (hyphenCount > 10) {
			var isLine = hyphenCount > 0.4*line.text.length && line.text.length > 10;
			//alert(hyphenCount > 0.4*line.text.length && line.text.length > 10)
		}
		return hyphenCount > 0.4*line.text.length && line.text.length > 10;
	}

	function isChordLine(chordNames, line) {
		if (line.replace(/^\s*|\s*$/g, '') == '') {
			return false;
		}
		
		if (line.match(/\./)) {
			return false;
		}
		
		if (line.charAt(0) == '|') {
			return true;
		}
		
		var tokens = line.split(/\s+/g);
		var chordCount = 0;
		var possibleChordCount = 0;
		for (var i in tokens) {
			var token = tokens[i];
			if (chordNames[token]) {
				chordCount++;
			}
			if (token.match(/^[ABCDEFG]/)) {
				possibleChordCount++;
			}
		}
		
		if (chordCount >= 0.5*tokens.length) {		
			return true;
		}
		
		if (possibleChordCount >= tokens.length-1){
			return true;
		}
		return false;
	}
	
	function parseSong(text) {

		var tempLines = text.split(/\r?\n/);
		var lines = [];
		for (var i in tempLines) {
			lines.push({text:tempLines[i], type:null});
		}
		var chords = {};
		var foundTitle = false, foundArtist = false, startedChordLines = false;
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			var chordLine = false;
			while (s = Chord.searchRegex.exec(line.text)) {
				if (!line.chords) {
					line.chords = [];
				}
				chordLine = true;
				var chord = new Chord(s[1], s[2], s[3] || s[4]);
				chords[s[1]] = 1;
				line.chords.push(chord);
			}
			if (chordLine) {
				line.type = CHORDDEF;
				startedChordLines = true;
			} else if (!startedChordLines && !foundTitle && !line.text.match(/^\s*$/)) {
				line.type = TITLE;
				line.text = line.text.replace(/^\s*|\s*$/g, '').replace(/^(TITLE|SONG)\s*:\s*/i, '');
				foundTitle = true;
			} else if (!startedChordLines && !foundArtist && !line.text.match(/^\s*$/)) {
				line.type = ARTIST;
				line.text = line.text.replace(/^\s*|\s*$/g, '').replace(/^(ARTIST|BAND)\s*:\s*/i, '');
				foundTitle = true
			} else if (line.text.match(/^\s*((?:INTRO|OUTRO|VERSE|CHORUS|BRIDGE|PRE-?CHORUS)(?:\s*\d*):?)\s*(?:\[(.*?)\])?$/gi)) {
				line.text = RegExp.$1;
				line.note = RegExp.$2;
				line.type = HEADING;
			} else if (isTabLine(line) && isTabLine(lines[i+1]) && isTabLine(lines[i+2]) && isTabLine(lines[i+3]) ) {
				//At least a bass tab, 4 lines
				for (var j = 0; j < 4; j++) {
					lines[i+j].type = TABLINE;
				}
				
				//Is it a guitar tab...
				if (isTabLine(lines[i+4]) && isTabLine(lines[i+5])) {
					lines[i+4].type = TABLINE;
					lines[i+5].type = TABLINE;
					i += 2;
				}
				i += 3;
			} else if (line.text.match(/^\s*-+\s*$/gi)) {
				line.type = SEPERATOR;
			} else if (isChordLine(chords, line.text)) {
				line.type = CHORDLINE;
			} else if (!line.text.replace(/^\s*|\s*$/g, '')) {
				if (lines[i-1] && lines[i-1].type == EMPTYLINE) {
					line.type = EMPTYLINE //SKIP;
				} else {
					line.type = EMPTYLINE;
				}
			} else {
				line.type = TEXT;
			}
		}
		return lines;
	}

	return {
		parse : parseSong
	};
})();
