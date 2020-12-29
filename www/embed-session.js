function OMGEmbeddedViewerPIANOLESSON_SESSION (viewer) {
    let data = viewer.data
    let html = `
    <style>.gig-caption{color: #606060; display:inline-block; width:80px}</style>
    <div class='omg-thing-p'>
    <span class="gig-caption">Session Name: </span>
    ${data.name}
    <br>
    <span class="gig-caption">Link:</span>
    ${window.location.host + omg.apps.pianolesson.path + data.name}
    <br>
    <span class="gig-caption">Notes:</span>
    ${data.notes || ""}
    </div>
    `
    viewer.embedDiv.innerHTML = html

}
