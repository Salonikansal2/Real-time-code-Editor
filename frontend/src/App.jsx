import "./App.css";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import { Editor } from "@monaco-editor/react";

const socket = io("https://real-time-code-editor-rxzm.onrender.com");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [userName, setUsername] = useState("");
  const [language, setLanguage] = useState("java");
  const [code, setCode] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [outPut, setOutPut] = useState("");
  const [version, setVersion] = useState("*");

  useEffect(() => {
    socket.on("user joined", (users) => {
      setUsers(users);
    });
    socket.on("codeupdate", (newcode) => {
      setCode(newcode);
    });
    socket.on("user-typing", (user) => {
      setTyping(`${user} is Typing.....`);
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });
    socket.on("codeResponse", (response) => {
      setOutPut(response.run.output);
    });

    return () => {
      socket.off("user joined");
      socket.off("codeupdate");
      socket.off("user-typing");
      socket.off("languageUpdate");
      socket.off("codeResponse");
    };
  }, []);

  useEffect(() => {
    const handlebeforeunload = (e) => {
      socket.emit("Leave");
    };
    window.addEventListener("beforeunload", handlebeforeunload);
    return () => {
      window.removeEventListener("beforeunload", handlebeforeunload);
    };
  }, []);

  const handleCodeChange = (newcode) => {
    setCode(newcode);
    socket.emit("codeChange", { roomName, code: newcode });
    socket.emit("typing", { roomName, userName });
  };
  const joinroom = () => {
    if (roomName && userName) {
      socket.emit("join", { roomName, userName });
      setJoined(true);
    }
  };
  const Leave = () => {
    socket.emit("Leave");
    setJoined(false);
    setRoomName("");
    setUsername("");
    setCode("// start code here");
    setLanguage("java");
  };

  const copyRoomName = () => {
    navigator.clipboard.writeText(roomName);
    alert("Room ID copied to clipboard");
  };
  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomName, language: newLanguage });
  };
  const runCode = () => {
    socket.emit("compileCode", { code, roomName, language, version });
  };

  if (!joined) {
    return (
      <div className="joining-container">
        <div className="join-form">
          <h1>Join Code Room</h1>
          <input
            type="text"
            placeholder="RoomId"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />

          <input
            type="text"
            placeholder="Enter userName"
            value={userName}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={joinroom}>Join Room</button>
        </div>
      </div>
    );
  }
  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Room: {roomName}</h2>
          <h2>User: {userName}</h2>
          <button className="copy-button" onClick={copyRoomName}>
            Copy RoomID
          </button>
        </div>
        <h3>Users In The Room</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
        <p className="user-type">{typing}</p>
        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
        </select>
        <button className="leave-button" onClick={Leave}>
          Leave Button
        </button>
      </div>
      <div className="editor">
        <Editor
          height={"60%"}
          defaultLanguage={language}
          language={language}
          value={code}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollbar: { useShadow: false },
            lineNumbers: "off",
            wordWrap: "on",
            fontSize: 14,
            fontFamily: '"Fira Code", monospace',
          }}
        />
        <button className="run-btn" onClick={runCode}>
          Execute
        </button>
        <textarea
          className="output-console"
          value={outPut}
          readOnly
          placeholder="Output will appear here ..."
        />
      </div>
    </div>
  );
};

export default App;
