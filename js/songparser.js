
var lineType = {
	title : 'title',
	artist : 'artist',
	heading : 'heading',
	tabLine : 'tabLine',
	chordLine : 'chordLine',
	chordAndTextLine : 'chordAndTextLine',
	seperator : 'seperator',
	text : 'text',
	emptyLine : 'emptyLine',
	skip : 'skip'
};

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

	function combineChordAndTextLine(chordLine, textLine) {

		//Lets make the lines the same length, to make things easier...
		while (chordLine.text.length > textLine.text.length) {
			textLine.text += ' ';
		}
		while (textLine.text.length > chordLine.text.length) {
			chordLine.text += ' ';
		}
		var chordParts = chordLine.text.match(/[^ ]+|\s+/g);


		var parts = [];
		var index = 0;
		for (var i=0; i < chordParts.length; i++) {
			var length = chordParts[i].length;
			var text = textLine.text.substr(index, length);
			index += length;
			parts.push({c:chordParts[i], t:text, length:length, isChord:chordParts[i].charAt(0) != ' '});
		}

		return {
			parts : parts,
			type : lineType.chordAndTextLine
		};
	}

	function parseSong(text) {

		var song = {
			title:null,
			artist:null,
			chords:[],
			lines: []
		};

		var tempLines = text.split(/\r?\n/);
		var lines = [];
		for (var i in tempLines) {
			lines.push({text:tempLines[i], type:null, chords:[]});
		}
		var chords = {};
		var foundTitle = false, foundArtist = false, startedChordLines = false;
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			var chordLine = false;
			while (s = Chord.searchRegex.exec(line.text)) {
				chordLine = true;
				var chord = new Chord(s[1], s[2], s[3] || s[4]);
				chords[s[1]] = 1;
				line.chords.push(chord);
			}
			if (chordLine) {
				line.type = lineType.chordDef;
				startedChordLines = true;
			} else if (!startedChordLines && !foundTitle && !line.text.match(/^\s*$/)) {
				song.title = line.text.replace(/^\s*|\s*$/g, '').replace(/^(TITLE|SONG)\s*:\s*/i, '');
				foundTitle = true;
			} else if (!startedChordLines && !foundArtist && !line.text.match(/^\s*$/)) {
				song.artist = line.text.replace(/^\s*|\s*$/g, '').replace(/^(ARTIST|BAND)\s*:\s*/i, '');
				foundArtist = true
			} else if (line.text.match(/^\s*((?:INTRO|OUTRO|VERSE|CHORUS|BRIDGE|PRE-?CHORUS)(?:\s*\d*):?)\s*(?:\[(.*?)\])?$/gi)) {
				line.text = RegExp.$1;
				line.note = RegExp.$2;
				line.type = lineType.heading;
			} else if (isTabLine(line) && isTabLine(lines[i+1]) && isTabLine(lines[i+2]) && isTabLine(lines[i+3]) ) {
				//At least a bass tab, 4 lines
				for (var j = 0; j < 4; j++) {
					lines[i+j].type = lineType.tabLine;
				}
				
				//Is it a guitar tab...
				if (isTabLine(lines[i+4]) && isTabLine(lines[i+5])) {
					lines[i+4].type = lineType.tabLine;
					lines[i+5].type = lineType.tabLine;
					i += 2;
				}
				i += 3;
			} else if (line.text.match(/^\s*-+\s*$/gi)) {
				line.type = lineType.seperator;
			} else if (isChordLine(chords, line.text)) {
				line.type = lineType.chordLine;
			} else if (!line.text.replace(/^\s*|\s*$/g, '')) {
				if (lines[i-1] && lines[i-1].type == lineType.emptyLine) {
					line.type = lineType.emptyLine //SKIP;
				} else {
					line.type = lineType.emptyLine;
				}
			} else {
				line.type = lineType.text;
			}
		}

		//Second pass, combine chord and text lines that are together...
		var combinedLines = [];
		for (var i=0; i< lines.length; i++) {
			var l = lines[i];
			if (l.type === null ){
				continue; //Artist and title, skip
			}

			if (l.type == lineType.chordLine) {
				var nextLine = lines[i+1];
				if (nextLine && nextLine.type == lineType.text) {
					combinedLines.push(combineChordAndTextLine(l, nextLine));
					i++; //Skip the next text line
				} else {
					combinedLines.push(l);
				}
			} else {
				combinedLines.push(l);
			}
		}

		//Third pass, move chords into .chords array in column order...
		for (var i = 0; i < combinedLines.length; i++) {
			var l = combinedLines[i];
			if (l.chords && l.chords.length > 0) {
				for (var j=0; j < l.chords.length; j++) {
					var c = l.chords[j];
					c.sortRank = j*10 + i;
					song.chords.push(c);
				}
			} else {
				delete l.chords;
				song.lines.push(l);
			}
		}
		song.chords.sort(function(a,b) {
			return a.sortRank-b.sortRank;
		});

		//Fourth pass, clean out empty lines at start...
		while (song.lines[0] && song.lines[0].type == lineType.emptyLine) {
			song.lines.shift();
		}

		return song;
	}

	return {
		parse : parseSong
	};
})();
