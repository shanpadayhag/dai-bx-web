/* @refresh reload */
import { render } from 'solid-js/web'
import { Route, Router } from '@solidjs/router'
import App from './App'
import WorkspacePage from '~/features/workspace/WorkspacePage'
import SettingsPage from '~/features/sounds/SettingsPage'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

render(
  () => (
    <Router root={App}>
      <Route path="/" component={WorkspacePage} />
      <Route path="/settings" component={SettingsPage} />
    </Router>
  ),
  root,
)
