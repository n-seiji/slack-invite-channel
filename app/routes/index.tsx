import { createRoute } from 'honox/factory'
import SlackInviter from '../islands/SlackInviter'

export default createRoute((c) => {
  return c.render(
    <div>
      <h1>Slack Channel Inviter</h1>
      <SlackInviter />
    </div>,
    { title: 'Slack Channel Inviter' }
  )
})