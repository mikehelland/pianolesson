function OMGEmbeddedViewerPIANOLESSON_SESSION (viewer) {
    let data = viewer.data
    let html = `
    <style>.gig-caption{color: #606060; display:inline-block; width:80px}</style>
    <div class='omg-thing-p'>
    <span class="gig-caption">Session: </span>
    ${data.name}
    <br>
    <span class="gig-caption">Link:</span>
    <a href="${data.link}">${data.link}</a>
    <br>
    <span class="gig-caption">Notes:</span>
    ${data.notes || ""}
    </div>
    `
    viewer.embedDiv.innerHTML = html

}
