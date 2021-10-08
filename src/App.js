import { useState, useEffect, useRef } from "react";
import "./App.css";
import microphoneImage from "./assets/images/microphone.svg";
import win from "./assets/audios/win.mp3";
import lose from "./assets/audios/lose.mp3";
import $ from "jquery";
import classNames from "classnames";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

function App() {
  const { transcript, resetTranscript } = useSpeechRecognition();
  const [color, setColor] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [paragraph, setParagraph] = useState("");
  const [blueLight, setBlueLight] = useState(false);
  const [redLight, setRedLight] = useState(false);
  const [yellowLight, setYellowLight] = useState(false);
  const [greenLight, setGreenLight] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const game = useRef({
    status: "off",
    strict: "off",
    score: "--",
    gameSequence: [],
    playerSequence: [],
    timestep: 1000,
    allowPress: true,
  });

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
      continuous: true,
      language: lang,
    });
  };
  const stopHandle = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
    setParagraph("");
  };

  let audio = [
    "https://s3.amazonaws.com/freecodecamp/simonSound3.mp3",
    "https://s3.amazonaws.com/freecodecamp/simonSound2.mp3",
    "https://s3.amazonaws.com/freecodecamp/simonSound1.mp3",
    "https://s3.amazonaws.com/freecodecamp/simonSound4.mp3",
    win,
    lose,
  ];
  let sounds = {
    0: new Audio(audio[0]),
    1: new Audio(audio[1]),
    2: new Audio(audio[2]),
    3: new Audio(audio[3]),
    4: new Audio(audio[4]),
    5: new Audio(audio[5]),
  };

  let colors = {
    blueOn: "#7baefe",
    blueOff: "#2659a9",
    redOn: "#fb7b7b",
    redOff: "#d62626",
    yellowOn: "#fff57b",
    yellowOff: "#eec026",
    greenOn: "#7bfb99",
    greenOff: "#26b644",
  };

  let counter = 0;

  // Reset game to initial state
  function resetGame() {
    game.current = {
      status: "off",
      strict: "off",
      score: "--",
      gameSequence: [],
      playerSequence: [],
      timestep: 1000,
      allowPress: true,
    };
    counter = 0;
    setGameActive(false);
    setParagraph("");
    setColor("");
    $("#score-screen").attr("placeholder", game.current.score);
    $(".strict-led").css("background-color", "#460000");
  }

  // Add a number to the game sequence
  function addNumber() {
    game.current.gameSequence.push(Math.floor(Math.random() * 4));
    game.current.score === "--"
      ? (game.current.score = 1)
      : (game.current.score += 1);
    $("#score-screen").attr("placeholder", game.current.score);
  }

  // Play the game sequence
  function playSequence() {
    setColor("");
    setParagraph("");
    // If score is 5 (or somehow above), the player has won
    if (game.current.score >= 5) {
      winScreen();
    } else {
      $("#btn-start").css("background-color", colors.greenOn);
      game.current.allowPress = false;
      // Timestep gets shorter with each addition to the sequence
      game.current.timestep = 1000 - game.current.gameSequence.length * 25;
      game.current.gameSequence.forEach(function (button, counter) {
        setTimeout(function () {
          playSound(button);
        }, game.current.timestep * (counter + 1));
      });
      setTimeout(function () {
        game.current.allowPress = true;
        $("#btn-start").css("background-color", colors.greenOff);
      }, game.current.timestep * (game.current.gameSequence.length + 1));
    }
  }

  // Check if player's input matches the game sequence
  function checkSequence() {
    const index = game.current.playerSequence.length - 1;
    // If they do not match, run wrongButton function
    if (
      game.current.playerSequence[index] != game.current.gameSequence[index]
    ) {
      game.current.playerSequence = [];
      wrongButton();
      return false;
    }
    // If they do match and the sequences are the same length, add another number to the sequence
    if (
      game.current.playerSequence[index] === game.current.gameSequence[index] &&
      game.current.playerSequence.length === game.current.gameSequence.length
    ) {
      game.current.playerSequence = [];
      game.current.allowPress = false;
      setTimeout(function () {
        addNumber();
        playSequence();
      }, 1000);
    }
    // If they match but the lengths are not the same, do nothing
    else if (
      game.current.playerSequence[index] === game.current.gameSequence[index]
    ) {
      return true;
    }
    // Otherwise, assume wrong button input
    else {
      game.current.playerSequence = [];
      wrongButton();
      return false;
    }
  }

  function wrongButton() {
    setParagraph("");
    game.current.allowPress = false;
    $("#score-screen").attr("placeholder", "X");
    sounds[5].play();

    setTimeout(function () {
      resetGame();
    }, 4000);
  }

  // Play sound function - also animates the button flashes
  function playSound(btnNum) {
    switch (btnNum) {
      case 0:
        setBlueLight(true);
        setTimeout(() => {
          setBlueLight(false);
        }, 400);
        break;
      case 1:
        setRedLight(true);
        setTimeout(() => {
          setRedLight(false);
        }, 400);
        break;
      case 2:
        setYellowLight(true);
        setTimeout(() => {
          setYellowLight(false);
        }, 400);
        break;
      case 3:
        setGreenLight(true);
        setTimeout(() => {
          setGreenLight(false);
        }, 400);
        break;
    }
    sounds[btnNum].play();
  }

  function winScreen() {
    $("#score-screen").attr("placeholder", ":)");
    playSound(4);
    const cycle = setInterval(function () {
      setBlueLight(true);
      setTimeout(() => {
        setBlueLight(false);
      }, 400);
      setRedLight(true);
      setTimeout(() => {
        setRedLight(false);
      }, 400);
      setYellowLight(true);
      setTimeout(() => {
        setYellowLight(false);
      }, 400);
      setGreenLight(true);
      setTimeout(() => {
        setGreenLight(false);
      }, 400);
    }, 400);
    setTimeout(function () {
      clearInterval(cycle);
      resetGame();
    }, 2800);
  }

  const handleStart = () => {
    if (game.current.allowPress && !gameActive) {
      setGameActive(true);
      addNumber();
      playSequence();
    }
  };

  const handleReset = () => {
    if (game.current.allowPress) {
      resetGame();
    }
  };

  const handleGameButton = (pId) => {
    if (game.current.allowPress) {
      const id = pId;
      const button = parseInt(id.substr(id.length - 1));
      playSound(button);
      if (gameActive) {
        game.current.playerSequence.push(button);
        checkSequence();
      }
    }
  };

  const handleColorWVoice = (btnId) => {
    handleGameButton(btnId);
    resetTranscript();
  };

  const handleTextColor = (wordsListened, color, index) => {
    const firstPiece = wordsListened.slice(0, index).join(" ");
    setColor(color);
    setParagraph(firstPiece);
  };

  const standartizeWords = (listOfWords) => {
    let resultArray = [];
    for (let i = 0; i < listOfWords.length; i++) {
      const word = listOfWords[i];
      resultArray.push(word.toLowerCase());
    }
    return resultArray;
  };

  const identifyColor = (transcript) => {
    const wordsListened = transcript.split(" ");
    const lowerCaseWords = standartizeWords(wordsListened);
    const indexRed = lowerCaseWords.indexOf("vermelho");
    const indexBlue = lowerCaseWords.indexOf("azul");
    const indexYellow = lowerCaseWords.indexOf("amarelo");
    const indexGreen = lowerCaseWords.indexOf("verde");
    if (indexRed !== -1) {
      handleTextColor(lowerCaseWords, "vermelho", indexRed);
      handleColorWVoice("btn1");
    } else if (indexYellow !== -1) {
      handleTextColor(lowerCaseWords, "amarelo", indexYellow);
      handleColorWVoice("btn2");
    } else if (indexGreen !== -1) {
      handleTextColor(lowerCaseWords, "verde", indexGreen);
      handleColorWVoice("btn3");
    } else if (indexBlue !== -1) {
      handleTextColor(lowerCaseWords, "azul", indexBlue);
      handleColorWVoice("btn0");
    } else {
      setParagraph(transcript);
    }
  };

  // Fire when page loads
  useEffect(() => {
    resetGame();
  }, []);

  useEffect(() => {
    if (gameActive && transcript !== "") {
      identifyColor(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (gameActive) {
      handleListening();
    }
  }, [gameActive]);

  const blueBtn = classNames("game-btn", "top-left", {
    btn0On: blueLight,
  });

  const redBtn = classNames("game-btn", "top-right", {
    btn1On: redLight,
  });

  const yellowBtn = classNames("game-btn", "bottom-right", {
    btn2On: yellowLight,
  });

  const greenBtn = classNames("game-btn", "bottom-left", {
    btn3On: greenLight,
  });

  const colorText = classNames({
    green: color === "verde",
    red: color === "vermelho",
    blue: color === "azul",
    yellow: color === "amarelo",
  });

  if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
    return (
      <>
        <p>Browser does not support Speech recognition</p>
      </>
    );
  }
  return (
    <div className="App">
      <header className="heading-title">
        <h1 className="page-title">Simon Says</h1>
      </header>
      <main className="primary-content">
        <div className="play-area">
          <div
            id="btn0"
            onClick={() => handleGameButton("btn0")}
            className={blueBtn}
          ></div>
          <div
            id="btn1"
            onClick={() => handleGameButton("btn1")}
            className={redBtn}
          ></div>
          <div
            id="btn2"
            onClick={() => handleGameButton("btn2")}
            className={yellowBtn}
          ></div>
          <div
            id="btn3"
            onClick={() => handleGameButton("btn3")}
            className={greenBtn}
          ></div>
          <div className="center-circle">
            <div className="center-panel">
              <p className="game-title">simon</p>
              <div className="row">
                <div className="buttons">
                  <label className="label" htmlFor="btn-start">
                    START
                  </label>
                  <button
                    onClick={handleStart}
                    className="btn-small"
                    id="btn-start"
                  ></button>
                </div>
                <div className="buttons">
                  <label className="label" htmlFor="btn-reset">
                    RESET
                  </label>
                  <button
                    onClick={handleReset}
                    className="btn-small"
                    id="btn-reset"
                  ></button>
                </div>
              </div>
              <input id="score-screen" placeholder="--" disabled></input>
            </div>
          </div>
        </div>
        <p className="transcript">
          {paragraph}
          <span className={colorText} id="word">
            {color}
          </span>
        </p>
        <img
          className="microphone"
          src={microphoneImage}
          alt="microphone"
          onClick={handleListening}
        ></img>
        {isListening && (
          <button className="btn" onClick={stopHandle}>
            Stop
          </button>
        )}
      </main>
    </div>
  );
}

export default App;
