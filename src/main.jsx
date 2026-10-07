import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { ArrowLeft, ArrowRight, Check, Menu, Target, Volume2, VolumeX, X } from "lucide-react";
import { useLessonAudio } from "../../shared/useLessonAudio";
import { lesson } from "./lesson-data";
import "./styles.css";

const illustrations = import.meta.glob("./assets/illustrations/*.png", { eager: true, query: "?url", import: "default" });
const imageFor = (name) => illustrations[`./assets/illustrations/${name}.png`];

function DetailModal({ content, onClose, onRead }) {
  useEffect(() => {
    const escape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [onClose]);
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        {content.image && <img src={imageFor(content.image)} alt="" />}
        <div>
          <h2 id="detail-title">{content.title}</h2>
          {(Array.isArray(content.text) ? content.text : [content.text]).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {content.bullets && <ul>{content.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>}
          <button className="primary-button unlocked" type="button" onClick={() => { onRead(); onClose(); }}>Continue <ArrowRight /></button>
        </div>
      </section>
    </div>, document.body,
  );
}

function KnowledgeCheck({ quiz, review, onClose, onComplete }) {
  const [picked, setPicked] = useState(review ? quiz.correct : null);
  const correct = picked === quiz.correct;
  return createPortal(
    <div className="modal-backdrop knowledge-backdrop">
      <section className="knowledge-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-title">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close"><X /></button>
        <p className="quiz-label"><Target /> KNOWLEDGE CHECK</p>
        <h2 id="quiz-title">{quiz.question}</h2>
        <div className="answers">{quiz.answers.map((answer, index) => (
          <button type="button" key={answer} disabled={review} className={picked === index ? (correct ? "correct" : "wrong") : ""} onClick={() => setPicked(index)}>
            <span>{String.fromCharCode(65 + index)}</span>{answer}
          </button>
        ))}</div>
        {picked !== null && <div className={`feedback ${correct ? "good" : "bad"}`}><p>{correct ? quiz.correctFeedback : quiz.incorrectFeedback}</p>{!correct && <small>Choose another answer to try again.</small>}</div>}
        {correct && !review && <button className="primary-button unlocked" type="button" onClick={() => { onComplete(); onClose(); }}>Finish check <ArrowRight /></button>}
        {review && <button className="primary-button unlocked" type="button" onClick={onClose}>Done <Check /></button>}
      </section>
    </div>, document.body,
  );
}

function ScreenHeading({ screen }) {
  return <div className="screen-heading"><div><h1>{screen.heading}</h1>{screen.open && <p>{screen.open}</p>}</div>{screen.image && <img src={imageFor(screen.image)} alt="" />}</div>;
}

function RevealScreen({ screen, complete, onReveal, onQuiz }) {
  return <div className="reveal-screen"><ScreenHeading screen={screen} /><button className="primary-cta" type="button" disabled={complete} onClick={onReveal}>{complete ? "Explored" : screen.cta}<ArrowRight /></button>{screen.quiz && complete && <QuizActions ready complete onQuiz={onQuiz} />}</div>;
}

function ExploreScreen({ screen, visited, complete, onVisit, onQuiz }) {
  const [active, setActive] = useState(null);
  const allRead = visited.size === screen.items.length;
  return <div className="explore-screen">
    <ScreenHeading screen={screen} />
    <div className={`item-grid count-${screen.items.length}`}>{screen.items.map((item, index) => {
      const read = visited.has(index);
      return <button className={`explore-card ${read ? "read" : ""}`} type="button" key={item.title} onClick={() => setActive(index)}>
        <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong>{read ? <Check /> : <ArrowRight />}
      </button>;
    })}</div>
    {allRead && screen.after && <div className="exam-signal"><strong>{screen.after.label}</strong><p>{screen.after.text}</p></div>}
    {screen.quiz && <QuizActions ready={allRead} complete={complete} onQuiz={onQuiz} />}
    {active !== null && <DetailModal content={{ ...screen.items[active], image: screen.items[active].image || screen.image }} onClose={() => setActive(null)} onRead={() => onVisit(active)} />}
  </div>;
}

function FlipScreen({ screen, visited, onVisit }) {
  return <div className="explore-screen"><ScreenHeading screen={screen} /><div className={`flip-grid count-${screen.items.length}`}>
    {screen.items.map((item, index) => <button type="button" key={item.title} className={`flip-card ${visited.has(index) ? "flipped" : ""}`} onClick={() => onVisit(index)}>
      <span className="flip-front"><i>{String(index + 1).padStart(2, "0")}</i><strong>{item.title}</strong><small>Click to flip</small></span>
      <span className="flip-back"><Check /><strong>{item.title}</strong><p>{item.text}</p></span>
    </button>)}
  </div></div>;
}

function TabsScreen({ screen, visited, onVisit, complete, onQuiz }) {
  const [active, setActive] = useState(0);
  const allRead = visited.size === screen.items.length;
  const select = (index) => { setActive(index); onVisit(index); };
  return <div className="tabs-screen"><ScreenHeading screen={screen} />
    <div className="tab-picker" role="tablist">{screen.items.map((item, index) => <button type="button" role="tab" aria-selected={active === index} className={active === index ? "active" : ""} key={item.title} onClick={() => select(index)}>{item.title}{visited.has(index) && <Check />}</button>)}</div>
    <div className="tab-panel"><strong>{screen.items[active].subtitle}</strong><p>{screen.items[active].text}</p></div>
    {screen.rule && <div className="rule-note"><strong>Rule of thumb</strong><p>{screen.rule}</p></div>}
    {screen.quiz && <QuizActions ready={allRead} complete={complete} onQuiz={onQuiz} />}
  </div>;
}

function QuizActions({ ready, complete, onQuiz }) {
  return <div className={`knowledge-actions ${complete ? "completed" : ""}`}>{complete ? <><div className="knowledge-complete"><span><Check /></span><div><strong>Knowledge check completed</strong><small>You can review your answer or try again.</small></div></div><div><button type="button" onClick={() => onQuiz("review")}>Review</button><button type="button" onClick={() => onQuiz("attempt")}>Retake</button></div></> : <button className="knowledge-cta" type="button" disabled={!ready} onClick={() => onQuiz("attempt")}><Target />{ready ? "Start knowledge check" : "Explore all items"}</button>}</div>;
}

function CompletionModal({ onClose }) {
  return createPortal(<div className="modal-backdrop"><section className="completion-modal" role="dialog" aria-modal="true"><span className="completion-check"><Check /></span><p>LESSON COMPLETE</p><h2>Lesson {lesson.number}</h2><span>{lesson.title}</span><button className="primary-button unlocked" type="button" onClick={onClose}>Done <Check /></button></section></div>, document.body);
}

function App() {
  const [screenIndex, setScreenIndex] = useState(0);
  const [completed, setCompleted] = useState(() => lesson.screens.map(() => false));
  const [visited, setVisited] = useState({});
  const [focus, setFocus] = useState(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [lessonComplete, setLessonComplete] = useState(false);
  const screen = lesson.screens[screenIndex];
  const currentVisited = useMemo(() => new Set(visited[screen.id] || []), [visited, screen.id]);
  useLessonAudio(soundOn);
  const markComplete = (index = screenIndex) => setCompleted((state) => state.map((value, itemIndex) => itemIndex === index ? true : value));
  const visitItem = (itemIndex) => setVisited((state) => ({ ...state, [screen.id]: [...new Set([...(state[screen.id] || []), itemIndex])] }));
  useEffect(() => { if (["explore", "flip", "tabs"].includes(screen.type) && !screen.quiz && currentVisited.size === screen.items.length) markComplete(); }, [currentVisited.size, screen.id]);
  const goTo = (index) => { if (index < 0 || index >= lesson.screens.length || (index > screenIndex && !completed[screenIndex])) return; setScreenIndex(index); setOutlineOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const next = () => { if (!completed[screenIndex]) return; screenIndex === lesson.screens.length - 1 ? setLessonComplete(true) : goTo(screenIndex + 1); };
  const progress = Math.round((completed.filter(Boolean).length / lesson.screens.length) * 100);
  return <div className="app-shell">
    <header className="topbar"><div className="course-select"><span>Module 8</span><i>/</i><strong>Lesson {lesson.number} — {lesson.title}</strong></div><div className="module-progress" aria-label={`${progress}% complete`}><i><b style={{ width: `${progress}%` }} /></i><span>{progress}%</span></div><div className="top-actions"><button type="button" onClick={() => setSoundOn((value) => !value)}>{soundOn ? <Volume2 /> : <VolumeX />}<span>Sound {soundOn ? "on" : "off"}</span></button><button type="button"><X /><span>Quit</span></button></div></header>
    <main className="workspace"><button className="menu-button" type="button" onClick={() => setOutlineOpen((value) => !value)} aria-label="Toggle lesson outline"><Menu /></button>
      {outlineOpen && <aside className="outline-panel"><div><strong>Lesson {lesson.number}</strong><span>{progress}% explored</span></div>{lesson.screens.map((entry, index) => <button type="button" key={entry.id} className={index === screenIndex ? "current" : ""} disabled={index > 0 && !completed[index - 1]} onClick={() => goTo(index)}><span>{completed[index] ? <Check /> : index + 1}</span>{entry.tab}</button>)}</aside>}
      <article className="lesson-card"><nav className="section-tabs" style={{ "--tabs": lesson.screens.length }}><p>SECTION {screenIndex + 1} OF {lesson.screens.length}</p><div>{lesson.screens.map((entry, index) => <button type="button" key={entry.id} className={`${index === screenIndex ? "active" : ""} ${completed[index] ? "done" : ""}`} disabled={index > 0 && !completed[index - 1]} onClick={() => goTo(index)}>{completed[index] && <Check />}<span>{entry.tab}</span></button>)}</div></nav>
        <section className="lesson-content">{screen.type === "reveal" && <RevealScreen screen={screen} complete={completed[screenIndex]} onReveal={() => setFocus(screen.reveal)} onQuiz={setQuizOpen} />}{screen.type === "explore" && <ExploreScreen screen={screen} visited={currentVisited} complete={completed[screenIndex]} onVisit={visitItem} onQuiz={setQuizOpen} />}{screen.type === "flip" && <FlipScreen screen={screen} visited={currentVisited} onVisit={visitItem} />}{screen.type === "tabs" && <TabsScreen screen={screen} visited={currentVisited} onVisit={visitItem} complete={completed[screenIndex]} onQuiz={setQuizOpen} />}</section>
        {completed[screenIndex] && <div className="interaction-status"><Check /> Section explored. Continue when you’re ready.</div>}
        <footer className="nav-footer"><button type="button" disabled={screenIndex === 0} onClick={() => goTo(screenIndex - 1)}><ArrowLeft />Previous</button><button className="primary-button" type="button" disabled={!completed[screenIndex]} onClick={next}>{screenIndex === lesson.screens.length - 1 ? "Complete lesson" : "Continue"}<ArrowRight /></button></footer>
      </article>
    </main>
    {focus && <DetailModal content={focus} onClose={() => setFocus(null)} onRead={() => { if (screen.quiz) setQuizOpen("attempt"); else markComplete(); }} />}
    {quizOpen && <KnowledgeCheck quiz={screen.quiz} review={quizOpen === "review"} onClose={() => setQuizOpen(false)} onComplete={() => markComplete()} />}
    {lessonComplete && <CompletionModal onClose={() => setLessonComplete(false)} />}
  </div>;
}

createRoot(document.getElementById("root")).render(<App />);
