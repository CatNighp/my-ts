"use client" // これがないと動かない（超重要）

import { useState, useEffect } from "react"

type Log = {
  text: string
  progress: number
  createdAt: string
}

function calculateStreak(logs: Log[]): number {
  if (logs.length === 0) return 0

  const dates = logs.map(log =>
    new Date(log.createdAt).toDateString()
  )

  const uniqueDates = Array.from(new Set(dates))

  uniqueDates.sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  let streak = 0
  let currentDate = new Date()

  for (let i = 0; i < uniqueDates.length; i++) {
    const checkDate = currentDate.toDateString()

    if (uniqueDates[i] === checkDate) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

export default function Home(){
  const [text, setText] = useState("") // データを覚えておく箱
  const [progress, setProgress] = useState(0) // 配列に追加
  const [logs, setLogs] = useState<Log[]>([]) // 配列に追加

  // 初回読み込み（保存データを復元
  useEffect(() => {
    const saved = localStorage.getItem("logs") // 読み込み
    if (saved){
      setLogs(JSON.parse(saved))
    }
  }, [])
  // logsが変わるたびに保存
  useEffect(() => {
    localStorage.setItem("logs", JSON.stringify(logs)) //保存
  },[logs])

  /*
  useEffectの意味
  ・最初のuseEffect→起動時に１回だけ実行
  ・２つ目→logsが変わるたびに保存
  */

  const handleAdd = () => {
    if(!text) return

    const newLog: Log = {
      text,
      progress,
      createdAt: new Date().toISOString()
    }

    setLogs([newLog, ...logs])
    setText("")
    setProgress(0)
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>内圧トラッカー</h1>
      <div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="今日やったこと"
        />

        <input
          type="number"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))} 
          placeholder="進捗(0~100)"
        />

        <button onClick={handleAdd}>追加</button>
      </div>

      <ul>
        {logs.map((log, index) => (
          <li key={index}>
            {log.text} - {log.progress}%<br />
            {new Date(log.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
      <p>連続記録：{calculateStreak(logs)}日</p>
    </main>
  )

}