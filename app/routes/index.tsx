import { createRoute } from 'honox/factory'
import SlackInviter from '../islands/SlackInviter'

export default createRoute((c) => {
  return c.render(
    <div class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <title>Slack Channel Inviter</title>
      <div class="bg-white rounded-lg shadow-md p-8 max-w-2xl w-full">
        <h1 class="text-3xl font-bold mb-6 text-center text-gray-800">Slack Channel Inviter</h1>
        <SlackInviter />
      </div>
    </div>
  )
})
