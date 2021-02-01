function OMGMusicChat(rt, onready) {
    this.rt = rt
    this.pianoDiv = document.getElementById("big-piano")
    this.piano = new PianoSurface(this.pianoDiv)
    this.piano.setupEvents(key => this.noteOn(key.note, 60, this.user),
                           key => this.noteOff(key.note, this.user))

}

OMGMusicChat.prototype.setupPlayer = function () {
    this.visibleMeters = []
    this.updateMeters()

    if (typeof OMusicPlayer === "undefined") {
        omg.util.loadScripts(
            ["/apps/music/js/omusic_player.js"],
            () => {
                this.whenPlayersReady()
            }
        )
    }
    else {
        this.whenPlayersReady()
    }
}

OMGMusicChat.prototype.setupKeyboard = function () {

    var keyMap = {
        "a": 48, "s": 50, "d": 52, "f": 53, "g": 55, "h": 57, "j": 59, "k": 60, "l": 62, ";": 64,
        "q": 47, "w": 49, "e": 51, "r": 52, "t": 54, "y": 56, "u": 58, "i": 60, "o": 61, "p": 63,
        "z": 36, "x": 38, "c": 40, "v": 41, "b": 43, "n": 45, "m": 47
    }

    var keys = {}

    document.body.onkeydown = e => {
        let note = keyMap[e.key]
        if (note && !keys[e.key]) {
            this.noteOn(note, 66, this.user)
            keys[e.key] = true
        }
    }
    document.body.onkeyup = e => {
        let note = keyMap[e.key]
        if (note) {
            this.noteOff(note, this.user)
            keys[e.key] = false
        }
    }
}


OMGMusicChat.prototype.whenPlayersReady = function () {
    this.player = new OMusicPlayer()
    this.player.loadFullSoundSets = true
    this.section = new OMGSection()

    this.player.prepareSong(this.section.song)

    this.setupKeyboard()
    this.setupCommands()

    var selectInstrument = document.getElementById("select-instrument")
    for (var instrument in this.INSTRUMENTS) {
        selectInstrument.innerHTML += `<option value=${instrument}>${this.INSTRUMENTS[instrument].name}</option>`
    }
    selectInstrument.onchange = e => {
        var instrument = selectInstrument.value
        this.changeSoundSet(instrument, this.part)

        this.sendChangeSoundSet(instrument)
        this.user.data.instrument = instrument
        this.rt.updateLocalUserData(this.user.data)
    }
}

OMGMusicChat.prototype.setupLocalUser = function (user) {
    user.data = {}
    this.setupUser(user, true)
    this.user = user
    this.part = user.part

    user.data.instrument = user.part.data.name
    this.rt.updateLocalUserData(user.data)

    this.setupMIDI()
}

OMGMusicChat.prototype.setupUser = function (user, local) {

    user.pressed = []
    //this.makePianoCanvas(user)

    if (!local) {
        var instrumentDiv = document.createElement("span")
        instrumentDiv.innerHTML = user.data ? user.data.instrument : Object.values(this.INSTRUMENTS)[0].name
        instrumentDiv.className = "user-instrument"
        user.div.appendChild(instrumentDiv)
        user.instrumentDiv = instrumentDiv
    }

    var volumeSlider = document.createElement("input")
    volumeSlider.type = "RANGE"
    //user.div.appendChild(volumeSlider)
    volumeSlider.onchange = e => {
        
        //todo shouldn't the player be able to handle this?
        user.part.data.audioParams.gain = volumeSlider.value/100
        user.part.gain.gain.setValueAtTime(volumeSlider.value/100, 0)
    }

    var soundSet = Object.values(this.INSTRUMENTS)[0]
    if (user.data && user.data.instrument) {
        // TODO there's some reasons why this doesn't work
        // user.data.instrument is either undefined or set to the "acoustic grand piano" instead of "APIANO"
        //soundSet = this.INSTRUMENTS[user.data.instrument]
    }
    
    user.part = new OMGPart(null, {name: user.name, audioParams: {gain: 0.3}, soundSet: soundSet}, this.section)
    volumeSlider.value = 30
    this.player.loadPart(user.part)


    this.makeMeter(user)
}

OMGMusicChat.prototype.noteOn = function (noteNumber, velocity, user) {

    if (user === this.user) {
        this.sendNoteOn(noteNumber, velocity, user.part)
    }

    this._non = user.part.data.soundSet.chromatic ? noteNumber : noteNumber % user.part.soundSet.data.length

    if (user.part.data.surface.url === "PRESET_SEQUENCER") {
        this.player.playSound(user.part.data.tracks[this._non].sound, user.part,
            user.part.data.tracks[this._non].audioParams, velocity / 120)
    }
    else {
        this.player.noteOn(this._non, user.part, velocity)
    }

    if (user.pressed.indexOf(noteNumber) === -1) {
        user.pressed.push(noteNumber)
    }
    this.piano.drawPressed(user.pressed)
}

OMGMusicChat.prototype.noteOff = function (noteNumber, user) {
    if (user.part.data.surface.url === "PRESET_VERTICAL") {
        this.player.noteOff(noteNumber, user.part)
    }

    if (user === this.user) {
        this.sendNoteOff(noteNumber, user.part)
    }
    
    this._noi = user.pressed.indexOf(noteNumber)
    if (this._noi > -1) {
        user.pressed.splice(this._noi, 1)
    }
    this.piano.drawPressed(user.pressed)
}

OMGMusicChat.prototype.INSTRUMENTS = {
    APIANO: { "name": "acoustic grand piano", "prefix": "https://mikehelland.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/", "url": "https://localhost:8081/data/undefined", "type": "SOUNDSET", "soundFont": true, "lowNote": 21, "postfix": "", "chromatic": true, "defaultSurface": "PRESET_VERTICAL", "data": [ { "url": "A0.mp3", "name": "A0" }, { "url": "Bb0.mp3", "name": "Bb0" }, { "url": "B0.mp3", "name": "B0" }, { "url": "C1.mp3", "name": "C1" }, { "url": "Db1.mp3", "name": "Db1" }, { "url": "D1.mp3", "name": "D1" }, { "url": "Eb1.mp3", "name": "Eb1" }, { "url": "E1.mp3", "name": "E1" }, { "url": "F1.mp3", "name": "F1" }, { "url": "Gb1.mp3", "name": "Gb1" }, { "url": "G1.mp3", "name": "G1" }, { "url": "Ab1.mp3", "name": "Ab1" }, { "url": "A1.mp3", "name": "A1" }, { "url": "Bb1.mp3", "name": "Bb1" }, { "url": "B1.mp3", "name": "B1" }, { "url": "C2.mp3", "name": "C2" }, { "url": "Db2.mp3", "name": "Db2" }, { "url": "D2.mp3", "name": "D2" }, { "url": "Eb2.mp3", "name": "Eb2" }, { "url": "E2.mp3", "name": "E2" }, { "url": "F2.mp3", "name": "F2" }, { "url": "Gb2.mp3", "name": "Gb2" }, { "url": "G2.mp3", "name": "G2" }, { "url": "Ab2.mp3", "name": "Ab2" }, { "url": "A2.mp3", "name": "A2" }, { "url": "Bb2.mp3", "name": "Bb2" }, { "url": "B2.mp3", "name": "B2" }, { "url": "C3.mp3", "name": "C3" }, { "url": "Db3.mp3", "name": "Db3" }, { "url": "D3.mp3", "name": "D3" }, { "url": "Eb3.mp3", "name": "Eb3" }, { "url": "E3.mp3", "name": "E3" }, { "url": "F3.mp3", "name": "F3" }, { "url": "Gb3.mp3", "name": "Gb3" }, { "url": "G3.mp3", "name": "G3" }, { "url": "Ab3.mp3", "name": "Ab3" }, { "url": "A3.mp3", "name": "A3" }, { "url": "Bb3.mp3", "name": "Bb3" }, { "url": "B3.mp3", "name": "B3" }, { "url": "C4.mp3", "name": "C4" }, { "url": "Db4.mp3", "name": "Db4" }, { "url": "D4.mp3", "name": "D4" }, { "url": "Eb4.mp3", "name": "Eb4" }, { "url": "E4.mp3", "name": "E4" }, { "url": "F4.mp3", "name": "F4" }, { "url": "Gb4.mp3", "name": "Gb4" }, { "url": "G4.mp3", "name": "G4" }, { "url": "Ab4.mp3", "name": "Ab4" }, { "url": "A4.mp3", "name": "A4" }, { "url": "Bb4.mp3", "name": "Bb4" }, { "url": "B4.mp3", "name": "B4" }, { "url": "C5.mp3", "name": "C5" }, { "url": "Db5.mp3", "name": "Db5" }, { "url": "D5.mp3", "name": "D5" }, { "url": "Eb5.mp3", "name": "Eb5" }, { "url": "E5.mp3", "name": "E5" }, { "url": "F5.mp3", "name": "F5" }, { "url": "Gb5.mp3", "name": "Gb5" }, { "url": "G5.mp3", "name": "G5" }, { "url": "Ab5.mp3", "name": "Ab5" }, { "url": "A5.mp3", "name": "A5" }, { "url": "Bb5.mp3", "name": "Bb5" }, { "url": "B5.mp3", "name": "B5" }, { "url": "C6.mp3", "name": "C6" }, { "url": "Db6.mp3", "name": "Db6" }, { "url": "D6.mp3", "name": "D6" }, { "url": "Eb6.mp3", "name": "Eb6" }, { "url": "E6.mp3", "name": "E6" }, { "url": "F6.mp3", "name": "F6" }, { "url": "Gb6.mp3", "name": "Gb6" }, { "url": "G6.mp3", "name": "G6" }, { "url": "Ab6.mp3", "name": "Ab6" }, { "url": "A6.mp3", "name": "A6" }, { "url": "Bb6.mp3", "name": "Bb6" }, { "url": "B6.mp3", "name": "B6" }, { "url": "C7.mp3", "name": "C7" }, { "url": "Db7.mp3", "name": "Db7" }, { "url": "D7.mp3", "name": "D7" }, { "url": "Eb7.mp3", "name": "Eb7" }, { "url": "E7.mp3", "name": "E7" }, { "url": "F7.mp3", "name": "F7" }, { "url": "Gb7.mp3", "name": "Gb7" }, { "url": "G7.mp3", "name": "G7" }, { "url": "Ab7.mp3", "name": "Ab7" }, { "url": "A7.mp3", "name": "A7" }, { "url": "Bb7.mp3", "name": "Bb7" }, { "url": "B7.mp3", "name": "B7" }, { "url": "C8.mp3", "name": "C8" } ], "octave": 5 }
}


OMGMusicChat.prototype.makeMeter = function (user) {
    user.meterDiv = document.createElement("div")
    user.meterDiv.className = "volume-meter"
    user.div.appendChild(user.meterDiv)

    var meter = new BasicPeakMeter(user.part.postFXGain, user.meterDiv, this.player.context);
    this.visibleMeters.push(meter);
}

OMGMusicChat.prototype.updateMeters = function () {
    for (this._update_j = 0; 
            this._update_j < this.visibleMeters.length; 
            this._update_j++) {
        this.visibleMeters[this._update_j].updateMeter();
    }

    window.requestAnimationFrame(() => this.updateMeters());
};

OMGMusicChat.prototype.sendNoteOn = function (note, velocity) {
    this.rt.sendCommandToRoom({action: "noteon", note: note, velocity: velocity})         
}
OMGMusicChat.prototype.sendNoteOff = function (note) {
    this.rt.sendCommandToRoom({action: "noteoff", note: note})
}
OMGMusicChat.prototype.sendChangeSoundSet = function (instrument) {
    this.rt.sendCommandToRoom({action: "changeSoundSet", instrument: instrument})
}

OMGMusicChat.prototype.setupCommands = function () {
    this.rt.oncommand = (data) => {
        this._cmdFrom = this.rt.remoteUsers[data.from]
        if (!this._cmdFrom) {
            return
        }
        this._cmdPart = this._cmdFrom.part
            
        if (data.command.action === "noteon") {
            this.noteOn(data.command.note, data.command.velocity, this._cmdFrom)
        }
        else if (data.command.action === "noteoff") {
            this.noteOff(data.command.note, this._cmdFrom)
        }
        else if (data.command.action === "changeSoundSet") {
            this.changeSoundSet(data.command.instrument, this._cmdPart)
            this._cmdFrom.instrumentDiv.innerHTML = this.INSTRUMENTS[data.command.instrument].name
        }
    }
}

OMGMusicChat.prototype.changeSoundSet = function (instrument, part) {

    part.data.surface.url = this.INSTRUMENTS[instrument].defaultSurface
    part.setSoundSet(this.INSTRUMENTS[instrument])
    this.player.loadPart(part)

}

OMGMusicChat.prototype.setupMIDI = function () {
    this.midi = new OMGMIDI()
    this.midi.onnoteon  = (note, velocity) => this.noteOn(note, velocity, this.user)
    this.midi.onnoteoff = (note) => this.noteOff(note, this.user)
}

OMGMusicChat.prototype.makePianoCanvas = function (user) {
    user.pianoCanvas = document.createElement("div")
    user.pianoCanvas.className = "piano-canvas"
    user.div.appendChild(user.pianoCanvas)

    user.piano = new PianoSurface(user.pianoCanvas)

}


// todo 
/*

pan
fx

more soundsets


disable login button till ready

*/