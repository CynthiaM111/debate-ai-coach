import { useState, useRef } from "react";
import "./DebateCoach.css";

function App() {
    const [argument, setArgument] = useState("");
    const [counterArgument, setCounterArgument] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const utteranceRef = useRef(null);
    const [volume, setVolume] = useState(1);
    const [inputMethod, setInputMethod] = useState("text");
    const [sessionActive, setSessionActive] = useState(false);
    const [currentSession, setCurrentSession] = useState([]);
    const [sessionHistory, setSessionHistory] = useState([]);
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(null);

    const startRecording = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join("");
            setArgument(transcript);
        };

        recognition.onerror = (event) => {
            console.log("Speech recognition error:", event.error);
        };

        recognition.start();
        setIsRecording(true);
        setInputMethod("speech");
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    };

    async function sendArgument(userArgument) {
        if (!userArgument) {
            alert("Please record or enter an argument before submitting.");
            return;
        }

        const response = await fetch("http://127.0.0.1:8000/debate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_argument: userArgument })
        });

        const data = await response.json();
        setCounterArgument(data.counter_argument);
        speakText(data.counter_argument);

        return data.counter_argument;
    }

    const speakText = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.pitch = 1;
        utterance.rate = 1;
        utterance.volume = volume;
        utteranceRef.current = utterance;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
    };

    const stopSpeech = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const startSession = () => {
        setSessionActive(true);
        setCurrentSession([]);
        setArgument("");
        setCounterArgument("");
        setSelectedHistoryIndex(null);
    };

    const endSession = () => {
        if (currentSession.length > 0) {
            setSessionHistory(prev => [...prev, {
                id: Date.now(),
                date: new Date().toLocaleString(),
                exchanges: currentSession
            }]);
        }
        setSessionActive(false);
        setCurrentSession([]);
        setArgument("");
        setCounterArgument("");
    };

    const handleSubmit = async () => {
        if (!argument || !sessionActive) return;

        const coachResponse = await sendArgument(argument);

        const newExchange = {
            userArgument: argument,
            counterArgument: coachResponse
        };

        setCurrentSession(prev => [...prev, newExchange]);
        setArgument("");
    };

    const viewHistorySession = (index) => {
        setSelectedHistoryIndex(index);
        setSessionActive(false);
        setArgument("");
        setCounterArgument("");
    };

    return (
        <div className="app-container">
            <div className="card">
                <h1>Debate Coach</h1>

                <div className="session-controls">
                    {!sessionActive ? (
                        <button className="button" onClick={startSession}>
                            Start New Session
                        </button>
                    ) : (
                        <button className="button button-danger" onClick={endSession}>
                            End Session
                        </button>
                    )}
                </div>

                {sessionActive && (
                    <div className="input-controls">
                        <div className="radio-group">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    value="text"
                                    checked={inputMethod === "text"}
                                    onChange={() => setInputMethod("text")}
                                />
                                Type
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    value="speech"
                                    checked={inputMethod === "speech"}
                                    onChange={() => setInputMethod("speech")}
                                />
                                Speak
                            </label>
                        </div>

                        {inputMethod === "text" && (
                            <textarea
                                placeholder="Type your argument here..."
                                value={argument}
                                onChange={(e) => setArgument(e.target.value)}
                            />
                        )}

                        {inputMethod === "speech" && (
                            <div className="speech-controls">
                                <div className="speech-buttons">
                                    <button
                                        className="button"
                                        onClick={startRecording}
                                        disabled={isRecording}
                                    >
                                        🎙 Record
                                    </button>
                                    <button
                                        className="button"
                                        onClick={stopRecording}
                                        disabled={!isRecording}
                                    >
                                        ⏹ Stop
                                    </button>
                                </div>
                                <p><strong>Recording:</strong> {argument}</p>
                            </div>
                        )}

                        <button
                            className="button"
                            onClick={handleSubmit}
                            disabled={!argument}
                        >
                            Submit Argument
                        </button>
                    </div>
                )}

                {sessionActive && currentSession.length > 0 && (
                    <div className="session-container">
                        <h3 className="session-header">Current Debate</h3>
                        {currentSession.map((exchange, index) => (
                            <div key={index} className="exchange">
                                <p className="user"><strong>You:</strong> {exchange.userArgument}</p>
                                <p className="coach"><strong>Coach:</strong> {exchange.counterArgument}</p>
                            </div>
                        ))}
                    </div>
                )}

                {sessionHistory.length > 0 && (
                    <div className="session-container">
                        <h3 className="session-header">Previous Sessions</h3>
                        {sessionHistory.map((session, index) => (
                            <div key={session.id}>
                                <button
                                    className="button history-button"
                                    onClick={() => viewHistorySession(index)}
                                >
                                    {session.date}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {selectedHistoryIndex !== null && (
                    <div className="session-container">
                        <h3 className="session-header">Session History: {sessionHistory[selectedHistoryIndex].date}</h3>
                        {sessionHistory[selectedHistoryIndex].exchanges.map((exchange, index) => (
                            <div key={index} className="exchange">
                                <p className="user"><strong>You:</strong> {exchange.userArgument}</p>
                                <p className="coach"><strong>Coach:</strong> {exchange.counterArgument}</p>
                            </div>
                        ))}
                        <button
                            className="button button-secondary"
                            onClick={() => setSelectedHistoryIndex(null)}
                        >
                            Close History
                        </button>
                    </div>
                )}

                {sessionActive && (
                    <div className="audio-controls">
                        <button
                            className="button"
                            onClick={stopSpeech}
                            disabled={!isSpeaking}
                        >
                            Stop Speech
                        </button>
                        <div>
                            <label className="volume-label">
                                Volume: {Math.round(volume * 100)}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={volume}
                                onChange={(e) => setVolume(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;