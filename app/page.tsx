"use client" // これがないと動かない（超重要）

import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"

type Log = {
  id: string
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

export default function Home() {
  const [text, setText] = useState("") // データを覚えておく箱
  const [progress, setProgress] = useState(0) // 配列に追加
  const [logs, setLogs] = useState<Log[]>([]) // 配列に追加
  const [darkMode, setDarkMode] = useState(false) // ダークモード

  // 初回読み込み（保存データを復元
  // useEffect(() => {
  //   const saved = localStorage.getItem("logs") // 読み込み
  //   if (saved){
  //     setLogs(JSON.parse(saved))
  //   }
  // }, [])
  // logsが変わるたびに保存
  // useEffect(() => {
  //   localStorage.setItem("logs", JSON.stringify(logs)) //保存
  // },[logs])

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme === "dark") {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
    }
  }, [])

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("logs")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) {
        console.error("取得エラー:", error)
        return
      }
      if (data) {
        setLogs(
          data.map((log: any) => ({
            id: log.id,
            text: log.text,
            progress: log.progress,
            createdAt: log.created_at
          }))
        )
      }
    }
    fetchLogs()
  }, [])

  useEffect(() => {
    const channel = supabase
    .channel("logs-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "logs",
      },
      (payload) => {
        console.log("変更検知:", payload)
        // 再取得 or state更新
      }
    )
    .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },[])

  /*
  useEffectの意味
  ・最初のuseEffect→起動時に１回だけ実行
  ・２つ目→logsが変わるたびに保存
  */

  const handleAdd = async () => {
    if (!text) return

    // const newLog: Log = {
    //   text,
    //   progress,
    //   createdAt: new Date().toISOString()
    // }

    // setLogs([newLog, ...logs])
    // setText("")
    // setProgress(0)

    // 追加処理をSupabaseに
    // const { error } = await supabase.from("logs").insert({
    //   text,
    //   progress
    // })
    // if (error) {
    //   console.error("追加エラー: error")
    //   return
    // }
    // location.reload() // 一旦の処理
    const { data, error } = await supabase
    .from("logs")
    .insert({
      text,
      progress
    })
    .select()
    if (error) {
      console.error(error)
      return
    }
    if (data){
      const newLog = {
        id: data[0].id,
        text: data[0]. text,
        progress: data[0].progress,
        createdAt: data[0].created_at
      }
      setLogs([newLog, ...logs])
    }
    setText("")
    setProgress(0)
  }

  // const handleDelete = (index: number) => {
  //   const newLogs = logs.filter((_,i) => i !== index)
  //   setLogs(newLogs)
  // }

  const handleDelete = async (id: string) => {
    // await supabase.from("logs").delete().eq("id", id)
    // location.reload()
    const { error } = await supabase
    .from("logs")
    .delete()
    .eq("id", id)
    if (error){
      console.error(error)
      return
    }
    setLogs(logs.filter((log) => log.id !== id))
    }

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)

    if (newMode) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }

  return (
    <main className="p-6 max-w-xl mx-auto bg-white text-black dark:bg-gray-900 dark:text-white">
      <button
        onClick={toggleDarkMode}
        className="mb-4 px-3 py-1 border rounded"
      >
        {darkMode ? "ライトモード" : "ダークモード"}
      </button>
      <h1 className="text-2xl font-bold mb-4">内圧トラッカー</h1>
      {/* 入力エリア */}
      <div className="mb-6 space-y-2">
        <input
          className="w-full border p-2 rounded bg-white dark:bg-gray-700 dark:text-white"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="今日やったこと"
        />
        <input
          className="w-full border p-2 rounded bg-white dark:bg-gray-700 dark:text-white"
          type="number"
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          placeholder="進捗（0~100）"
        />
        <button
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          onClick={handleAdd}
        >
          追加
        </button>
      </div>
      {/* ストリーク */}
      <p className="mb-4 text-lg">
        連続記録:{calculateStreak(logs)} 日
      </p>
      {/* 進捗バー */}
      <div className="w-full bg-gray-200 h-2 rounded mt-2">
        <div
          className="bg-green-500 h-2 rounded"
          style={{ width: `${progress}%` }}
        />
      </div>
      <br />
      {/* ログ一覧 */}
      <ul className="space-y-3">
        {logs.map((log, index) => (
          <li
            key={index}
            className="border p-3 rounded shadow-sm bg-white dark:bg-gray-800"
          >
            <div className="font-semibold">{log.text}</div>
            <div className="text-sm text-gray-500">
              {new Date(log.createdAt).toLocaleString()}
            </div>
            <div className="mt-1">{log.progress}%</div>
            <button
              className="mt-2 text-red-500 text-sm"
              onClick={() => handleDelete(log.id)}
            >
              削除
            </button>
          </li>
        ))}
      </ul>
    </main>
  )
}