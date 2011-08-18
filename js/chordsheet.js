
var CHORDDEF  = ' CHORDDEF'
  , TITLE     = '    TITLE'
  , ARTIST    = '   ARTIST'
  , HEADING   = '  HEADING'
  , TABLINE   = '  TABLINE'
  , CHORDLINE = 'CHORDLINE'
  , SEPERATOR = 'SEPERATOR'
  , TEXT      = '     TEXT'
  , EMPTYLINE = 'EMPTYLINE'
  , SKIP      = '     SKIP'

function render() {
	$('#chords').html('')	
	var colCount = parseInt($('input[@name=columns]:checked').val())
	if (colCount == 1) {
		$('#song').removeClass('columns')
	} else { 
		$('#song').addClass('columns')
	}
	
	var rx = Chord.regex
	var source = $('#source').val()
	var tempLines = source.split(/\r?\n/)
	var lines = []
	for (var i in tempLines) {
		lines.push({text:tempLines[i]})
	}
	var chords = {}
	var foundTitle = false, foundArtist = false, startedChordLines = false
	var canvas = document.createElement('canvas')
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i]
		var chordLine = false
		while (s = rx.exec(line.text)) {
			chordLine = true
			var chord = new Chord(canvas, s[1], s[2], s[4])
			chords[s[1]] = 1
			$('#chords').append(chord.getImage({scale:options.chordDiagramSize/10.0, canvasScale:options.chordDiagramScale/10.0}))
		}
		if (chordLine) {
			line.type = CHORDDEF
			startedChordLines = true
		} else if (!startedChordLines && !foundTitle && !line.text.match(/^\s*$/)) {
			line.type = TITLE
			line.text = line.text.replace(/^\s*|\s*$/g, '').replace(/^(TITLE|SONG)\s*:\s*/i, '')
			foundTitle = true
		} else if (!startedChordLines && !foundArtist && !line.text.match(/^\s*$/)) {
			line.type = ARTIST
			line.text = line.text.replace(/^\s*|\s*$/g, '').replace(/^(ARTIST|BAND)\s*:\s*/i, '')
			foundTitle = true
		} else if (line.text.match(/^\s*((?:INTRO|OUTRO|VERSE|CHORUS|BRIDGE|PRE-?CHORUS)(?:\s*\d*):?)\s*(?:\[(.*?)\])?$/gi)) {
			line.text = RegExp.$1
			line.note = RegExp.$2
			line.type = HEADING
		} else if (isTabLine(line) && isTabLine(lines[i+1]) && isTabLine(lines[i+2]) && isTabLine(lines[i+3]) ) {
			//At least a bass tab, 4 lines
			//alert('HERE')
			for (var j = 0; j < 4; j++) {
				lines[i+j].type = TABLINE
			}
			
			//Is it a guitar tab...
			if (isTabLine(lines[i+4]) && isTabLine(lines[i+5])) {
				lines[i+4].type = TABLINE
				lines[i+5].type = TABLINE
				i += 2
			}
			i += 3
		} else if (line.text.match(/^\s*-+\s*$/gi)) {
			line.type = SEPERATOR
		} else if (isChordLine(chords, line.text)) {
			line.type = CHORDLINE
		} else if (!line.text.replace(/^\s*|\s*$/g, '')) {
			if (lines[i-1] && lines[i-1].type == EMPTYLINE) {
				line.type = EMPTYLINE //SKIP
			} else {
				line.type = EMPTYLINE
			}
		} else {
			line.type = TEXT
		}
	}
	$('#song').html('')
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i]
		console.log(line.type + ' : ' + line.text)
		if (line.type == CHORDDEF) {
			continue
		} else if (line.type == EMPTYLINE && $('#song').html() != '') {
			$('#song').append($('<br>'))
		} else if (line.type == TITLE) {
			$('#sheet h1').html(line.text)
			$('title').html(line.text)
		} else if (line.type == ARTIST) {
			$('#sheet h2').html(line.text)
		} else if (line.type == TEXT) {
			$('<span />').addClass('songline').html(line.text).appendTo('#song')
			$('#song').append($('<br>'))
		} else if (line.type == CHORDLINE) {
			if (lines[i+1] && lines[i+1].type == TABLINE) {
				continue //The tab will take this with it
			}
			$('<span />').addClass('chordline').html(line.text).appendTo('#song')
			$('#song').append($('<br>'))
		} else if (line.type == HEADING) {
			$('<h3>').html(line.text).appendTo('#song')
		} else if (line.type == TABLINE) {
			var tabText = []
			if (lines[i-1] && lines[i-1].type == CHORDLINE) {
				tabText.push(lines[i-1].text)
			}
			while (lines[i] && lines[i].type == TABLINE) {
				var isFirst = i == 0 || lines[i-1].type != TABLINE
				var isLast = !lines[i+1] || lines[i+1].type != TABLINE
				formatTabLine(lines[i], isFirst, isLast)
				tabText.push(lines[i].text)
				i++
			}
			$('<div />').addClass('tabline').css('fontSize', options.tablatureSize + 'px').html(tabText.join('\n')).appendTo('#song')
		} else if (line.type == SEPERATOR) {
			if (i>0 && lines[i-1].type != HEADING){
				$('<span />').addClass('songline').html(line.text).appendTo('#song')
				$('#song').append($('<br>'))
			}
		}
	}
	//console.log(output.join('\n'))
}

function formatTabLine(line, isFirstLine, isLastLine) {
	var subst
	
	if (isFirstLine) {
		subst = {
			line 			: '&#9472;',
			singleStart 	: '&#9484;',
			doubleStart 	: '&#9555;',
			singleMiddle 	: '&#9516;',
			doubleMiddle 	: '&#9573;',
			singleEnd 		: '&#9488;',
			doubleEnd 		: '&#9558;'
		}
	} else if (isLastLine) {
		subst = {
			line 			: '&#9472;',
			singleStart 	: '&#9492;',
			doubleStart 	: '&#9561;',
			singleMiddle 	: '&#9524;',
			doubleMiddle 	: '&#9576;',
			singleEnd 		: '&#9496;',
			doubleEnd 		: '&#9564;'
		}
	} else {
		subst = {
			line 			: '&#9472;',
			singleStart 	: '&#9500;',
			doubleStart 	: '&#9567;',
			singleMiddle 	: '&#9532;',
			doubleMiddle 	: '&#9579;',
			singleEnd 		: '&#9508;',
			doubleEnd 		: '&#9570;'
		}
	}
	
	line.text = line.text.replace(/^\s*([EADGBE])?\|\|/i, '$1' + subst.doubleStart).replace(/^\s*([EADGBE])?\|/i, '$1' + subst.singleStart)
	line.text = line.text.replace(/\|\|\s*$/, subst.doubleEnd).replace(/\|\s*$/, subst.singleEnd)
	line.text = line.text.replace(/\|\|/, subst.doubleMiddle).replace(/\|/, subst.singleMiddle)
	line.text = line.text.replace(/-/g, subst.line)
}

function isTabLine(line) {
	if (!line) {
		return false;
	}
	var hyphenCount = 0;
	for (var i = 0; i < line.text.length; i++) {
		if (line.text.charAt(i) == '-') {
			hyphenCount++
		}
	}
	if (hyphenCount > 10) {
		var isLine = hyphenCount > 0.4*line.text.length && line.text.length > 10
		//alert(hyphenCount > 0.4*line.text.length && line.text.length > 10)
	}
	return hyphenCount > 0.4*line.text.length && line.text.length > 10
}

function isChordLine(chordNames, line) {
	if (line.replace(/^\s*|\s*$/g, '') == '') {
		return false
	}
	
	if (line.match(/\./)) {
		return false
	}
	
	if (line.charAt(0) == '|') {
		return true
	}
	
	var tokens = line.split(/\s+/g)
	var chordCount = 0
	var possibleChordCount = 0
	for (var i in tokens) {
		var token = tokens[i]
		if (chordNames[token]) {
			chordCount++
		}
		if (token.match(/^[ABCDEFG]/)) {
			possibleChordCount++
		}
	}
	
	console.log('-----')
	console.log(line)
	console.log(chordCount)
	console.log(possibleChordCount)
	if (chordCount >= 0.5*tokens.length) {
		
		return true
	}
	
	if (possibleChordCount >= tokens.length-1){
		return true
	}
	return false
}

function get(key, defaultVal) {
	if (!window.localStorage || !window.localStorage[key]) {
		return defaultVal
	}
	return localStorage[key]
}

function set(key, value) {
	if (!window.localStorage) {
		window.localStorage = {}
	}
	localStorage[key] = value
}

function openDialog(id, options) {
	options.draggable = false;
	options.resizable = false;
	$('.popup').dialog('close')
	$(id).dialog(options)
}

function showSource() {
	var height = $('#song').height()
	$('#source').css('height', height).show().focus()
	$('#song').hide()
	$('#menu button').removeClass('selected')
	$('#show-source').addClass('selected')
}

function showSheet() {
	$('#source').hide()
	$('#song').show()
	$('#menu button').removeClass('selected')
	$('#show-sheet').addClass('selected')
}

$(document).ready(function(){

	window._gaq = [['_setAccount', 'UA-5098292-9'],['_trackPageview']]

	//Get external scripts
	$.getScript('https://apis.google.com/js/plusone.js')
	$.getScript('http://platform.twitter.com/widgets.js')
	$.getScript('http://www.google-analytics.com/ga.js')


	if (!window.localStorage) {
		$('#show-my-sheets').hide()
	}
	$('#source').bind('input',render)
	$('input[name="columns"]').click(render)

	//Enable offline...
	if (window.applicationCache) {
		$(window.applicationCache).bind('updateready', function() {
			 window.applicationCache.swapCache()
		})
	}
	
	
	$('#show-source').click(showSource)
	$('#show-sheet').click(showSheet)
	
	$(document).keydown(function(e) {
		if (e.which == 77 && e.ctrlKey) {
			if ($('#source').css('display') == 'none') {
				showSource()
			} else {
				showSheet()
			}
		}
	})	
	
	$('#show-layout').click(function() {
		openDialog('#layout', {title:'Layout Options', width:500})
	})
	
	$('#show-about').click(function() {
		openDialog('#about', {title:'About Pimp My Chord Sheet', width:700})
	})
	
	$('#print-sheet').click(function() {
		print()
	})
	
	$('#show-save').click(function() {
		openDialog('#save-sheet', {
			title:'Save sheet', 
			width:500,
			buttons : [
				{
					text:"Save",
					click:function() {
						var filename = $('#save-sheet input').val()
						var text = $('#source').val()
						localStorage[filename] = text
						$(this).close()
					}
				}
			]
		});
	})
	
	window.options = {
		chordDiagramSize : 10,
		chordDiagramScale : 10,
		tablatureSize : 12
	}

	window.ranges = {
		chordDiagramSize : [1,50],
		chordDiagramScale : [1,50],
		tablatureSize : [6,20]
	}
	
	$.each( options, function(optName, value){
		options[optName] = parseInt(get(optName, value))
		$('#'+optName+' h4 span').html(options[optName])

		$('#' + optName + ' .slider').slider({
			min: ranges[optName][0],
			max: ranges[optName][1],
			value: options[optName],
			slide: function(e,ui){
				options[optName] = ui.value
				set(optName, ui.value)
				$('#'+optName + ' h4 span').html(ui.value)
				render()
			}
		})
	})

	render()
})
