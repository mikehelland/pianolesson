"use strict";

// Dec 27, 2020, copied, pasted, and trimmed from meme player

function OMemePlayer(config) {

	if (!config || !config.div) {
		console.warn("MemePlayer: no config.div?")
		return
	}

	this.config = config

	var div = config.div;
	
	var sceneCanvas = document.createElement("canvas")
	this.canvas = sceneCanvas
	
	div.appendChild(sceneCanvas);

    this.layerExtras = new Map()

	this.width = 640 || config.width;
	this.height = 480 || config.height;
	
	sceneCanvas.style.boxSizing = "border-box"
	sceneCanvas.style.width = "100%" 
	sceneCanvas.style.height = "100%"
	sceneCanvas.width = this.width;
	sceneCanvas.height = this.height;

	this.sizeCanvas()
	
	sceneCanvas.style.display = "block";
	
	this.context = sceneCanvas.getContext("2d");
	
	this.context.lineWidth = 6;
	this.context.shadowColor = "black";
	this.context.lineJoin = "round";

}

OMemePlayer.prototype.load = function(meme) {

	this.meme = meme
	this.sizeCanvas()
	
	if (!meme.layers) {
		meme.layers = []	
	}

	this.loadBackground()

	this.loaded = true
	
	this.animate();
	
	if (this.onload) {
		this.onload()
	}
}

OMemePlayer.prototype.loadPreview = function (meme) {
	this.meme = meme
	this.sizeCanvas()
	this.loadBackground(() => {
		this.drawBackground()

		this.meme.layers.forEach(layer => {
			if (layer.disabled) {
				return
			}

			switch(layer.type) {
				case "DIALOG":
					layer.i = 0
					this.animateDialog(layer, 0)
					break;
				case "DOODLE":
					layer.i = 0
					this.animateDoodle(layer, 0)
					break;
                case "RECTANGLE":
					layer.i = 0
					this.animateRectangle(layer, 0)
					break;
				}
		})
	})
}


OMemePlayer.prototype.animate = function() {	
	
	this.drawBackground();
	
    for (this._animate_i = 0; this._animate_i < this.meme.layers.length; this._animate_i++) {

        if (this.updateIs) {
            this.meme.layers[this._animate_i].i = 0
        }

        if (this.meme.layers[this._animate_i].disabled) {
            continue
        }
    
        switch(this.meme.layers[this._animate_i].type) {
            case "CHARACTER":
                this.animateCharacter(this.meme.layers[this._animate_i], this.nowInLoop)
                break;
            case "DIALOG":
                this.animateDialog(this.meme.layers[this._animate_i], this.nowInLoop)
                break;
            case "DOODLE":
                this.animateDoodle(this.meme.layers[this._animate_i], this.nowInLoop)
                break;
            case "RECTANGLE":
                this.animateRectangle(this.meme.layers[this._animate_i], this.nowInLoop)
                break;
            }
    }

    if (this.preview && this.preview.y !== -1) {
        this.context.globalAlpha = 0.6
        switch(this.preview.type) {
            case "CHARACTER":
                //with selection?
                this.drawCharacterWithSelection(this.preview, this.preview.x, this.preview.y, this.context)
                break;
            case "DIALOG":
                this.drawDialog(this.preview.text, this.preview.x, this.preview.y)
                break;
            case "DOODLE":
                this.previewDoodle(this.preview)
                break;
        }
        this.context.globalAlpha = 1
    }
		
	requestAnimationFrame(() => {
		this.animate();
	});
}


OMemePlayer.prototype.drawDialog = function(text, x, y) {
	
	if (x === "stop") {
		return
	}

	x = this.canvas.width * x
	y = this.canvas.height * y

	//todo lots of variables being declared in a loop
	var context = this.context;
	context.fillStyle = "white";
	context.lineWidth = 1;
	context.strokeStyle = "black";
	context.font = "18pt Arial";
	var tw = context.measureText(text).width;
	var ty = y;
	x = Math.max(-10 + x - tw/2, 0);
	y = y - 35;

	var r = 5;
	var h = 50;
	var w = tw + 20;
	var xdiff = this.canvas.width - (x + w);
	if (xdiff < 0){
		x = x + xdiff;
	}

	context.beginPath();
	context.moveTo(x + r, y);
	context.arcTo(x+w, y, x+w, y+h, r);
	context.arcTo(x+w, y+h, x, y+h, r);
	context.arcTo(x, y+h, x, y, r);
	context.arcTo(x, y, x+w, y, r);
	context.shadowBlur = 10;
	context.shadowOffsetX = 10;
	context.shadowOffsetY = 10;
	context.closePath();
	context.fill();
	context.shadowOffsetX = 0;
	context.shadowOffsetY = 0;
	context.shadowBlur = 0;
	context.stroke();

	context.fillStyle = "black";
	context.fillText(text, x + 10, ty);
}
	

OMemePlayer.prototype.drawBackground = function() {
	
	if (this.backgroundImg) {
		this.context.drawImage(this.backgroundImg, 0, 0, 
			this.canvas.width, this.canvas.height);
	}
	else {
		/* javascript generated backdrop
		try {
			eval(document.getElementById("scene-script").value);
		}
		catch (e) {
		}*/
		this.canvas.width = this.canvas.width;
		this.context.filleStyle = "#000000";
		this.context.fillRect(0, 0, 
				600, this.height);
	}
}


OMemePlayer.prototype.drawLoading = function() {
	var n = 0;
	this.context.font = "bold 18pt Arial Black";
	this.context.shadowColor = "black";
	this.context.shadowBlur = 10;
	this.context.fillStyle = "white";
	this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
	//this.context.fillStyle = "grey";
	//this.context.fillRect(0, 0, 75 * (Math.ceil(n) - n), 75);
	this.context.fillStyle = "black";
	this.context.fillText("Loading...", 30, 50);
	this.context.shadowBlur = 0;
}


OMemePlayer.prototype.loadBackground = function(onload) {

	if (!this.meme) return
	
	var background = this.meme.background
	if (background && background.thing && background.thing.url) {
		this.backgroundImg = new Image()
		this.backgroundImg.onload = () => {
			if (onload) onload(this.backgroundImg)
		}
		this.backgroundImg.src = background.thing.url
	}
	else {
		if (onload) onload(this.backgroundImg)
	}
}


OMemePlayer.prototype.previewDoodle = function (doodle) {
	
	this.context.fillStyle = doodle.color;
	this.context.fillRect(this.canvas.width * doodle.x - doodle.width / 2, this.canvas.height * doodle.y - doodle.width / 2, 
						doodle.width, doodle.width)
}

OMemePlayer.prototype.animateDoodle = function (doodle, nowInLoop) {
	
	var drawn = false;
	var start = true
	this.context.lineWidth = doodle.width;
	this.context.strokeStyle = doodle.color; 
		
	for (var j = 0; j < doodle.xyt.length; j++) {
	
		if (doodle.xyt[j][2] > nowInLoop){
			break;
		}
	
		if (!drawn || start) {
			drawn = true;
			start = false
			this.context.beginPath();
			this.context.moveTo(doodle.xyt[j][0] * this.canvas.width, 
								doodle.xyt[j][1] * this.canvas.height);
		}
		else {
			if (doodle.xyt[j][0] === -1) {
				start = true
				this.context.stroke();
			}
			else {
				this.context.lineTo(doodle.xyt[j][0] * this.canvas.width, 
								doodle.xyt[j][1] * this.canvas.height);
			}
		}
	}

	if (drawn) {
		this.context.stroke();
	}	
}

OMemePlayer.prototype.animateRectangle = function (doodle, nowInLoop) {
	
	this.context.lineWidth = doodle.width;
	this.context.strokeStyle = doodle.color; 
    this.context.strokeRect(doodle.start[0] * this.canvas.width, doodle.start[1] * this.canvas.height, 
        doodle.end[0] * this.canvas.width, doodle.end[1] * this.canvas.height) 
}

OMemePlayer.prototype.sizeCanvas = function () {
	if (this.meme) {
		this.canvas.width = this.meme.width
		this.canvas.height = this.meme.height
	}
	//var memeRatio = this.width / this.height
	var memeRatio = this.canvas.width / this.canvas.height
	var canvasRatio = this.canvas.clientWidth / this.canvas.clientHeight

	var shouldBe, padding
	if (memeRatio > canvasRatio) {
		shouldBe = this.canvas.clientWidth / memeRatio
		padding = (this.canvas.clientHeight - shouldBe) / 2

		this.canvas.style.paddingTop = padding + "px"
		this.canvas.style.paddingBottom = padding + "px"
		this.canvas.style.paddingLeft = "0px"
		this.canvas.style.paddingRight = "0px"

		this.verticalPadding = padding * 2
		this.horizontalPadding = 0
	}
	else {
		shouldBe = this.canvas.clientHeight * memeRatio
		padding = (this.canvas.clientWidth - shouldBe) / 2

		this.canvas.style.paddingLeft = padding + "px"
		this.canvas.style.paddingRight = padding + "px"
		this.canvas.style.paddingTop = "0px"
		this.canvas.style.paddingBottom = "0px"
		
		this.verticalPadding = 0
		this.horizontalPadding = padding * 2
	}
}
OMemePlayer.prototype.onLayerLoaded = function (layer, extras) {
	if (this.onlayerloaded) {
		this.onlayerloaded(layer, extras)
	}
}