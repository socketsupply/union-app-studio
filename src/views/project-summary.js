import Tonic from '@socketsupply/tonic'
import { exec } from 'socket:child_process'

class ViewProjectSummary extends Tonic {
  show () {
    this.classList.add('show')
  }

  hide () {
    this.classList.remove('show')
  }

  async click (e) {
    const elCopy = Tonic.match(e.target, '[symbol-id="copy-icon"]')

    if (elCopy) {
      navigator.clipboard.writeText(elCopy.nextElementSibling.value)
      return
    }

    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return

    const { event } = el.dataset

    if (event === 'publish') {
      const coDialogPublish = document.querySelector('dialog-publish')
      if (coDialogPublish) coDialogPublish.show()
    }
  }

  async change (e) {
    const el = Tonic.match(e.target, '[data-event]')
    if (!el) return

    const { event, section, value } = el.dataset

    const app = this.props.parent
    const notifications = document.querySelector('#notifications')
    const editor = document.querySelector('app-editor')
    const project = document.querySelector('app-project')
    const config = new Config(app.state.currentProject?.id)

    if (event === 'org' || event === 'shared-secret') {
      const app = this.props.parent
      const config = new Config(app.state.currentProject?.id)
      if (!config) return

      let bundleId = await config.get('meta', 'bundle_identifier')
      if (bundleId) bundleId = bundleId.replace(/"/g, '')
      const { data: dataBundle } = await app.db.projects.get(bundleId)

      if (event === 'org') {
        dataBundle.org = el.value
        dataBundle.clusterId = await sha256(el.value, { bytes: true })
      }

      if (event === 'shared-secret') {
        const sharedKey = await Encryption.createSharedKey(el.value)
        const derivedKeys = await Encryption.createKeyPair(sharedKey)
        const subclusterId = Buffer.from(derivedKeys.publicKey)

        dataBundle.sharedKey = sharedKey
        dataBundle.sharedSecret = el.value
        dataBundle.subclusterId = subclusterId
      }

      await app.db.projects.put(bundleId, dataBundle)
      await app.initNetwork()
      this.reRender()
    }
  }

  async render () {
    const app = this.props.parent
    const currentProject = app.state.currentProject

    if (!currentProject) return this.html``

    const { data: dataProject } = await app.db.projects.get(currentProject.projectId)

    let items

    if (dataProject.waiting) {
      items = this.html`
        <div class="empty-state">
          <p>Waiting...</p>
        </div>
      `
    }

    let projectUpdates = []
    let gitStatus = { stdout: '', stderr: '' }

    if (dataProject.path) {
      //
      // Try to get the status of the project to tell the user what
      // has changed and help them decide if they should publish.
      //
      try {
        gitStatus = await exec('git status --porcelain', { cwd: dataProject.path })
      } catch (err) {
        gitStatus.stderr = err.message
      }

      if (gitStatus?.stderr.includes('command not found')) {
        projectUpdates.push(this.html`
          <tonic-toaster-inline
            id="git-not-installed"
            dismiss="false"
            display="true"
          >Git is not installed and is required to use this program.
          </tonic-toaster-inline>
        `)
      } else {
        projectUpdates = this.html`
          <pre id="project-status"><code>No changes.</code></pre>
        `

        if (!gitStatus.stderr && gitStatus.stdout.length) {
          projectUpdates = this.html`
            <pre id="project-status"><code>${gitStatus.stdout || 'No Changes.'}</code></pre>
          `
        }
      }
    }

    if (!dataProject.waiting) {
      items = this.html`
        <div class="sharing">
          <tonic-input
            label="Organization"
            id="org-name"
            data-event="org"
            spellcheck="false"
            value="${dataProject.org}"
          ></tonic-input>

          <tonic-input
            label="Shared Secret"
            id="shared-secret"
            data-event="shared-secret"
            spellcheck="false"
            value="${dataProject.sharedSecret}"
          ></tonic-input>

          <tonic-input
            label="Project Link"
            id="project-link"
            symbol-id="copy-icon"
            position="right"
            spellcheck="false"
            readonly="true"
            value="union://${dataProject.sharedSecret}?id=${encodeURIComponent(dataProject.bundleId)}&org=${dataProject.org}"
          ></tonic-input>

          <tonic-button
            id="publish"
            data-event="publish"
            width="100%"
            class="pull-right"
          >Publish</tonic-button>

          ${projectUpdates}
        </div>
      `
    }

    return this.html`
      <header class="component">
        <span>${currentProject.label}</span>
      </header>
      <div class="container">
        ${items}
      </div>
    `
  }
}

export default ViewProjectSummary
export { ViewProjectSummary }
