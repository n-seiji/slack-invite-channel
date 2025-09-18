import SlackInviter from '../islands/SlackInviter'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <SlackInviter />
      </div>
    </div>
  )
}