
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";


export default function App() {
  const [videoFile, setVideoFile] = useState(null);
  const [srtFile, setSrtFile] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [currentSubtitle, setCurrentSubtitle] = useState("");
  const [savedWords, setSavedWords] = useState([]);
  const [savedPhrases, setSavedPhrases] = useState([]);
  const [videoTitle, setVideoTitle] = useState("");
  const [phraseMode, setPhraseMode] = useState(false);
  const [phraseStartIdx, setPhraseStartIdx] = useState(null);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const videoRef = useRef(null);
  const subtitleOverlayRef = useRef(null);

  // إعدادات الترجمة
  const [subtitleColor, setSubtitleColor] = useState(localStorage.getItem("subtitleColor") || "#ffff00");
  const [subtitleBg, setSubtitleBg] = useState(localStorage.getItem("subtitleBg") || "transparent");
  const [subtitleSize, setSubtitleSize] = useState(localStorage.getItem("subtitleSize") || "20px");

  // حفظ الإعدادات في LocalStorage
  useEffect(() => {
    localStorage.setItem("subtitleColor", subtitleColor);
    localStorage.setItem("subtitleBg", subtitleBg);
    localStorage.setItem("subtitleSize", subtitleSize);
  }, [subtitleColor, subtitleBg, subtitleSize]);

  function parseSRT(text) {
    const entries = [];
    const blocks = text.split(/\n\n+/);
    for (const block of blocks) {
      const lines = block.split("\n");
      if (lines.length >= 3) {
        const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (timeMatch) {
          const start =
            parseInt(timeMatch[1]) * 3600 +
            parseInt(timeMatch[2]) * 60 +
            parseInt(timeMatch[3]) +
            parseInt(timeMatch[4]) / 1000;
          const end =
            parseInt(timeMatch[5]) * 3600 +
            parseInt(timeMatch[6]) * 60 +
            parseInt(timeMatch[7]) +
            parseInt(timeMatch[8]) / 1000;
          const text = lines.slice(2).join(" ");
          entries.push({ start, end, text });
        }
      }
    }
    return entries;
  }

  function handleSrtUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseSRT(text);
      setSubtitles(parsed);
    };
    reader.readAsText(file);
  }

  function handleWordClick(word, idx, words) {
    if (phraseMode) {
      if (phraseStartIdx === null) {
        setPhraseStartIdx(idx);
      } else {
        const start = Math.min(phraseStartIdx, idx);
        const end = Math.max(phraseStartIdx, idx);
        const phrase = words.slice(start, end + 1).join(" ");
        if (!savedPhrases.includes(phrase)) {
          setSavedPhrases([...savedPhrases, phrase]);
        }
        setPhraseStartIdx(null);
      }
    } else {
      if (!savedWords.some((w) => (typeof w === "string" ? w === word : w.word === word))) {
        setSavedWords([...savedWords, word]);
      }
    }
  }

  function toggleLearned(item, type) {
    if (type === "word") {
      setSavedWords(
        savedWords.map((w) =>
          typeof w === "string"
            ? w === item
              ? { word: item, learned: true }
              : w
            : w.word === item
            ? { ...w, learned: !w.learned }
            : w
        )
      );
    } else {
      setSavedPhrases(
        savedPhrases.map((p) =>
          typeof p === "string"
            ? p === item
              ? { phrase: item, learned: true }
              : p
            : p.phrase === item
            ? { ...p, learned: !p.learned }
            : p
        )
      );
    }
  }

  function deleteItem(item, type) {
    if (type === "word") {
      setSavedWords(savedWords.filter((w) => (typeof w === "string" ? w !== item : w.word !== item)));
    } else {
      setSavedPhrases(savedPhrases.filter((p) => (typeof p === "string" ? p !== item : p.phrase !== item)));
    }
  }

  function getItemState(item, type) {
    const list = type === "word" ? savedWords : savedPhrases;
    const found = list.find((w) =>
      typeof w === "string" ? w === item : (type === "word" ? w.word === item : w.phrase === item)
    );
    return typeof found === "object" && found.learned;
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current && subtitles.length > 0) {
        const currentTime = videoRef.current.currentTime;
        const current = subtitles.find((s) => currentTime >= s.start && currentTime <= s.end);
        setCurrentSubtitle(current ? current.text : "");
      }
    }, 300);
    return () => clearInterval(interval);
  }, [subtitles]);

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardContent className="space-y-2">
          <div>
            <label className="block font-medium">تحميل الفيديو</label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                setVideoFile(URL.createObjectURL(e.target.files[0]));
                setVideoTitle(e.target.files[0].name);
              }}
            />
          </div>
          <div>
            <label className="block font-medium">تحميل ملف الترجمة</label>
            <input
              type="file"
              accept=".srt"
              onChange={(e) => handleSrtUpload(e.target.files[0])}
            />
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={phraseMode}
              onChange={() => {
                setPhraseMode(!phraseMode);
                setPhraseStartIdx(null);
              }}
            />
            <span>Phrase Mode</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showSubtitles}
              onChange={() => setShowSubtitles(!showSubtitles)}
            />
            <span>إظهار الترجمة</span>
          </label>
        </CardContent>
      </Card>

      {/* إعدادات الترجمة */}
      <Card>
        <CardContent className="space-y-2">
          <h2 className="font-bold text-lg">إعدادات الترجمة</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              لون النص:
              <input
                type="color"
                value={subtitleColor}
                onChange={(e) => setSubtitleColor(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2">
              لون الخلفية:
              <input
                type="color"
                value={subtitleBg}
                onChange={(e) => setSubtitleBg(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2">
              حجم الخط:
              <input
                type="number"
                min="10"
                max="50"
                value={parseInt(subtitleSize)}
                onChange={(e) => setSubtitleSize(e.target.value + "px")}
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {videoFile && (
        <div className="relative">
          <video
            ref={videoRef}
            src={videoFile}
            controls
            className="w-full max-h-[400px]"
          />
          {showSubtitles && (
            <div
              ref={subtitleOverlayRef}
              className="absolute bottom-12 w-full text-center py-1"
              style={{
                color: subtitleColor,
                backgroundColor: subtitleBg,
                fontSize: subtitleSize,
              }}
            >
              {currentSubtitle.split(" ").map((word, idx, arr) => (
                <button
                  key={idx}
                  className="mx-1 hover:underline"
                  onClick={() => handleWordClick(word, idx, arr)}
                >
                  {word}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {(savedWords.length > 0 || savedPhrases.length > 0) && (
        <Card>
          <CardContent>
            <h2 className="text-xl font-bold mb-2">المحفوظات ({videoTitle})</h2>
            {savedWords.length > 0 && (
              <>
                <h3 className="text-lg font-semibold">كلمات</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {savedWords.map((w, idx) => {
                    const word = typeof w === "string" ? w : w.word;
                    const learned = getItemState(word, "word");
                    return (
                      <div key={"word-" + idx} className="relative">
                        <Button
                          variant={learned ? "secondary" : "default"}
                          onClick={() => toggleLearned(word, "word")}
                        >
                          {word} {learned ? "✔" : ""}
                        </Button>
                        <span
                          onClick={() => deleteItem(word, "word")}
                          className="absolute -top-1 -right-1 cursor-pointer text-red-600 font-bold"
                        >
                          ×
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {savedPhrases.length > 0 && (
              <>
                <h3 className="text-lg font-semibold">عبارات</h3>
                <div className="flex flex-wrap gap-2">
                  {savedPhrases.map((p, idx) => {
                    const phrase = typeof p === "string" ? p : p.phrase;
                    const learned = getItemState(phrase, "phrase");
                    return (
                      <div key={"phrase-" + idx} className="relative">
                        <Button
                          variant={learned ? "secondary" : "default"}
                          onClick={() => toggleLearned(phrase, "phrase")}
                        >
                          {phrase} {learned ? "✔" : ""}
                        </Button>
                        <span
                          onClick={() => deleteItem(phrase, "phrase")}
                          className="absolute -top-1 -right-1 cursor-pointer text-red-600 font-bold"
                        >
                          ×
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
