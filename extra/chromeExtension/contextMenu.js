function stream(info, tab) {
  console.log(info, tab);
  chrome.tabs.create({
    url: "http://localhost:3000/#/play/" + encodeURIComponent(info.linkUrl)
  }, function(tab){
    console.log(tab);
  })
}

chrome.contextMenus.create({
  title: "Stream torrent",
  contexts: ["link"],
  onclick: stream
}, function () {
  if (chrome.extension.lastError) {
    console.log("Got expected error: " + chrome.extension.lastError.message);
  }
});
