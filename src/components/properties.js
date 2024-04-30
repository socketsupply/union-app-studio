import process from 'socket:process'

import Tonic from '@socketsupply/tonic'

import Config from '../lib/config.js'

class AppProperties extends Tonic {
  async change (e) {
    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return

    const { event, section, value } = el.dataset

    const app = this.props.parent
    const notifications = document.querySelector('#notifications')
    const config = new Config(app.state.currentProject?.id)

    //
    // when the user wants to toggle one of the preview windows they have configured
    //
    if (event === 'preview') {
      const previewWindow = app.state.settings.previewWindows.find(o => o.title === value)

      if (previewWindow) {
        previewWindow.active = !previewWindow.active
      }

      await app.saveSettingsFile()
      app.activatePreviewWindows()
    }

    //
    // When the user wants to make a change to the one of the properties in the await config file
    //
    if (event === 'property') {
      await config.set(section, el.id, el.value)
      const coTabs = document.querySelector('editor-tabs')
      const coEditor = document.querySelector('app-editor')

      if (coTabs.tab && coTabs.tab.isRootSettingsFile) {
        coEditor.reload()
      }

      notifications?.create({
        type: 'info',
        title: 'Note',
        message: 'A rebuild of your app may be required.'
      })
    }
  }

  async loadProjectNode (node) {
    this.reRender()
    return true
  }

  async render () {
    const app = this.props.parent
    const settings = app.state.settings
    const currentProject = app.state.currentProject
    const cwd = currentProject?.id
    const config = new Config(cwd)
    const previewWindows = []

    if (settings?.previewWindows) {
      let index = 0

      if (Array.isArray(settings.previewWindows)) {
        for (const w of settings.previewWindows) {
          if (!w.title) continue
          previewWindows.push(this.html`
            <tonic-checkbox
              id="${w.title}-${String(index++)}"
              data-event="preview"
              data-value="${w.title}"
              checked="${String(w.active)}"
              data-aspect-ratio="${w.aspectRatio}"
              data-resolution="${w.resolution}"
              label="${w.title}"
              title="${w.description || ''}"
            ></tonic-checkbox>
          `)
        }
      }
    }

    return this.html`
      <tonic-accordion id="options" selected="preview-windows">
        <h3>App Settings</h3>
        <tonic-accordion-section
          name="preview-windows"
          id="preview-windows"
          label="Preview"
        >
          ${previewWindows}
        </tonic-accordion-section>
        <tonic-accordion-section
          name="build-target"
          id="build-target"
          label="Build"
        >
          <tonic-checkbox data-section="build-target" id="arch-android" data-arch="android" checked="${String(process.platform === 'android')}" label="Android" title="Android"></tonic-checkbox>
          <tonic-checkbox data-section="build-target" id="arch-darwin"  data-arch="darwin"  checked="${String(process.platform === 'darwin')}"  label="MacOS" title="MacOS/Darwin"></tonic-checkbox>
          <tonic-checkbox data-section="build-target" id="arch-ios"     data-arch="ios"     checked="${String(process.platform === 'ios')}"     label="iOS" title="iOS"></tonic-checkbox>
          <tonic-checkbox data-section="build-target" id="arch-linux"   data-arch="linux"   checked="${String(process.platform === 'linux')}"   label="Linux" title="Linux"></tonic-checkbox>
          <tonic-checkbox data-section="build-target" id="arch-win32"   data-arch="win32"   checked="${String(process.platform === 'win32')}"   label="Windows" title="Windows"></tonic-checkbox>
        </tonic-accordion-section>

        <tonic-accordion-section
          name="deploy"
          id="deploy"
          label="Deploy"
        >
          <tonic-checkbox data-section="deploy" id="deploy-apple" disabled="true" checked="false" label="Apple Store" title="Apple Store"></tonic-checkbox>
          <tonic-checkbox data-section="deploy" id="deploy-play" disabled="true" checked="false" label="Google Play Store" title="Google Play Store"></tonic-checkbox>
          <tonic-checkbox data-section="deploy" id="deploy-ubuntu" disabled="true" checked="false" label="Ubuntu Store" title="Ubuntu Store"></tonic-checkbox>
          <tonic-checkbox data-section="deploy" id="deploy-ms" disabled="true" checked="false" label="Microsoft Store" title="Microsoft Store"></tonic-checkbox>
        </tonic-accordion-section>

        <h3>Project Settings</h3>
        <tonic-accordion-section
          name="application"
          id="application"
          label="Desktop Features"
        >
          <tonic-checkbox data-section="build" id="headless" checked="${await config.get('build', 'headless')}" data-event="property" label="Headless" title="Headless"></tonic-checkbox>
          <tonic-checkbox data-section="application" id="tray" checked="${await config.get('application', 'tray')}" label="Tray" data-event="property" title="Tray"></tonic-checkbox>
          <tonic-checkbox data-section="application" id="agent" checked="${await config.get('application', 'agent')}" data-event="property" label="Agent" title="Agent"></tonic-checkbox>
        </tonic-accordion-section>
        <tonic-accordion-section
          name="permissions"
          id="permissions"
          label="Permissions"
        >
          <tonic-checkbox data-section="permissions" id="allow_fullscreen" checked="${await config.get('permissions', 'allow_fullscreen')}" data-event="property" label="Full Screen"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_microphone" checked="${await config.get('permissions', 'allow_microphone')}" data-event="property" label="Microphone"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_camera" checked="${await config.get('permissions', 'allow_camera')}" data-event="property" label="Camera"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_user_media" checked="${await config.get('permissions', 'allow_user_media')}" data-event="property" label="User Media"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_geolocation" checked="${await config.get('permissions', 'allow_geolocation')}" data-event="property" label="Geolocation"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_notifications" checked="${await config.get('permissions', 'allow_notifications')}" data-event="property" label="Notifications"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_sensors" checked="${await config.get('permissions', 'allow_sensors')}" data-event="property" label="Sensors"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_clipboard" checked="${await config.get('permissions', 'allow_clipboard')}" data-event="property" label="Clipboard"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_bluetooth" checked="${await config.get('permissions', 'allow_bluetooth')}" data-event="property" label="Bluetooth"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_data_access" checked="${await config.get('permissions', 'allow_data_access')}" data-event="property" label="Data Access"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_airplay" checked="${await config.get('permissions', 'allow_airplay')}" data-event="property" label="AirPlay"></tonic-checkbox>
          <tonic-checkbox data-section="permissions" id="allow_hotkeys" checked="${await config.get('permissions', 'allow_hotkeys')}" data-event="property" label="AirPlay"></tonic-checkbox>
        </tonic-accordion-section>
      </tonic-accordion>
    `
  }
}

export { AppProperties }
export default AppProperties
