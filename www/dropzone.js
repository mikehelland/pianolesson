function MusicRoomDropZone(config) {

    this.div = config.div || document.createElement("div")
    this.attachmentList = config.attachmentList || this.div

    this.div.ondragover = (e) => {
        e.preventDefault()
        this.div.classList.add("drop-zone-hover")
    }
    this.div.ondragleave = (e) => {
        e.preventDefault()
        this.div.classList.remove("drop-zone-hover")
    }
    this.div.ondrop = async (e) => {
        e.preventDefault()
        this.div.classList.remove("drop-zone-hover")
    
        var files = []
        var file
        var item
        for (var i = 0; i < e.dataTransfer.items.length; i++) {
            var item = e.dataTransfer.items[i]
            if (item.kind === "file") {
                file = item.getAsFile()
                files.push({file, type: item.type}) 
            }
            else if (item.type === "text/uri-list") {
                item.getAsString(s => files.push({uri: s}))
            }

        }
        

        omg.server.post({
            type: "IMAGESET",
            name: "uploaddraft",
            set: [],
            draft: true,
        }, thing => {
            Promise.all(this.handleDroppedItems(files, thing)).then(values => {
                
                if (thing.set.length > 0) {
                    delete thing.draft
                    thing.name = thing.set[0].name
                    omg.server.post(thing, data => {
                        omg.loadSearchResult(data, {
                            prepend: true, 
                            resultList: this.attachmentList
                        })
                    })
                }
            })
        })

        // we could check to make sure we're logged in, and offer login/signup and make drafts...
        /*
        var ok = await omg.ui.loginRequired()
        if (!ok) {
            return
        }
    
        if (items) {
            if (draftPost && draftPost.id) {
                handleDroppedItems(items)
            }
            else {
                omg.server.post(makeDraftPost(), res => {
                    draftPost = res
                    handleDroppedItems(items)
                })
            }
        }*/
    }


}

MusicRoomDropZone.prototype.makeMediaName = function (filename) {
    // just the stem of the filename, no path, no extension, underscores a& dashes to space 
    return filename.split("/").pop().split(".")[0].replace("_", " ").replace("-", " ")
}

MusicRoomDropZone.prototype.handleDroppedItems = function (items, imageset) {
    var promises = []
    
    for (var i = 0; i < items.length; i++) {
        if (items[i].file) {
            promises.push(this.handleDroppedFile(items[i], imageset))
        }
        else if (items[i].uri) {
            this.handleDroppedURI(items[i].uri)
        }
    }
    return promises
}

MusicRoomDropZone.prototype.handleDroppedFile = function (item, imageset) {
    var file = item.file
    var media = {
        mimeType: item.type, //.startsWith("image/")
        url: window.location.origin + "/uploads/" + omg.user.id + "/" + imageset.id + "/" + file.name, 
        name: this.makeMediaName(file.name)
    }
    imageset.set.push(media)
    
    var statusDiv = this.makeAttachmentEl(media)
    statusDiv.innerHTML = "Uploading..."
    
    var fd = new FormData();
    fd.append('setId', imageset.id);
    fd.append('file', file);
    fd.append('filename', file.name);
    
    var promise = new Promise((resolve, reject) => {
        fetch("/upload", {method: "POST", body: fd, credentials: "include"}).then(res => res.json()).then(res => {
            statusDiv.innerHTML = res.success ? 
                "<font color='green'>Uploaded</font>" : ("<font color='red'>Error</font> " + res.error)
    
            resolve(res.success)
        });    
    })

    return promise
}



MusicRoomDropZone.prototype.handleDroppedURI = function (uri) {

    console.log("/util/mime-type?uri=" + encodeURIComponent(uri))
    omg.server.getHTTP("/util/mime-type?uri=" + encodeURIComponent(uri), res => {
        var media = {
            mimeType: res.mimeType, 
            url: uri, 
            name: makeMediaName(uri)
        }
        imageset.set.push(media)
    
        var statusDiv = makeAttachmentEl(media)
    })    
}

MusicRoomDropZone.prototype.makeAttachmentEl = function (attachment) {
    var div = document.createElement("div")
    div.innerHTML = attachment.name
    div.className = "post-attachment-upload"
    var statusDiv = document.createElement("div")
    statusDiv.className = "post-attachment-upload-status"
    div.appendChild(statusDiv)
    this.attachmentList.appendChild(div)
    return statusDiv
}
