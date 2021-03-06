function ChatWorkBox(params) {
    this.rt = params.rt
    this.div = params.div
	this.meme = params.data || {
        "type": "CHAT_WORK_BOX",
        "layers": [],
	}

    this.mode = "DOODLE"
    this.remoteMode = "DOODLE"

	this.setupControls()

	this.cursor = {color: "red", width: 20}
	this.remoteCursor = {color: "green", width: 20}
	
    this.setPen()
    this.setRemotePen({color: "red", width: 20, type: "DOODLE"})

	this.player = new OMemePlayer({div: this.div})

	this.player.load(this.meme)
	
	this.player.cursors.push(this.cursor)
	this.player.cursors.push(this.remoteCursor)

    this.setupDropBackground()
    this.setupCanvasEvents()
    this.setupSocketEvents()

    this.player.draw()
}

// Dec 27, 2020, copied, pasted, and trimmed from meme creator

ChatWorkBox.prototype.setPen = function () {
    if (this.mode === "DOODLE") {
        this.preview = {
            type: "DOODLE", 
            color: this.colorPicker.value, 
            width: this.sizePicker.value,
            xyt: []
        }
    }
    else if (this.mode === "RECTANGLE") {
        this.preview = {
            type: "RECTANGLE", 
            color: this.colorPicker.value, 
            width: this.sizePicker.value,
            x:0, y:0, w:0, h:0
        }
	}
	this.cursor.color = this.preview.color
	this.cursor.width = this.preview.width
	this.cursor.mode = this.mode
    this.send("doodleSet", {type: this.preview.type, color: this.colorPicker.value, width: this.sizePicker.value})
}

ChatWorkBox.prototype.setRemotePen = function (data) {
	if (data) {
		this.lastRemotePen = data
	}
	else {
		data = this.lastRemotePen
	}
console.log(data)
    if (data.type === "DOODLE") {
        this.remotePreview = {
            type: "DOODLE", 
            color: data.color, 
            width: data.width,
            xyt: []
        }
    }
    else if (data.type === "RECTANGLE") {
        this.remotePreview = {
            type: "RECTANGLE", 
            color: data.color, 
            width: data.width,
            x:0, y:0, w:0, h:0
        }
    }
}

ChatWorkBox.prototype.setupDropBackground = function () {

	var dropZone = this.player.canvas
	dropZone.ondragover = (e) => {
		e.preventDefault()
		dropZone.classList.add("drop-zone-hover")
	}
	dropZone.ondragleave = (e) => {
		e.preventDefault()
		dropZone.classList.remove("drop-zone-hover")
	}
	dropZone.ondrop = async (e) => {
		e.preventDefault()
		dropZone.classList.remove("drop-zone-hover")

		var items = e.dataTransfer.items

        // we should have a teacher if we're this far, and only the teacher for now should be uploading
        handleDroppedItems(items)
	}

	var handleDroppedItems = (items) => {
		for (var i = 0; i < items.length; i++) {
			if (items[i].kind === "file") {
				handleDroppedItem(items[i])
			}
			else if (items[i].type === "text/uri-list") {
				items[i].getAsString(s => handleDroppedURI(s))
			}
		}
	}

	var handleDroppedItem = (item) => {
		if (!item.type.startsWith("image/")) {
			console.log("user dropped non-image")
			return
		}

		var file = item.getAsFile()

		//statusDiv.innerHTML = "Uploading..."
		
		var fd = new FormData();
		fd.append('setId', this.meme.id);
		fd.append('file', file);
		fd.append('filename', file.name);
		
		omg.server.postHTTP("/upload", fd, (res)=>{
			
			//todo statusDiv.innerHTML = res.success ? 
			//	"<font color='green'>Uploaded</font>" : ("<font color='red'>Error</font> " + res.error)

			if (res && res.success) {
				this.addBackground({type: "IMAGE", url: window.location.origin + res.filename}, true)
			}
		});
	}

	var handleDroppedURI = (uri) => {

		this.addBackground({type: "IMAGE", url: uri}, true)

		//todo, what if this is a sound? or script?
		/*omg.server.getHTTP("/util/mime-type?uri=" + encodeURIComponent(uri), res => {
			var media = {
				mimeType: res.mimeType, 
				url: uri, 
				name: makeMediaName(uri)
			}
		})*/    
	}
}


ChatWorkBox.prototype.addBackground = function (thing, resize, fromRemote) {

	this.meme.background = {thing} 
	
	this.player.loadBackground(img => {
		if (resize) {
            this.player.meme.width = img.width
            this.player.meme.height = img.height
			this.player.sizeCanvas()
		}
		this.player.draw()
	})

	if (!fromRemote) {
		this.send("setBackground", thing)
	}
}

function MemeCanvasEventHandler(mc) {
	this.memeCreator = mc;

	var player = mc.player
	this.player = player
	var tool = this;
	this.started = false;
	this.drawnSegments = 0;
	this.looperCounter = 0;

	// NOTE, this is currently single touch

	this.touchstart = (ev) => {
		ev.preventDefault();
		tool.setOffsets();
		x = ev.targetTouches[0].pageX - this.canvasOffsetLeft;
		y = ev.targetTouches[0].pageY - this.canvasOffsetTop;
		tool.start(x, y);
	}
	this.touchmove = (ev) => {
		ev.preventDefault(); 
		x = ev.targetTouches[0].pageX - this.canvasOffsetLeft;
		y = ev.targetTouches[0].pageY - this.canvasOffsetTop;
		tool.move(x, y);
	}
	this.touchend = (ev) => {
		ev.preventDefault(); 
		console.log(ev)
		tool.end(ev.changedTouches[0].pageX - this.canvasOffsetLeft,
				ev.changedTouches[0].pageY - this.canvasOffsetTop);
	}

	this.setOffsets = () => {
        let offsets = omg.ui.totalOffsets(player.canvas)
		//todo use omg.ui.getOffsets?
		this.canvasOffsetLeft = offsets.left;
		this.canvasOffsetTop = offsets.top;
	}

	this.mousedown = (ev) => {
		tool.setOffsets();
		tool.start(
			ev.pageX - this.canvasOffsetLeft, 
			ev.pageY - this.canvasOffsetTop
		);
	}
	this.start = (x, y) => {
		x = (x - player.horizontalPadding / 2) / (player.canvas.clientWidth - player.horizontalPadding)
		y = (y - player.verticalPadding / 2) / (player.canvas.clientHeight - player.verticalPadding)
		//mc.cursor.active = false
		
		tool.started = true;
		if (mc.mode === "DIALOG"){
			this.dialogStartTouch(x, y)
		}
		else if (mc.mode === "DOODLE") {
			this.doodleStartTouch(x, y, tool);
        }
        else if (mc.mode === "RECTANGLE") {
			this.squareStartTouch(x, y, tool);
		}

		this.player.draw()
    };

	this.mousemove = ev => {
		tool.setOffsets();
		var x = ev.pageX - this.canvasOffsetLeft;
		var y = ev.pageY - this.canvasOffsetTop;
		tool.move(x, y);
	}
	this.mouseout = (ev) => {
		mc.cursor.active = false
		this.player.draw()		
	};

	this.move = (x, y) => {
		x = (x - player.horizontalPadding / 2) / (player.canvas.clientWidth - player.horizontalPadding)
		y = (y - player.verticalPadding / 2) / (player.canvas.clientHeight - player.verticalPadding)
		
		if (tool.started) {
            if (mc.mode === "DIALOG"){
				mc.preview.x = x
				mc.preview.y = y
				mc.preview.xyt.push([x, y, Date.now() - this.loopCounter])
			}
			else if (mc.mode === "DOODLE"){
				tool.doodleTouchMove(x, y, tool);
            }
            else if (mc.mode === "RECTANGLE"){
				tool.squareTouchMove(x, y, tool);
			}
		}
		else {
			mc.cursor.active = true
			mc.send("cursorMove", {x, y})
		}	
		mc.cursor.x = x
		mc.cursor.y = y

		this.player.draw()
	};

	this.mouseup = (ev) => {
		ev.preventDefault(); 
		tool.end(ev.pageX - this.canvasOffsetLeft,
				ev.pageY - this.canvasOffsetTop)
	}

	this.end = function (x, y) {
		x = (x - player.horizontalPadding / 2) / (player.canvas.clientWidth - player.horizontalPadding)
		y = (y - player.verticalPadding / 2) / (player.canvas.clientHeight - player.verticalPadding)
		
		if (tool.started) {
			tool.started = false;
			if (mc.mode === "DIALOG"){
				mc.preview.xyt.push([x, y, Date.now() - tool.loopCounter])
				mc.preview.xyt.push(["stop", "stop", Date.now() - tool.loopCounter])
			}
			else if (mc.mode === "DOODLE"){
				tool.doodleTouchEnd(x, y);
            }
            else if (mc.mode === "RECTANGLE"){
				tool.squareTouchEnd(x, y);
			}
			
			mc.setPen()
		}
		mc.cursor.active = true
		
		this.player.draw()
	};
}


MemeCanvasEventHandler.prototype.dialogStartTouch = function (x, y) {
	this.started = true
	this.memeCreator.preview = this.player.preview
	
	this.memeCreator.preview.x = x;
	this.memeCreator.preview.y = y;
	
	this.memeCreator.preview.xyt.push([x, y, time])

	if (this.player.meme.layers.indexOf(this.memeCreator.preview) === -1) {
		this.player.meme.layers.push(this.memeCreator.preview)
	}
}

MemeCanvasEventHandler.prototype.doodleStartTouch = function (x, y, tool) {

	this.memeCreator.preview.xyt.push([x, y, 0]);	

    let mc = this.memeCreator
	if (mc.meme.layers.indexOf(mc.preview) === -1) {
		mc.meme.layers.push(mc.preview)
    }
    mc.send("doodleStart", {x, y})
};
MemeCanvasEventHandler.prototype.doodleTouchMove = function (x, y, tool){
    this.memeCreator.preview.xyt.push([x, y, 0]);
    this.memeCreator.send("doodleMove", {x, y})
};
MemeCanvasEventHandler.prototype.doodleTouchEnd = function (x, y) {
    this.memeCreator.preview.xyt.push([-1, -1, 0]);
    this.memeCreator.send("doodleEnd", { x: -1, y: -1})
};

MemeCanvasEventHandler.prototype.squareStartTouch = function (x, y, tool) {

	this.memeCreator.preview.x = x
	this.memeCreator.preview.y = y	

    let mc = this.memeCreator
	if (mc.meme.layers.indexOf(mc.preview) === -1) {
		mc.meme.layers.push(mc.preview)
    }
    mc.send("squareStart", {x, y})
};
MemeCanvasEventHandler.prototype.squareTouchMove = function (x, y, tool){
	this.memeCreator.preview.w = x - this.memeCreator.preview.x
	this.memeCreator.preview.h = y - this.memeCreator.preview.y
    this.memeCreator.send("squareMove", {x, y})
};
MemeCanvasEventHandler.prototype.squareTouchEnd = function (x, y) {
    //this.memeCreator.send("squareEnd", { x: -1, y: -1})
    this.memeCreator.setPen()
};


ChatWorkBox.prototype.setupCanvasEvents = function () {
	var tool = new MemeCanvasEventHandler(this);
	var canvas = this.player.canvas
	canvas.addEventListener("mouseout", tool.mouseout, false);
	canvas.addEventListener("mousedown", tool.mousedown, false);
	canvas.addEventListener("mousemove", tool.mousemove, false);
	canvas.addEventListener("mouseup",   tool.mouseup, false);
	canvas.addEventListener("touchstart", tool.touchstart, false);
	canvas.addEventListener("touchmove", tool.touchmove, false);
	canvas.addEventListener("touchend",   tool.touchend, false);
	
	this.canvasEventHandler = tool
}

ChatWorkBox.prototype.setupSocketEvents = function () {
    this.rt.on("cursorMove", data => {
		this.remoteCursor.active = data.x !== -1
		this.remoteCursor.x = data.x
		this.remoteCursor.y = data.y
		this.player.draw()
	})
	
	this.rt.on("doodleStart", data => {
        this.remotePreview.x = data.x
        this.remotePreview.y = data.y
 
        this.remotePreview.xyt.push([data.x, data.y, 0]);	
        if (this.meme.layers.indexOf(this.remotePreview) === -1) {
            this.meme.layers.push(this.remotePreview)
		}
		this.player.draw()
    })
    this.rt.on("doodleMove", data => {
        this.remotePreview.x = data.x
        this.remotePreview.y = data.y
 
		this.remotePreview.xyt.push([data.x, data.y, 0])
		this.player.draw()
    })
    this.rt.on("doodleEnd", data => {
		this.remotePreview.xyt.push([-1, -1, 0]);
		this.player.draw()
    })
    this.rt.on("doodleSet", data => {
		console.log("remote pen set", data)
		this.setRemotePen(data)
		this.player.draw()
    })

    this.rt.on("squareStart", data => {

		this.remotePreview.x = data.x
		this.remotePreview.y = data.y
    
        if (this.meme.layers.indexOf(this.remotePreview) === -1) {
            this.meme.layers.push(this.remotePreview)
		}
		this.player.draw()
    })
    this.rt.on("squareMove", data => {
		this.remotePreview.w = data.x - this.remotePreview.x
		this.remotePreview.h = data.y - this.remotePreview.y
		this.player.draw()
    })
    this.rt.on("squareEnd", data => {
		this.setRemotePen()
		this.player.draw()
	})
	
	this.rt.on("setBackground", data => {
		this.addBackground(data, true, true)
		this.player.draw()
	})	
}

ChatWorkBox.prototype.send = function (action, data) {
    data.room = true
    this.rt.emit(action, data)
}

ChatWorkBox.prototype.setupControls = function () {

	this.lineButton = document.getElementById("line-button")
	this.lineButton.onclick = e => {
		this.mode = "DOODLE"
		this.setPen()
	}
	this.squareButton = document.getElementById("square-button")
	this.squareButton.onclick = e => {
		this.mode = "RECTANGLE"
		this.setPen()
	}
    
    this.colorPicker = document.getElementById("doodle-color")
    this.sizePicker = document.getElementById("doodle-width")
    this.colorPicker.onchange = e => this.setPen()
	this.sizePicker.onchange = e => this.setPen()
	
	this.undoButton = document.getElementById("work-box-undo-button")
    this.clearButton = document.getElementById("work-box-clear-button")
    this.undoButton.onclick = e => {
		this.setPen()
		if (this.meme.layers.length > 0) {
			this.meme.layers.pop()
		}
		else if (this.lastCleared) {
			this.meme.layers = this.lastCleared
		}
		this.player.draw()
	}
	this.clearButton.onclick = e => this.clear()
}

ChatWorkBox.prototype.clear = function () {
	this.setPen()
	this.lastCleared = JSON.parse(JSON.stringify(this.meme.layers))
	this.meme.layers = []
	this.player.draw()

}