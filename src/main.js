import { marked } from 'marked'
import mermaid from 'mermaid'
import './style.css'

const markdownFiles = import.meta.glob('/slides/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const conversationFiles = import.meta.glob('/slides/**/*.conversation*', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const languageOptions = {
  zh: { label: '汉语', locale: 'zh-CN' },
  ja: { label: '日语', locale: 'ja-JP' },
  en: { label: '英语', locale: 'en-US' },
}
const maleHints = /male|yunxi|yunyang|yunhao|kangkang|zhiwei|keita|ichiro|guy|david|mark|george|james|daniel/i
const femaleHints = /female|xiaoxiao|xiaoyi|huihui|yaoyao|yating|hanhan|nanami|ayumi|haruka|jenny|zira|samantha|victoria|karen/i
const cantoneseHints = /cantonese|hong\s*kong|yue|粤|粵|香港/i
const app = document.querySelector('#app')

const state = {
  courses: buildCourses(),
  course: null,
  language: 'zh',
  slidePosition: 0,
  startPosition: 0,
  endPosition: 0,
  segmentPosition: -1,
  playing: false,
  paused: false,
  sessionId: 0,
  voices: [],
  speakerVoices: { 1: '', 2: '' },
  rate: 1,
  volume: 1,
  pitch: 1,
  captionSize: 28,
  showCaptions: true,
}

marked.use({ gfm: true, breaks: false })
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'neutral',
  fontFamily: 'Inter, "Noto Sans SC", sans-serif',
})

function buildCourses() {
  const courses = new Map()
  for (const [path, markdown] of Object.entries(markdownFiles)) {
    const match = path.match(/^\/slides\/(.+)\/(\d+)\.md$/)
    if (!match) continue
    const [, coursePath, rawIndex] = match
    const index = Number(rawIndex)
    if (!courses.has(coursePath)) courses.set(coursePath, [])
    courses.get(coursePath).push({ index, rawIndex, markdown, coursePath })
  }

  return [...courses.entries()]
    .map(([path, slides]) => ({
      path,
      label: path.split('/').join(' › '),
      slides: slides.sort((a, b) => a.index - b.index),
    }))
    .sort((a, b) => a.path.localeCompare(b.path, 'zh-CN'))
}

function parseConversation(text = '') {
  const segments = []
  let current = null
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const match = line.match(/^speaker\s*([12])\s*[:：]\s*(.+)$/i)
    if (match) {
      if (current) segments.push(current)
      current = { speaker: match[1], text: match[2].trim() }
    } else if (current) {
      current.text += ` ${line}`
    }
  }
  if (current) segments.push(current)
  return segments
}

function getSegments(slide, language = state.language) {
  const base = `/slides/${slide.coursePath}/${slide.rawIndex}.conversation`
  const text = conversationFiles[`${base}.${language}`] ?? conversationFiles[base] ?? ''
  return parseConversation(text)
}

function renderShell() {
  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#" aria-label="DialogueFlow 首页">
        <span class="brand-mark">DF</span>
        <span><strong>DialogueFlow</strong><small>双人对话课程播放器</small></span>
      </a>
      <div class="header-note"><span></span>纯浏览器运行 · 无录屏</div>
    </header>
    <main class="workspace">
      <aside class="control-panel" aria-label="播放设置">
        <div class="panel-heading">
          <p class="eyebrow">课程设置</p>
          <h1>让知识被听见</h1>
          <p>选择课程和章节，使用浏览器内置语音播放双人对话。</p>
        </div>

        <label class="field">课程
          <select id="courseSelect"></select>
        </label>
        <label class="field">朗读语言
          <select id="languageSelect">
            ${Object.entries(languageOptions).map(([value, item]) => `<option value="${value}">${item.label}</option>`).join('')}
          </select>
        </label>

        <fieldset class="voice-fieldset">
          <legend>角色声音</legend>
          <label class="field"><span><i class="speaker-dot speaker-one"></i>Speaker 1 <b>女音</b></span>
            <select id="speaker1Voice" aria-label="Speaker 1 女音"></select>
          </label>
          <label class="field"><span><i class="speaker-dot speaker-two"></i>Speaker 2 <b>男音</b></span>
            <select id="speaker2Voice" aria-label="Speaker 2 男音"></select>
          </label>
          <p class="hint">声音来自当前浏览器和操作系统，可在这里分别更换。</p>
        </fieldset>

        <label class="field">字幕显示
          <select id="captionVisibility" aria-label="字幕显示">
            <option value="show" selected>显示字幕</option>
            <option value="hide">不显示字幕</option>
          </select>
        </label>

        <div class="range-grid">
          ${rangeControl('rate', '语速', 0.5, 2, 0.1, '1.0×')}
          ${rangeControl('pitch', '音高', 0.5, 2, 0.1, '1.0')}
          ${rangeControl('volume', '音量', 0, 1, 0.1, '100%')}
          ${rangeControl('captionSize', '字幕大小', 16, 56, 1, '28px')}
        </div>

        <div class="chapter-range">
          <span>播放章节</span>
          <label>从 <select id="startSelect" aria-label="开始章节"></select></label>
          <label>到 <select id="endSelect" aria-label="结束章节"></select></label>
        </div>

        <div class="transport">
          <button id="startButton" class="primary-button"><span>▶</span> 开始播放</button>
          <button id="pauseButton" class="icon-button" disabled aria-label="暂停播放">Ⅱ</button>
          <button id="stopButton" class="icon-button" disabled aria-label="停止播放">■</button>
        </div>
        <p id="statusText" class="status-text" aria-live="polite">准备就绪</p>
      </aside>

      <section class="lesson-area">
        <div class="lesson-columns">
          <section class="chapter-pane" aria-labelledby="lessonTitle">
            <div class="lesson-toolbar">
              <div>
                <p class="eyebrow">当前章节</p>
                <h2 id="lessonTitle">正在载入课程…</h2>
              </div>
              <div class="chapter-nav">
                <button id="previousSlide" aria-label="上一章">←</button>
                <span id="slideCounter">— / —</span>
                <button id="nextSlide" aria-label="下一章">→</button>
              </div>
            </div>
            <div class="progress-track" aria-hidden="true"><span id="progressBar"></span></div>
            <article id="slideContent" class="markdown-body"></article>
          </section>
          <section class="dialogue-card" aria-labelledby="dialogueTitle">
            <div class="dialogue-heading">
              <div><p class="eyebrow">本章对话</p><h2 id="dialogueTitle">Speaker 1 × Speaker 2</h2></div>
              <button id="playChapter" class="secondary-button">▶ 播放本章</button>
            </div>
            <div id="dialogueList"></div>
          </section>
        </div>
      </section>
    </main>`

  bindEvents()
  populateCourses()
  loadVoices()
}

function rangeControl(id, label, min, max, step, value) {
  return `<label class="range-field"><span>${label}<output id="${id}Output">${value}</output></span><input id="${id}Range" type="range" min="${min}" max="${max}" step="${step}" value="${state[id]}"></label>`
}

function bindEvents() {
  document.querySelector('#courseSelect').addEventListener('change', (event) => selectCourse(event.target.value))
  document.querySelector('#languageSelect').addEventListener('change', (event) => {
    stopPlayback()
    state.language = event.target.value
    chooseDefaultVoices()
    updateVoiceSelects()
    renderSlide()
  })
  document.querySelector('#speaker1Voice').addEventListener('change', (event) => { state.speakerVoices[1] = event.target.value })
  document.querySelector('#speaker2Voice').addEventListener('change', (event) => { state.speakerVoices[2] = event.target.value })
  document.querySelector('#captionVisibility').addEventListener('change', (event) => {
    state.showCaptions = event.target.value === 'show'
    updateCaptionVisibility()
  })
  bindRange('rate', (value) => `${value.toFixed(1)}×`)
  bindRange('pitch', (value) => value.toFixed(1))
  bindRange('volume', (value) => `${Math.round(value * 100)}%`)
  bindRange('captionSize', (value) => `${value}px`)
  document.querySelector('#startSelect').addEventListener('change', updateChapterRange)
  document.querySelector('#endSelect').addEventListener('change', updateChapterRange)
  document.querySelector('#startButton').addEventListener('click', () => playRange())
  document.querySelector('#playChapter').addEventListener('click', () => playRange(state.slidePosition, state.slidePosition))
  document.querySelector('#pauseButton').addEventListener('click', togglePause)
  document.querySelector('#stopButton').addEventListener('click', stopPlayback)
  document.querySelector('#previousSlide').addEventListener('click', () => moveSlide(-1))
  document.querySelector('#nextSlide').addEventListener('click', () => moveSlide(1))
}

function updateCaptionVisibility() {
  const lessonArea = document.querySelector('.lesson-area')
  const dialogueCard = document.querySelector('.dialogue-card')
  lessonArea.classList.toggle('captions-hidden', !state.showCaptions)
  dialogueCard.setAttribute('aria-hidden', String(!state.showCaptions))
}

function bindRange(id, formatter) {
  document.querySelector(`#${id}Range`).addEventListener('input', (event) => {
    state[id] = Number(event.target.value)
    document.querySelector(`#${id}Output`).value = formatter(state[id])
    if (id === 'captionSize') document.documentElement.style.setProperty('--caption-size', `${state[id]}px`)
  })
}

function populateCourses() {
  const select = document.querySelector('#courseSelect')
  select.innerHTML = state.courses.map((course) => `<option value="${escapeAttribute(course.path)}">${escapeHtml(course.label)}</option>`).join('')
  const preferred = state.courses.find((course) => course.path.startsWith('托业单词/')) ?? state.courses[0]
  if (preferred) {
    select.value = preferred.path
    selectCourse(preferred.path)
  } else {
    document.querySelector('#lessonTitle').textContent = '没有找到有效课程'
  }
}

function selectCourse(path) {
  const selectedCourse = state.courses.find((course) => course.path === path)
  if (!selectedCourse) return

  // 首次载入时，停止逻辑也会刷新章节按钮，因此必须先放入有效课程。
  state.course = selectedCourse
  stopPlayback()
  state.slidePosition = 0
  state.startPosition = 0
  state.endPosition = Math.max(0, state.course.slides.length - 1)
  populateChapterRange()
  renderSlide()
}

function populateChapterRange() {
  const options = state.course.slides.map((slide, position) => `<option value="${position}">第 ${slide.index} 章</option>`).join('')
  document.querySelector('#startSelect').innerHTML = options
  document.querySelector('#endSelect').innerHTML = options
  document.querySelector('#startSelect').value = state.startPosition
  document.querySelector('#endSelect').value = state.endPosition
}

function updateChapterRange() {
  state.startPosition = Number(document.querySelector('#startSelect').value)
  state.endPosition = Number(document.querySelector('#endSelect').value)
  if (state.startPosition > state.endPosition) {
    ;[state.startPosition, state.endPosition] = [state.endPosition, state.startPosition]
    document.querySelector('#startSelect').value = state.startPosition
    document.querySelector('#endSelect').value = state.endPosition
  }
}

async function renderSlide() {
  if (!state.course) return
  const slide = state.course.slides[state.slidePosition]
  document.querySelector('#lessonTitle').textContent = `${state.course.label} · 第 ${slide.index} 章`
  document.querySelector('#slideCounter').textContent = `${state.slidePosition + 1} / ${state.course.slides.length}`
  document.querySelector('#previousSlide').disabled = state.slidePosition === 0 || state.playing
  document.querySelector('#nextSlide').disabled = state.slidePosition === state.course.slides.length - 1 || state.playing
  document.querySelector('#progressBar').style.width = `${((state.slidePosition + 1) / state.course.slides.length) * 100}%`

  const content = document.querySelector('#slideContent')
  content.innerHTML = marked.parse(slide.markdown)
  if (slide.coursePath.startsWith('托业单词/')) {
    content.querySelectorAll('pre code.language-text').forEach((code) => {
      code.textContent = code.textContent.replace(/\*\*([^*\n]+)\*\*/g, '$1')
    })
  }
  content.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.disabled = false
    checkbox.setAttribute('aria-label', checkbox.closest('li')?.textContent.trim() || '习题选项')
  })
  content.querySelectorAll('pre code.language-mermaid').forEach((code) => {
    const diagram = document.createElement('div')
    diagram.className = 'mermaid'
    diagram.textContent = code.textContent
    code.closest('pre').replaceWith(diagram)
  })
  try {
    await mermaid.run({ nodes: content.querySelectorAll('.mermaid') })
  } catch (error) {
    console.warn('Mermaid 图表渲染失败', error)
  }
  renderDialogue()
  document.querySelector('.chapter-pane').scrollTo({ top: 0, behavior: 'smooth' })
  document.querySelector('.dialogue-card').scrollTo({ top: 0, behavior: 'smooth' })
}

function renderDialogue() {
  const slide = state.course.slides[state.slidePosition]
  const segments = getSegments(slide)
  const list = document.querySelector('#dialogueList')
  if (!segments.length) {
    list.innerHTML = '<p class="empty-message">当前语言没有对话内容。</p>'
    document.querySelector('#playChapter').disabled = true
    return
  }
  document.querySelector('#playChapter').disabled = state.playing
  list.innerHTML = segments.map((segment, index) => `
    <button class="dialogue-line speaker-${segment.speaker}" data-segment="${index}" aria-label="播放 Speaker ${segment.speaker} 的这一句">
      <span class="avatar">${segment.speaker}</span>
      <span><strong>Speaker ${segment.speaker}</strong><span class="dialogue-text">${escapeHtml(segment.text)}</span></span>
      <span class="line-play">▶</span>
    </button>`).join('')
  list.querySelectorAll('[data-segment]').forEach((button) => {
    button.addEventListener('click', () => playSingleSegment(Number(button.dataset.segment)))
  })
}

function moveSlide(delta) {
  if (state.playing) return
  const next = Math.max(0, Math.min(state.course.slides.length - 1, state.slidePosition + delta))
  if (next !== state.slidePosition) {
    state.slidePosition = next
    renderSlide()
  }
}

async function playRange(start = state.startPosition, end = state.endPosition) {
  if (!('speechSynthesis' in window)) {
    setStatus('此浏览器不支持语音合成，但仍可阅读全部对话。')
    return
  }
  stopPlayback(false)
  const sessionId = ++state.sessionId
  state.playing = true
  setPlayingUi(true)
  for (let slidePosition = start; slidePosition <= end && sessionId === state.sessionId; slidePosition += 1) {
    state.slidePosition = slidePosition
    await renderSlide()
    const segments = getSegments(state.course.slides[slidePosition])
    for (let segmentPosition = 0; segmentPosition < segments.length && sessionId === state.sessionId; segmentPosition += 1) {
      state.segmentPosition = segmentPosition
      highlightSegment(segmentPosition)
      setStatus(`播放第 ${slidePosition - start + 1} / ${end - start + 1} 章 · Speaker ${segments[segmentPosition].speaker}`)
      await speak(segments[segmentPosition], sessionId)
    }
  }
  if (sessionId === state.sessionId) {
    state.playing = false
    state.segmentPosition = -1
    setPlayingUi(false)
    setStatus('播放完成')
    highlightSegment(-1)
  }
}

async function playSingleSegment(segmentPosition) {
  if (!('speechSynthesis' in window)) return
  stopPlayback(false)
  const sessionId = ++state.sessionId
  state.playing = true
  state.segmentPosition = segmentPosition
  setPlayingUi(true)
  highlightSegment(segmentPosition)
  const segment = getSegments(state.course.slides[state.slidePosition])[segmentPosition]
  setStatus(`单句播放 · Speaker ${segment.speaker}`)
  await speak(segment, sessionId)
  if (sessionId === state.sessionId) {
    state.playing = false
    state.segmentPosition = -1
    setPlayingUi(false)
    setStatus('准备就绪')
    highlightSegment(-1)
  }
}

function speak(segment, sessionId) {
  return new Promise((resolve) => {
    if (sessionId !== state.sessionId) return resolve()
    const utterance = new SpeechSynthesisUtterance(sanitizeForSpeech(segment.text))
    utterance.lang = languageOptions[state.language].locale
    utterance.rate = state.rate
    utterance.volume = state.volume
    utterance.pitch = state.pitch
    const selectedVoice = state.voices.find((voice) => voice.name === state.speakerVoices[segment.speaker])
    if (selectedVoice) utterance.voice = selectedVoice
    utterance.onend = resolve
    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') setStatus(`语音播放失败：${event.error}`)
      resolve()
    }
    window.speechSynthesis.speak(utterance)
  })
}

function togglePause() {
  if (!state.playing) return
  if (state.paused) {
    window.speechSynthesis.resume()
    state.paused = false
    document.querySelector('#pauseButton').textContent = 'Ⅱ'
    document.querySelector('#pauseButton').ariaLabel = '暂停播放'
    setStatus('继续播放')
  } else {
    window.speechSynthesis.pause()
    state.paused = true
    document.querySelector('#pauseButton').textContent = '▶'
    document.querySelector('#pauseButton').ariaLabel = '继续播放'
    setStatus('已暂停')
  }
}

function stopPlayback(updateStatus = true) {
  state.sessionId += 1
  state.playing = false
  state.paused = false
  state.segmentPosition = -1
  if ('speechSynthesis' in window) {
    window.speechSynthesis.resume()
    window.speechSynthesis.cancel()
  }
  if (document.querySelector('#pauseButton')) {
    setPlayingUi(false)
    highlightSegment(-1)
    if (updateStatus) setStatus('已停止')
  }
}

function setPlayingUi(playing) {
  document.querySelector('#startButton').disabled = playing
  document.querySelector('#playChapter').disabled = playing
  document.querySelector('#pauseButton').disabled = !playing
  document.querySelector('#stopButton').disabled = !playing
  document.querySelector('#courseSelect').disabled = playing
  document.querySelector('#languageSelect').disabled = playing
  document.querySelector('#previousSlide').disabled = playing || state.slidePosition === 0
  document.querySelector('#nextSlide').disabled = playing || !state.course || state.slidePosition === state.course.slides.length - 1
  if (!playing) {
    document.querySelector('#pauseButton').textContent = 'Ⅱ'
    document.querySelector('#pauseButton').ariaLabel = '暂停播放'
  }
}

function highlightSegment(position) {
  document.querySelectorAll('.dialogue-line').forEach((line, index) => line.classList.toggle('is-speaking', index === position))
  const active = document.querySelector('.dialogue-line.is-speaking')
  const dialogueCard = document.querySelector('.dialogue-card')
  if (active && state.showCaptions) {
    dialogueCard.scrollTo({
      top: active.offsetTop - (dialogueCard.clientHeight - active.clientHeight) / 2,
      behavior: 'smooth',
    })
  }
}

function loadVoices() {
  if (!('speechSynthesis' in window)) {
    updateVoiceSelects()
    return
  }
  const update = () => {
    state.voices = window.speechSynthesis.getVoices().sort((a, b) => a.name.localeCompare(b.name))
    chooseDefaultVoices()
    updateVoiceSelects()
  }
  update()
  window.speechSynthesis.addEventListener('voiceschanged', update, { once: true })
}

function chooseDefaultVoices() {
  const voices = getSelectableVoices()
  const femaleVoices = voices.filter((voice) => femaleHints.test(voice.name))
  const maleVoices = voices.filter((voice) => maleHints.test(voice.name))

  if (state.language === 'zh') {
    const mandarinVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('zh-cn') || /普通话|普通話|mainland/i.test(voice.name))
    const taiwanVoices = voices.filter((voice) => voice.lang.toLowerCase().startsWith('zh-tw') || /台湾|台灣|臺灣|國語/i.test(voice.name))
    const speaker1 = mandarinVoices.find((voice) => femaleHints.test(voice.name)) ?? mandarinVoices[0] ?? femaleVoices[0] ?? voices[0]
    const speaker2 = taiwanVoices.find((voice) => maleHints.test(voice.name)) ?? taiwanVoices[0] ?? maleVoices.find((voice) => voice.name !== speaker1?.name) ?? voices.find((voice) => voice.name !== speaker1?.name) ?? voices[0]
    state.speakerVoices[1] = speaker1?.name ?? ''
    state.speakerVoices[2] = speaker2?.name ?? ''
    return
  }

  const speaker1 = femaleVoices[0] ?? voices[0]
  const speaker2 = maleVoices.find((voice) => voice.name !== speaker1?.name) ?? voices.find((voice) => voice.name !== speaker1?.name) ?? voices[0]
  state.speakerVoices[1] = speaker1?.name ?? ''
  state.speakerVoices[2] = speaker2?.name ?? ''
}

function updateVoiceSelects() {
  const voices = getSelectableVoices()
  const options = voices.length
    ? voices.map((voice) => `<option value="${escapeAttribute(voice.name)}">${escapeHtml(voice.name)} (${escapeHtml(voice.lang)})</option>`).join('')
    : '<option value="">使用浏览器默认声音</option>'
  for (const speaker of ['1', '2']) {
    const select = document.querySelector(`#speaker${speaker}Voice`)
    select.innerHTML = options
    select.value = state.speakerVoices[speaker]
  }
}

function getSelectableVoices() {
  const languagePrefix = languageOptions[state.language].locale.split('-')[0].toLowerCase()
  return state.voices.filter((voice) => {
    const voiceLanguage = voice.lang.toLowerCase()
    if (!voiceLanguage.startsWith(languagePrefix)) return false
    if (state.language !== 'zh') return true
    return !voiceLanguage.startsWith('zh-hk') && !voiceLanguage.startsWith('yue') && !cantoneseHints.test(voice.name)
  })
}

function sanitizeForSpeech(text) {
  return text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[`*_#>|~]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function setStatus(message) {
  document.querySelector('#statusText').textContent = message
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character])
}

function escapeAttribute(value) {
  return escapeHtml(value)
}

window.addEventListener('beforeunload', () => stopPlayback(false))
renderShell()
