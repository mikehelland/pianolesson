function DrumsetSurface(div) {

    var drums = [
        {name: "kick", width: 0.2, height: 0.2, x: 0.4, y: 0.7},
        {name: "snare", width: 0.15, height: 0.15, x: 0.25, y: 0.4},
        {name: "rim", width: 0.15, height: 0.08, x: 0.25, y: 0.57},
        {name: "HiHat Open", width: 0.1, height: 0.1, x: 0.15, y: 0.27},
        {name: "HiHat Closed", width: 0.1, height: 0.1, x: 0.25, y: 0.27},
        {name: "tom1", width: 0.15, height: 0.1, x: 0.45, y: 0.25},
        {name: "tom2", width: 0.15, height: 0.1, x: 0.55, y: 0.35},
        {name: "tom3", width: 0.15, height: 0.1, x: 0.65, y: 0.45},
        {name: "crash1", width: 0.15, height: 0.15, x: 0.05, y: 0.05},
        {name: "crash2", width: 0.15, height: 0.15, x: 0.80, y: 0.05},
        {name: "ride", width: 0.15, height: 0.15, x: 0.80, y: 0.65},
    ]

    for (var i = 0; i < drums.length; i++) {
        var drumDiv = document.createElement("div")
        drumDiv.className = "drumset-drum"
        drumDiv.innerHTML = drums[i].name
        console.log(div.width)
        drumDiv.style.position = "absolute"
        drumDiv.style.left = drums[i].x * div.clientWidth + "px"
        drumDiv.style.top = drums[i].y * div.clientHeight + "px"
        drumDiv.style.width = drums[i].width * div.clientWidth  + "px"
        drumDiv.style.height = drums[i].height * div.clientHeight  + "px"

        drums[i].div = drumDiv
        drums[i].counter = 0
        div.appendChild(drumDiv)
    }
    
    this.drums = drums
}

DrumsetSurface.prototype.setupEvents = function () {
    //called, but empty
}

DrumsetSurface.prototype.drawPressed = function (pressed, noteNumber) {
    if (noteNumber >= 0) {
        this.drums[noteNumber % this.drums.length].div.style.backgroundColor = "red"
        var count = ++this.drums[noteNumber % this.drums.length].counter
        setTimeout(()=> {
            if (this.drums[noteNumber % this.drums.length].counter === count) {
                this.drums[noteNumber % this.drums.length].div.style.backgroundColor = "green"
            }
        }, 300)
    }    
}

