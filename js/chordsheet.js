function render() {
	$('#chords').html('')
	var rx = Chord.regex
	var source = $('#source').val()
	var lines = source.split('\n')
	var output = []
	var chords = {}
	var canvas = document.createElement('canvas')
	for (var i = 0; i < lines.length; i++) {
		var line = lines[i]
		var chordLine = false
		while (s = rx.exec(line)) {
			chordLine = true
			var chord = new Chord(canvas, s[1], s[2], s[4])
			chords[s[1]] = 1
			$('#chords').append(chord.getImage({scale:scale, canvasScale:canvasScale}))
		}
		if (chordLine) {
			output.push('CHORDDEF')
		} else if (line.match(/^\s*(INTRO|VERSE|CHORUS|BRIDGE|PRE-?CHORUS)(\s*\d*):?\s*$/gi)) {
			output.push('HEADING')
		} else if (isTabLine(line) && isTabLine(lines[i+1]) && isTabLine(lines[i+2]) && isTabLine(lines[i+3]) ) {
			//At least a bass tab, 4 lines
			for (var j = 0; j < 4; j++) {
				output.push('TABLINE')
			}
			
			//Is it a guitar tab...
			if (isTabLine(lines[i+4]) && isTabLine(lines[i+5])) {
				output.push('TABLINE')
				output.push('TABLINE')
				i += 2
			}
			i += 3
		} else if (line.match(/^\s*-+\s*$/gi)) {
			output.push('SEPERATOR')
		} else if (isChordLine(chords, line)) {
			output.push('CHORDLINE')
		} else if (!line.replace(/^\s*|\s*$/g, '')) {
			output.push('EMPTYLINE')
		} else {
			output.push('TEXT')
		}
	}
	$('#song').html('')
	for (var i in lines) {
		console.log(output[i] + ' : ' + lines[i])
		if (output[i] == 'CHORDDEF') {
			continue
		} else if (output[i] == 'EMPTYLINE') {
			$('#song').append($('<br>'))
		} else if (output[i] == 'TEXT') {
			$('<span />').addClass('songline').html(lines[i]).appendTo('#song')
		} else if (output[i] == 'CHORDLINE') {
			$('<span />').addClass('chordline').html(lines[i]).appendTo('#song')
		} else if (output[i] == 'HEADING') {
			$('<h3>').html(lines[i]).appendTo('#song')
		} else if (output[i] == 'TABLINE') {
			$('<span />').addClass('tabline').html(lines[i].replace(/-/g, '&#9472;')).appendTo('#song')
		} else if (output[i] == 'SEPERATOR') {
			if (output[i-1] != 'HEADING')
			$('<span />').addClass('songline').html(lines[i]).appendTo('#song')
		}
		$('#song').append($('<br>'))
	}
	//console.log(output.join('\n'))
}

function isTabLine(line) {
	if (!line) {
		return false;
	}
	var hyphenCount = 0;
	for (var i = 0; i < line.length; i++) {
		if (line.charAt(i) == '-') {
			hyphenCount++
		}
	}
	
	return hyphenCount > 0.4*line.length && line.length > 10
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

$(document).ready(function(){
	if (!window.localStorage) {
		$('#show-my-sheets').hide()
	}
	$('#source').bind('input',render)

	//Enable offline...
	if (window.applicationCache) {
		$(window.applicationCache).bind('updateready', function() {
			 window.applicationCache.swapCache()
		})
	}
	
	
	$('#show-source').click(function() {
		var height = $('#song').height()
		$('#source').css('height', height).show()
		$('#song').hide()
		$('#menu button').removeClass('selected')
		$('#show-source').addClass('selected')
	})
	$('#show-sheet').click(function() {
		$('#source').hide()
		$('#song').show()
		$('#menu button').removeClass('selected')
		$('#show-sheet').addClass('selected')
	})
	$('#show-both').click(function() {
		$('#source').show()
		$('#song').show()
		$('#menu button').removeClass('selected')
		$('#show-both').addClass('selected')
	})
	
	$('#show-chords').click(function() {
		openDialog('#chord-settings', {title:'Chord Settings', width:400})
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
	
	var scaleSliderValue = parseInt(get('scale',10))
	var canvasScaleSliderValue = parseInt(get('canvasScale',10))
	window.scale = scaleSliderValue / 10.0
	window.canvasScale = canvasScaleSliderValue / 10.0
	$('#scale').html(scale)
	$('#canvas-scale').html(canvasScale)

	render()
	$('#scale-slider').slider({
		min: 1,
		max: 50,
		value: scaleSliderValue,
		slide: function(e,ui){
			var val = ui.value/10.0
			window.scale = val
			set('scale', ui.value)
			$('#scale').html(val)
			render()
		}
	})
	$('#canvas-scale-slider').slider({
		min: 1,
		max: 50,
		value: canvasScaleSliderValue,
		slide: function(e,ui){
			var val = ui.value/10
			window.canvasScale = val
			set('canvasScale', ui.value)
			$('#canvas-scale').html(val)
			render()
		}
	})
})
