import { useState, useEffect } from "react";
import "./App.scss";
import microphoneImage from "./assets/images/microphone.svg";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function App() {
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [hidden, setHidden] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [paragraph, setParagraph] = useState("");
  const [volume, setVolume] = useState(0);

  let lang;
  const queryString = window.location.search;
  if (queryString) {
    lang = queryString.split("?")[1];
  } else {
    lang = "pt-br";
  }

  const handleListening = () => {
    setIsListening(true);
    setParagraph("");
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: false,
      language: lang,
    });
  };
  const stopHandle = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
    setParagraph("");
  };
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
      that.instant > 10 && volume < 10 && setVolume(that.instant);
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

  function start() {
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

    setIsListening(true);
    setParagraph("");
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: true,
      language: lang,
    });
  }

  function stop() {
    console.log("Stopping local stream");
    window.stream.getTracks().forEach((track) => track.stop());
    window.soundMeter.stop();
    window.audioContext.close();
    clearInterval(meterRefresh);
  }

  const standartizeWords = (listOfWords) => {
    let resultArray = [];
    for (let i = 0; i < listOfWords.length; i++) {
      const word = listOfWords[i];
      resultArray.push(word.toUpperCase());
    }
    return resultArray;
  };

  const identifyWord = (transcript) => {
    const wordsListened = transcript.split(" ");
    const upperCaseWords = standartizeWords(wordsListened);
    setParagraph(upperCaseWords.join(" "));
    console.log(upperCaseWords);
    if (wordsListened.length === 1) {
      stop();
      setTimeout(() => {
        SpeechRecognition.stopListening();
        setIsListening(false);
        setParagraph("");
        setVolume(0);
      }, 6000);
    }
  };

  useEffect(() => {
    if (transcript !== "") {
      identifyWord(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (volume > 10) {
      setHidden(false);
    } else {
      setHidden(true);
    }
  }, [volume]);

  useEffect(() => {
    if (paragraph !== "") {
      setTimeout(
        () => {
          let utterance = new SpeechSynthesisUtterance(paragraph);
          speechSynthesis.speak(utterance);
        },
        volume > 31 ? 2000 : volume > 10 && volume < 30 ? 3000 : 5000
      );
    }
  }, [paragraph]);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return (
      <>
        <p>Browser does not support Speech recognition</p>
      </>
    );
  }
  return (
    <div className="App">
      <main className="primary-content">
        <div className="tubeArea">
          <div className="tubeFlipped"></div>
        </div>
        <div className="tubeArea">
          <div className="tube"></div>
        </div>
        <p
          className={`${hidden ? "hidden" : null} transcript ${
            volume > 31 ? "fast" : volume > 10 && volume < 30 ? "medium" : null
          }`}
        >
          {paragraph}
        </p>
        <img
          className="microphone"
          src={microphoneImage}
          alt="microphone"
          onClick={start}
        ></img>
        <h1 className="page-title">Diga algo!</h1>
        {isListening && (
          <button className="btn" onClick={stop}>
            Stop
          </button>
        )}
      </main>
    </div>
  );
}

export default App;
