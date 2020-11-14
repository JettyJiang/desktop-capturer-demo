const {desktopCapturer, ipcRenderer, remote} = require('electron')

const $ = require('jquery');

let localStream
let microAudioStream
let recordedChunks = []
let numRecordedChunks = 0
let recorder
let includeMic = false

function startRecording () {
  desktopCapturer.getSources({ types: ['window', 'screen'] }, function (error, sources) {
    if (error) throw error
    for (let i = 0; i < sources.length; i++) {
      let src = sources[i]
      if (src.name.indexOf("直播间") !== -1) {
        navigator.webkitGetUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: src.id,
              minWidth: 800,
              maxWidth: window.screen.width,
              minHeight: 600,
              maxHeight: window.screen.height
            }
          }
        }, getMediaStream, getUserMediaError)
        return
      }
    }
  })
}

const getMediaStream = (stream) => {
  let video = document.querySelector('video')
  video.src = URL.createObjectURL(stream)
  localStream = stream
  stream.onended = () => { console.log('Media stream ended.') }

  let videoTracks = localStream.getVideoTracks()

  if (includeMic) {
    console.log('Adding audio track.')
    let audioTracks = microAudioStream.getAudioTracks()
    localStream.addTrack(audioTracks[0])
  }
  // if (includeSysAudio) {
  // console.log('Adding system audio track.')
  // let audioTracks = stream.getoAudioTracks()
  // if (audioTracks.length < 1) {
  // console.log('No audio track in screen stream.')
  // }
  // } else {
  // console.log('Not adding audio track.')
  // }
  try {
    console.log('Start recording the stream.')
    recorder = new MediaRecorder(stream)
  } catch (e) {
    console.assert(false, 'Exception while creating MediaRecorder: ' + e)
    return
  }
  recorder.ondataavailable = recorderOnDataAvailable
  recorder.onstop = () => { console.log('recorderOnStop fired') }
  recorder.start()
  console.log('Recorder is started.')
}

const recorderOnDataAvailable = (event) => {
  if (event.data && event.data.size > 0) {
    recordedChunks.push(event.data)
    numRecordedChunks += event.data.byteLength
  }
}

const stopRecording = () => {
  console.log('Stopping record and starting download')
  recorder.stop()
  localStream.getVideoTracks()[0].stop()
  download();
}

const getUserMediaError = () => {
  console.log('getUserMedia() failed.')
}

const download = () => {
  let blob = new Blob(recordedChunks, {type: 'video/webm'})
  let url = URL.createObjectURL(blob)
  let a = document.createElement('a')
  document.body.appendChild(a)
  a.style = 'display: none'
  a.href = url
  a.download = 'electron-screen-recorder.webm'
  a.click()
  setTimeout(function () {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 100)
}

$("#captureScreens").bind("click", function () {
  startRecording();
});
$("#captureScreensStop").bind("click", function () {
  stopRecording();
});
