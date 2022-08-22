import { useState, useEffect, useRef } from "react";
import "./App.scss";
import microphoneImage from "./assets/images/microphone.svg";
import noSupport from "./assets/images/sad.png";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function App() {
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [isListening, setIsListening] = useState(false);
  const [paragraph, setParagraph] = useState("");
  const [volume, setVolume] = useState(0);
  const [hidden, setHidden] = useState(true);
  const paragraphRef = useRef("");
  let lang;
  const queryString = window.location.search;
  queryString ? (lang = queryString.split("?")[1]) : (lang = "pt-br");

  function SoundMeter(context) {
    this.context = context;
    this.instant = 0.0;
    this.script = context.createScriptProcessor(2048, 1, 1);
    const that = this;
    this.script.onaudioprocess = function (event) {
      const input = event.inputBuffer.getChannelData(0);
      let i;
      let sum = 0.0;
      for (i = 0; i < input.length; ++i) {
        sum += input[i] * input[i];
      }
      that.instant = Math.sqrt(sum / input.length) * 100;
      console.log(that.instant);
      that.instant > 10 && setVolume(that.instant);
    };
  }

  SoundMeter.prototype.connectToSource = function (stream, callback) {
    console.log("SoundMeter connecting");
    try {
      this.mic = this.context.createMediaStreamSource(stream);
      this.mic.connect(this.script);
      // necessary to make sample run, but should not be.
      this.script.connect(this.context.destination);
      if (typeof callback !== "undefined") {
        callback(null);
      }
    } catch (e) {
      console.error(e);
      if (typeof callback !== "undefined") {
        callback(e);
      }
    }
  };

  SoundMeter.prototype.stop = function () {
    console.log("SoundMeter stopping");
    this.mic.disconnect();
    this.script.disconnect();
  };

  const constraints = (window.constraints = {
    audio: true,
    video: false,
  });

  let meterRefresh = null;

  function handleSuccess(stream) {
    window.stream = stream;
    const soundMeter = (window.soundMeter = new SoundMeter(
      window.audioContext
    ));
    soundMeter.connectToSource(stream, function (e) {
      if (e) {
        alert(e);
        return;
      }
    });
  }

  function handleError(error) {
    console.log(
      "navigator.MediaDevices.getUserMedia error: ",
      error.message,
      error.name
    );
  }

  function startVolumeMeter() {
    console.log("Requesting local stream");

    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      window.audioContext = new AudioContext();
    } catch (e) {
      alert("Web Audio API not supported.");
    }

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(handleSuccess)
      .catch(handleError);
  }

  function stopVolumeMeter() {
    console.log("Stopping local stream");
    window.stream.getTracks().forEach((track) => track.stop());
    window.soundMeter.stop();
    window.audioContext.close();
    clearInterval(meterRefresh);
  }

  const handleClick = () => {
    setIsListening(true);
    SpeechRecognition.startListening({
      continuous: false,
      language: lang,
    });
    startVolumeMeter();
  };

  const finishPlay = () => {
    let utterance = new SpeechSynthesisUtterance(paragraphRef.current);
    utterance.lang = "pt-BR";
    speechSynthesis.speak(utterance);
    setParagraph("");
    paragraphRef.current = "";
    setVolume(0);
    setHidden(true);
  };

  useEffect(() => {
    if (volume > 0) {
      console.log("Volume:", volume);
      stopVolumeMeter();
    }
  }, [volume]);

  useEffect(() => {
    if (transcript !== "") {
      console.log("Transcrição:", transcript);
      setParagraph(transcript);
      paragraphRef.current = transcript;
      SpeechRecognition.stopListening();
    }
  }, [transcript]);

  useEffect(() => {
    if (volume > 0 && transcript !== "") {
      setIsListening(false);
      setHidden(false);
    }
  }, [volume, transcript]);

  useEffect(() => {
    const p = document.querySelector(".transcript");
    p?.addEventListener("animationend", finishPlay);
  }, []);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return (
      <div
        style={{
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          width: "100vw",
          height: "100vh",
          fontSize: "30px",
        }}
      >
        <img alt={"sad"} src={noSupport}></img>
        <p
          style={{
            color: "white",
            fontSize: "30px",
          }}
        >
          Este navegador não suporta reconhecimento de voz
        </p>
      </div>
    );
  } else {
    return (
      <div className="App">
        <main className="primary-content">
          <img
            className="microphone"
            src={microphoneImage}
            alt="microphone"
            onClick={handleClick}
          ></img>
          <div className="tubeArea">
            <div className="tubeFlipped"></div>
          </div>
          <div className="tubeArea">
            <div className="tube"></div>
          </div>
          <p
            data-transcript={paragraph}
            className={`${hidden ? "hidden" : null} transcript ${
              volume > 31
                ? "fast"
                : volume > 20 && volume < 30
                ? "medium"
                : "slow"
            }`}
          ></p>
        </main>
      </div>
    );
  }
}

export default App;
