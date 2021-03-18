import OMusicContext from "/apps/music/js/omusic.js"

export default function OMGMusicChat(rt, instrument, onready) {
    this.rt = rt
    this.instrument = instrument 
    this.instrument.setupEvents(key => this.noteOn(key.note, 60, this.user),
                           key => this.noteOff(key.note, this.user))

}

OMGMusicChat.prototype.setupPlayer = function () {
    this.visibleMeters = []
    this.updateMeters()

    this.whenPlayersReady()
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
    this.musicContext = new OMusicContext()
    this.musicContext.loadFullSoundSets = true
    this.musicContext.load({sections: [{name: "section1"}]})
    .then(({song, player}) => {
        this.player = player
        this.song = song
        this.setupKeyboard()
        this.setupCommands()
    })
    
    /*var selectInstrument = document.getElementById("select-instrument")
    for (var instrument in this.INSTRUMENTS) {
        selectInstrument.innerHTML += `<option value=${instrument}>${this.INSTRUMENTS[instrument].name}</option>`
    }
    selectInstrument.onchange = e => {
        var instrument = selectInstrument.value
        this.changeSoundSet(instrument, this.part)

        this.sendChangeSoundSet(instrument)
        this.user.data.instrument = instrument
        this.rt.updateLocalUserData(this.user.data)
    }*/
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

    var soundSet 
    if (!this.useSoundFont) {
        soundSet = Object.values(this.INSTRUMENTS)[0]
    }
    else {
        soundSet = {
            "soundFont": {
              "url": "https://surikov.github.io/webaudiofontdata/sound/0001_FluidR3_GM_sf2_file.js",
              "name": "0001_FluidR3_GM_sf2_file.js"
            },
            "octave": 5,
            "lowNote": 0,
            "highNote": 108,
            "chromatic": true
          }
    }
    if (user.data && user.data.instrument) {
        // TODO there's some reasons why this doesn't work
        // user.data.instrument is either undefined or set to the "acoustic grand piano" instead of "APIANO"
        //soundSet = this.INSTRUMENTS[user.data.instrument]
    }
    //soundSet: soundSet

    user.part = this.song.addPart({name: user.name, audioParams: {gain: 0.3}, soundSet})
    
    volumeSlider.value = 30
    this.musicContext.loadPartHeader(user.part)


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
    this.instrument.drawPressed(user.pressed, noteNumber)
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
    this.instrument.drawPressed(user.pressed)
}

OMGMusicChat.prototype.INSTRUMENTS = {
    TD_DRUMKIT: {"data":[{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/acoustic-kit/kick.wav","name":"Kick"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/acoustic-kit/snare.wav","name":"X Stick"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/acoustic-kit/snare.wav","name":"Snare"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/TheCheebacabra1/tom3.wav","name":"Tom 4 Rim"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/TheCheebacabra1/snare.wav","name":"Snare Rim"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/TheCheebacabra1/tom3.wav","name":"Tom 4"},{"url":"https://mikehelland.com/omg/drums/rock_hihat_closed.mp3","name":"Closed HH"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/acoustic-kit/tom3.wav","name":"Tom 3"},{"url":"https://mikehelland.com/omg/drums/hh_hihat.mp3","name":"Pedal HH"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/acoustic-kit/tom2.wav","name":"Tom 2"},{"url":"https://mikehelland.com/omg/drums/rock_hihat_open.mp3","name":"Open HH"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/TheCheebacabra1/tom2.wav","name":"Tom 2 Rim"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/acoustic-kit/tom1.wav","name":"Tom 1"},{"url":"https://mikehelland.com/omg/drums/rock_crash.mp3","name":"Crash 1"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/TheCheebacabra1/tom1.wav","name":"Tom 1 Rim"},{"url":"https://mikehelland.com/omg/drums/ride.wav","name":"Ride"},{"url":"https://mikehelland.com/omg/drums/rock_crash.mp3","name":"Crash 2 Rim"},{"url":"https://mikehelland.com/omg/drums/ride2.wav","name":"Ride Rim"},{"url":"","name":"-"},{"url":"https://mikehelland.com/omg/drums/rock_crash.mp3","name":"Crash 1 Rim"},{"url":"","name":"-"},{"url":"https://mikehelland.com/omg/drums/rock_crash.mp3","name":"Crash 2"},{"url":"https://cwilso.github.io/MIDIDrums/sounds/drum-samples/TheCheebacabra1/tom3.wav","name":"Tom 3 Rim"},{"url":"https://mikehelland.com/omg/drums/ride2.wav","name":"Ride Edge Rim"}],"name":"TD KIT","type":"SOUNDSET","prefix":"","lowNote":24,"postfix":"","user_id":"1","approved":true,"username":"m                   ","chromatic":false,"created_at":1586541415888,"omgVersion":1,"last_modified":1586548042206,"defaultSurface":"PRESET_SEQUENCER","id":1652}
}


OMGMusicChat.prototype.makeMeter = function (user) {
    user.meterDiv = document.createElement("div")
    user.meterDiv.className = "volume-meter"
    user.div.appendChild(user.meterDiv)

    var meter = new BasicPeakMeter(user.part.postFXGain, user.meterDiv, this.musicContext.audioContext);
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
    this.midi.onnoteon  = (note, velocity) => {
        this.noteOn(note, velocity, this.user)
        console.log(note)
    }
    this.midi.onnoteoff = (note) => this.noteOff(note, this.user)
}


// todo 
/*

pan
fx

more soundsets


disable login button till ready

*/