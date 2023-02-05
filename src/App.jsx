import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./App.scss";
import microphoneImage from "./assets/images/microphone.svg";
import noSupport from "./assets/images/sad.png";
import logo from "./assets/images/logoladif.png";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function App() {
  const { pathname } = useLocation();
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [admin, setAdmin] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [paragraph, setParagraph] = useState("");
  const [volume, setVolume] = useState(0);
  const [hidden, setHidden] = useState(true);
  const paragraphRef = useRef("");
  const [fallenWords, setFallenWords] = useState([]);
  const fallenWordsRef = useRef([]);
  const volumeRef = useRef(0);
  let lang;
  const queryString = window.location.search;
  queryString ? (lang = queryString.split("?")[1]) : (lang = "pt-br");

  const [volumeMin, setVolumeMin] = useState(
    Number(localStorage.getItem("volumeMin") || 2)
  );
  const [volumeMinHit, setVolumeMinHit] = useState(
    Number(localStorage.getItem("volumeMinHit") || 10)
  );
  const [volumeMax, setVolumeMax] = useState(
    Number(localStorage.getItem("volumeMax") || 20)
  );
  const handleChangeMin = (event) => setVolumeMin(event.target.value);
  const handleChangeMinHit = (event) => setVolumeMinHit(event.target.value);
  const handleChangeMax = (event) => setVolumeMax(event.target.value);

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
      that.instant > 2 && setVolume(that.instant);
      if (that.instant > 2) {
        volumeRef.current = that.instant;
      }
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

  const stopListening = () => {
    setIsListening(false);
  };

  const finishPlay = () => {
    let utterance = new SpeechSynthesisUtterance(paragraphRef.current);
    utterance.lang = "pt-BR";
    volumeRef.current > 10 &&
      volumeRef.current < 20 &&
      speechSynthesis.speak(utterance);
    setFallenWords(fallenWordsRef.current);
    setVolume(0);
    setHidden(true);
  };

  useEffect(() => {
    if (fallenWords.length > 0) {
      setParagraph("");
      paragraphRef.current = "";
      // if (fallenWords.length === fallenWordsRef.current.length) {
      // const minIndice = Math.min(...fallenWords.map((o) => o.indice));
      //console.log(minIndice, "MIN_INDICE");
      //setTimeout(() => {
      //const xFallenWords = [...fallenWords];
      //const minIndex = xFallenWords.findIndex((value) => {
      //console.log(value);
      //return value.indice === minIndice;
      //});
      //console.log(minIndex, "MIN_INDEX");
      //xFallenWords.splice(minIndex, 2);
      //console.log(xFallenWords, "after Splice");
      //setFallenWords(xFallenWords);
      //}, 60000);
      //}
    }
  }, [fallenWords]);

  useEffect(() => {
    const xVolumeMin = Number(localStorage.getItem("volumeMin"));
    const xMinimo = xVolumeMin ? xVolumeMin : 2;
    if (volume > xMinimo) {
      console.log("Volume:", volume);
      stopVolumeMeter();
    }
  }, [volume]);

  useEffect(() => {
    if (transcript !== "") {
      console.log("Transcrição:", transcript);
      setParagraph(transcript);
      paragraphRef.current = transcript;
      const xVolumeMinHit = Number(localStorage.getItem("volumeMinHit"));
      const xMinimoHit = xVolumeMinHit ? xVolumeMinHit : 10;
      const xVolumeMax = Number(localStorage.getItem("volumeMax"));
      const xMaximo = xVolumeMax ? xVolumeMax : 20;
      if (volume > xMaximo || volume < xMinimoHit) {
        const xParagraph = transcript;
        const current = [...fallenWords];
        const x1stHalf = xParagraph.substring(
          0,
          Math.round(xParagraph.length / 2)
        );
        const x2ndHalf = xParagraph.substring(
          Math.round(xParagraph.length / 2),
          xParagraph.length
        );
        const xCurrentLengthBeforePush1 = current.length;
        current.push({
          text: x1stHalf,
          position: `${volume > xMaximo ? 96 : Math.random() * 50}%`,
          rotation: `${Math.random() * 30}deg`,
          indice: xCurrentLengthBeforePush1,
        });
        const xCurrentLengthBeforePush2 = current.length;
        current.push({
          text: x2ndHalf,
          position: `${
            volume > xMaximo
              ? 96 + (x2ndHalf.length * 9) / 4
              : Math.random() * 50 + (x2ndHalf.length * 9) / 4
          }%`,
          rotation: `-${Math.random() * 30}deg`,
          indice: xCurrentLengthBeforePush2,
        });
        fallenWordsRef.current = current;
      }
      SpeechRecognition.stopListening();
    }
  }, [transcript]);

  useEffect(() => {
    const xVolumeMin = Number(localStorage.getItem("volumeMin"));
    const xMinimo = xVolumeMin ? xVolumeMin : 2;
    console.log("Transcript:", transcript);
    if (volume > xMinimo && transcript !== "") {
      setIsListening(false);
      setHidden(false);
    }
  }, [volume, transcript]);

  useEffect(() => {
    if (volumeMin) {
      localStorage.setItem("volumeMin", volumeMin);
    }
  }, [volumeMin]);

  useEffect(() => {
    if (volumeMinHit) {
      localStorage.setItem("volumeMinHit", volumeMinHit);
    }
  }, [volumeMinHit]);

  useEffect(() => {
    if (volumeMax) {
      localStorage.setItem("volumeMax", volumeMax);
    }
  }, [volumeMax]);

  useEffect(() => {
    const p = document.querySelector(".transcript");
    p?.addEventListener("animationstart", stopListening);
    p?.addEventListener("animationend", finishPlay);
    if (pathname === "/admin-ladif") {
      setAdmin(true);
    }
  }, []);

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return (
      <div
        style={{
          backgroundColor: "white",
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
            color: "black",
            fontSize: "30px",
          }}
        >
          Este navegador não suporta reconhecimento de voz. Tente utilizar um
          navegador diferente ou mais recente!
        </p>
      </div>
    );
  } else {
    return (
      <div className="App">
        <main className="primary-content">
          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              marginTop: "8px",
            }}
          >
            <div style={{ alignSelf: "center", justifySelf: "end" }}>
              {/*  <img
                width={"200px"}
                height={"50px"}
                alt="logo ladif"
                src={logo}
          ></img> */}
            </div>
            <div
              style={{
                alignSelf: "start",
                justifySelf: "s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexDirection: "column",
                }}
              >
                <img
                  className={isListening ? "microphoneListening" : "microphone"}
                  src={microphoneImage}
                  alt="microphone"
                  onClick={handleClick}
                ></img>
                <div style={{ height: "32px" }}></div>
                {admin && (
                  <div
                    style={{
                      backgroundColor: "#fff",
                      padding: "8px",
                      borderRadius: "5px",
                      marginRight: "8px",
                      border: "1px solid #000",
                      boxShadow: "rgba(0, 0, 0, 0.35) 0px 5px 15px",
                    }}
                  >
                    <div
                      style={{
                        textAlign: "left",
                        marginBottom: "8px",
                        fontWeight: "bold",
                      }}
                    >
                      Configurações
                    </div>

                    <label style={{ fontSize: "14px" }}>Valor mínimo: </label>
                    <input
                      type="number"
                      style={{ width: "50px", borderRadius: "5px" }}
                      onChange={handleChangeMin}
                      value={volumeMin}
                    />
                    <br />
                    <label style={{ fontSize: "14px" }}>
                      Valor mínimo para acertar o cano:{" "}
                    </label>
                    <input
                      type="number"
                      style={{ width: "50px", borderRadius: "5px" }}
                      onChange={handleChangeMinHit}
                      value={volumeMinHit}
                    />
                    <br />
                    <label style={{ fontSize: "14px" }}>
                      Valor máximo para acertar o cano:{" "}
                    </label>
                    <input
                      type="number"
                      style={{ width: "50px", borderRadius: "5px" }}
                      onChange={handleChangeMax}
                      value={volumeMax}
                    />
                    <hr />
                    <div
                      style={{
                        textAlign: "left",
                        fontSize: "12px",
                        marginTop: "8px",
                      }}
                    >
                      Instruções:
                      <br />• <u>Valor mínimo:</u> <b>Menor</b> valor de volume
                      da voz, a ser considerado como palavra, e não como ruído
                      de fundo. (Padrão: 2)
                      <br />
                      <i style={{ fontSize: "8px" }}>
                        Valores excessivamente baixos podem causar mau
                        funcionamento do sistema, pois isto fará serem captados
                        ruídos e barulhos como palavras.
                      </i>
                      <div style={{ height: "8px" }}></div>•{" "}
                      <u>Valor mínimo para acertar o cano:</u> <b>Menor</b>{" "}
                      valor de volume da voz, para acertar dentro do cano.
                      (Padrão: 10)
                      <br />
                      <i style={{ fontSize: "8px" }}>
                        Ou seja, volumes menores que este, farão a palavra cair
                        à esquerda do cano.
                      </i>
                      <div style={{ height: "8px" }}></div> •{" "}
                      <u>Valor máximo para acertar o cano:</u> <b>Maior</b>{" "}
                      valor de volume da voz, para acertar dentro do cano.
                      (Padrão: 20)
                      <br />
                      <i style={{ fontSize: "8px" }}>
                        Ou seja, volumes maiores que este, farão a palavra cair
                        à direita do cano. <br />
                        Valores acima de 35 não são recomendados, pois
                        dificilmente são atingidos.
                      </i>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                alignSelf: "start",
                justifySelf: "center",
              }}
            >
              <p
                style={{
                  color: "#fff",
                  fontSize: "8px",
                  marginTop: "15px",
                  textShadow:
                    "0em 0.01em #000, 0em 0.02em #000, 0em 0.02em 0.03em #000, -0.01em 0.01em #000, -0.02em 0.02em #000, -0.03em 0.03em #000, -0.04em 0.04em #000, -0.01em -0.01em 0.03em #000, -0.02em -0.02em 0.03em #000, -0.03em -0.03em 0.03em #000",
                }}
              >
                Desenvolvido por{" "}
                <a
                  style={{
                    color: "#fff",
                    textUnderlineOffset: "1px",
                    textShadow:
                      "0em 0.01em #000, 0em 0.02em #000, 0em 0.02em 0.03em #000, -0.01em 0.01em #000, -0.02em 0.02em #000, -0.03em 0.03em #000, -0.04em 0.04em #000, -0.01em -0.01em 0.03em #000, -0.02em -0.02em 0.03em #000, -0.03em -0.03em 0.03em #000",
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://github.com/willlucas1512"
                >
                  William Lucas
                </a>
              </p>
              {isListening && <p className={"listening"}>Escutando</p>}
              {(volume > Number(localStorage.getItem("volumeMin")) ||
                volume > 2) &&
                !isListening && (
                  <p className={"volume"}>Volume: {Math.round(volume)}</p>
                )}
            </div>
          </div>
          <div className="tubeArea">
            <div className="tubeFlipped"></div>
          </div>
          <div className="tubeArea">
            <div className="tube"></div>
          </div>
          <p
            data-transcript={paragraph}
            className={`${hidden ? "hidden" : null} transcript ${
              volume > Number(localStorage.getItem("volumeMax")) || volume > 20
                ? "missHigh"
                : (volume > Number(localStorage.getItem("volumeMinHit")) ||
                    volume > 10) &&
                  (volume < Number(localStorage.getItem("volumeMax")) ||
                    volume < 20)
                ? "hit"
                : "miss"
            }`}
          ></p>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              width: "100vw",
              height: "100px",
            }}
          >
            {fallenWords.map((item, idx) => {
              return (
                <p
                  style={{
                    color: "#000",
                    WebkitTextStroke: "1px #000",
                    //textShadow: "2px 2px 4px darkblue",
                    fontSize: "30px",
                    transform: `rotate(${item.rotation})`,
                    position: "absolute",
                    left: item.position,
                    bottom: 0,
                    margin: 0,
                  }}
                  key={idx}
                >
                  {item.text}
                </p>
              );
            })}
          </div>
        </main>
      </div>
    );
  }
}

export default App;
