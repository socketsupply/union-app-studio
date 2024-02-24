import Tonic from '@socketsupply/tonic'
import fs from 'socket:fs'
import path from 'socket:path'
import ini from 'ini'

const isNumber = s => !isNaN(parseInt(s, 10))

const getObjectValue = (o = {}, path = '') => {
  const parts = path.split('.')
  let value = o

  for (const p of parts) {
    if (!value) return false
    value = value[p]
  }

  return value
}

const setObjectValue = (o = {}, path = '', v) => {
  const parts = path.split('.')
  let value = o

  let last = parts.pop()
  if (!last) return

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]

    if (!value[p]) {
      value[p] = isNumber(parts[i + 1]) ? [] : {}
    }
    value = value[p]
  }

  value[last] = v
  return o
}

function trim (string) {
  const lines = string.split(/\r?\n/)

  let leadingSpaces = 0

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== '') {
      leadingSpaces = lines[i].search(/\S/)
      break
    }
  }

  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].slice(leadingSpaces).trimRight()
  }

  if (lines[0] === '') lines.shift()
  return lines.join('\n')
}

class AppProperties extends Tonic {
  constructor () {
    super()
  }

  async change (e) {
    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return

    const { event } = el.dataset

    const app = document.querySelector('app-view')
    const notifications = document.querySelector('#notifications')
    const editor = document.querySelector('app-editor')
    const project = document.querySelector('app-project')

    if (event === 'property') {
      const node = project.getNodeByProperty('id', 'socket.ini')
      const data = ini.parse(node.data)

      setObjectValue(data, el.id, el.value)
      node.data = ini.stringify(data)

      const dest = path.join(app.state.cwd, node.id)
      await fs.promises.writeFile(dest, node.data)

      editor.loadProjectNode(node)

      notifications?.create({
        type: 'info',
        title: 'Note',
        message: 'A restart of the app your building may be required.'
      })
    }
  }

  async click (e) {
    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return

    const { event, propertyValue } = el.dataset

    const app = document.querySelector('app-view')
    const notifications = document.querySelector('#notifications')
    const editor = document.querySelector('app-editor')
    const project = document.querySelector('app-project')

    if (event === 'insert-native-extension') {
      await project.insert({
        label: 'extension.cc',
        id: 'templates/extension.cc'
      })

      const node = project.getNodeByProperty('id', 'templates/index.js')
      project.revealNode(node.id)

      node.data = trim(`
        import extension from 'socket:extension'
        import ipc from 'socket:ipc'
      `) + node.data

      node.data += trim(`
        //
        // Native Extension example
        //
        const simple = await extension.load('simple-ipc-ping')
        const result = await ipc.request('simple.ping', { value: 'hello world' })
        console.log(result.data, 'hello world')

        await simple.unload()
      `)

      editor.loadProjectNode(node)
    }

    if (event === 'insert-wasm-extension') {
      await project.insert({
        label: 'wasm-extension.cc',
        id: 'templates/wasm-extension.cc'
      })
    }

    if (event === 'insert-service-worker') {
      await project.insert({
        label: 'service-worker.c',
        id: 'templates/service-worker.c'
      })
    }

    if (event === 'insert-worker-thread') {
      const exists = project.getNodeByProperty('id', 'src/worker-thread.js')
      if (exists) return

      await project.insert({
        source: 'templates/worker-thread.js',
        node: {
          label: 'worker-thread.js',
          id: 'src/worker-thread.js'
        }
      })

      const node = project.getNodeByProperty('id', 'src/index.js')

      if (!node.data.includes('socket:worker_threads')) {
        node.data = trim(`
          import { Worker } from 'socket:worker_threads'
        `) + node.data
      }

      if (!node.data.includes('socket:process')) {
        node.data = trim(`
          import process from 'socket:process'
        `) + node.data
      }

      node.data += trim(`
        //
        // Create a worker from the new file
        //

        // send some initial data through to the worker
        const sampleData = new TextEncoder().encode('hello world')

        // create the worker
        const worker = new Worker('./worker-thread.js', {
          workerData: { sampleData },
          stdin: true,
          stdout: true
        })

        // listen to messages from the worker
        worker.on('message', console.log)
        worker.on('error', console.error)
        worker.stdout.on('data', console.log)
      `)

      editor.loadProjectNode(node)
    }

    if (event === 'insert-web-worker') {
      await project.insert({
        label: 'web-worker.c',
        id: 'templates/web-worker.c'
      })
    }
  }

  async render () {
    let data

    if (!this.state.data) {
      //
      // If we don't have any state data, read it from the template
      //
      const str = await fs.promises.readFile('templates/socket.ini', 'utf8')
      data = this.state.data = ini.parse(str)
    } else {
      //
      // This state data may be written locally or by the editor
      //
      data = this.state.data
    }

    return this.html`
      <tonic-accordion id="options">
        <tonic-accordion-section
          name="application"
          id="application"
          label="Desktop Features"
        >
          <div class="option">
            <tonic-checkbox id="build.headless" checked="${data.build.headless ? 'true' : 'false'}" data-event="property" label="Headless" title="Headless"></tonic-checkbox>
            <p>The app's primary window is initially hidden.</p>
          </div>

          <div class="option">
            <tonic-checkbox id="application.tray" checked="${data.application.tray ? 'true' : 'false'}" label="Tray" data-event="property" title="Tray"></tonic-checkbox>
            <p>An icon is placed in the omni-present system menu (aka Tray). Clicking it triggers an event.</p>
          </div>

          <div class="option">
            <tonic-checkbox id="application.agent" checked="${data.application.agent ? 'true' : 'false'}" data-event="property" label="Agent" title="Agent"></tonic-checkbox>
            <p>Apps do not appear in the task switcher or on the Dock.</p>
          </div>
        </tonic-accordion-section>
        <tonic-accordion-section
          name="permissions"
          id="permissions"
          label="Permissions"
        >
          <div class="option">
            <tonic-checkbox id="permissions.allow_fullscreen" checked="${data.permissions.allow_fullscreen ? 'true' : 'false'}" data-event="property" label="Full Screen"></tonic-checkbox>
            <p>Allow/Disallow fullscreen in application</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_microphone" checked="${data.permissions.allow_microphone ? 'true' : 'false'}" data-event="property" label="Microphone"></tonic-checkbox>
            <p>Allow/Disallow microphone in application</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_camera" checked="${data.permissions.allow_camera ? 'true' : 'false'}" data-event="property" label="Camera"></tonic-checkbox>
            <p>Allow/Disallow camera in application</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_user_media" checked="${data.permissions.allow_user_media ? 'true' : 'false'}" data-event="property" label="User Media"></tonic-checkbox>
            <p>Allow/Disallow user media (microphone + camera) in application</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_geolocation" checked="${data.permissions.allow_geolocation ? 'true' : 'false'}" data-event="property" label="Geolocation"></tonic-checkbox>
            <p>Allow/Disallow geolocation in application</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_notifications" checked="${data.permissions.allow_notifications ? 'true' : 'false'}" data-event="property" label="Notifications"></tonic-checkbox>
            <p>Allow/Disallow notifications in application</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_sensors" checked="${data.permissions.allow_sensors ? 'true' : 'false'}" data-event="property" label="Sensors"></tonic-checkbox>
            <p>Allow/Disallow sensors in application</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_clipboard" checked="${data.permissions.allow_clipboard ? 'true' : 'false'}" data-event="property" label="Clipboard"></tonic-checkbox>
            <p>Allow/Disallow clipboard in application</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_bluetooth" checked="${data.permissions.allow_bluetooth ? 'true' : 'false'}" data-event="property" label="Bluetooth"></tonic-checkbox>
            <p>Allow/Disallow bluetooth in application</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_data_access" checked="${data.permissions.allow_data_access ? 'true' : 'false'}" data-event="property" label="Data Access"></tonic-checkbox>
            <p>Allow/Disallow data access in application</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_airplay" checked="${data.permissions.allow_airplay ? 'true' : 'false'}" data-event="property" label="AirPlay"></tonic-checkbox>
            <p>Allow/Disallow AirPlay access in application (macOS/iOS) only</p>
          </div>
          <div class="option">
            <tonic-checkbox id="permissions.allow_hotkeys" checked="${data.permissions.allow_hotkeys ? 'true' : 'false'}" data-event="property" label="AirPlay"></tonic-checkbox>
            <p>Allow/Disallow HotKey binding registration (desktop only)</p>
          </div>
        </tonic-accordion-section>
        <tonic-accordion-section
          name="bucket-test-4"
          id="bucket-test-4"
          label="Service Workers"
        >
          <div class="option">
            <p>
              Inserts a JavaScript snippet for building a Service Worker. A Service Worker is a seperate thread (aka a local-backend), that you can communicate with from a route like "/foo/bar/bazz".
              <tonic-button
                data-event="insert-service-worker"
              >Insert</tonic-button>
           </p>
          </div>
        </tonic-accordion-section>
        <tonic-accordion-section
          name="bucket-test-5"
          id="bucket-test-5"
          label="Native Extensions">
          <div class="option">
            <p>
              Creates a file called 'extension.cc', and inserts JavaScript code into index.js that can be used to load it.
              <tonic-button
                data-event="insert-native-extension"
              >Insert</tonic-button>
            </p>
          </div>
        </tonic-accordion-section>
        <tonic-accordion-section
          name="bucket-test-6"
          id="bucket-test-6"
          label="WASM Extensions">
          <div class="option">
            <p>
              An example of how to build a WASM extension.
              <tonic-button
                data-event="insert-wasm-extension"
              >Insert</tonic-button>
            </p>
          </div>
        </tonic-accordion-section>
      </tonic-accordion>
    `
  }
}

export { AppProperties }
export default AppProperties
