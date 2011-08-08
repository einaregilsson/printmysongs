function render() {
	$('#chords').html('')
	var rx = Chord.regex
	var source = $('#source').val()
	var s
	while (s = rx.exec(source)) {
		var canvas = document.createElement('canvas')
		var chord = new Chord(canvas, s[1], s[2], s[4])
		$('#chords').append(chord.getImage({scale:scale, canvasScale:canvasScale}))
	}
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

function openDialog(id, title, width) {
	$('.popup').dialog('close')
	$(id).dialog({
		title : title,
		draggable : false,
		resizable : false,
		modal : false,
		width : width + 'px'
	})
}

$(document).ready(function(){
	if (!window.localStorage) {
		$('#show-my-sheets').hide()
	}
	$('#source').keyup(render)

	$('#show-source').click(function() {
		$('#source').show()
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
	
	$.get('css/chordsheet.css', function(data) {
		window.css = data
	})
	
	$('#show-chords').click(function() {
		//openDialog('#chord-settings', 'Chord Settings', 400)
		var sheet = $('#sheet').html()
		var html = '<!DOCTYPE html><html><head><style type="text/css">' + css + '</style></head><body><div id="sheet">'
			+ sheet + '</div></body></html>'
			
		$('<a/>', {
			href : 'data:text/html,' + html
		}).html('TESTIT').appendTo('body')
	})
	$('#show-about').click(function() {
		openDialog('#about', 'About Pimp My Chord Sheet', 700)
	})
	
	$('#print-sheet').click(function() {
		print()
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
