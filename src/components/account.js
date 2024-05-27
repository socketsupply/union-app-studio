import { TonicDialog } from '@socketsupply/components/dialog'

class DialogAccount extends TonicDialog {
  constructor () {
    super()

    this.handleResponse = this.handleResponse.bind(this)
  }

  async show () {
    super.show()
    window.addEventListener('message', this.handleResponse, { once: true })
  }

  async hide () {
    super.hide()
    window.removeEventListener('message', this.handleResponse)
  }

  async handleResponse (event) {
    const iframe = this.querySelector('iframe')

    // if this isnt a message from the iframe, ignore it
    if (event.source !== iframe.contentWindow) return

    const app = this.props.app

    if (!event.data.success) {
      console.error(event)
      this.resolve(event.data)
      await this.hide()
      return
    }

    try {
      const res = await fetch('https://api.socketsupply.co/signup', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.data)
      })

      if (res.ok) {
        const app = this.props.parent
        const { data: dataUser } = await app.db.state.get('user')
        dataUser.buildKeys = await res.json()
        await app.db.state.put('user', dataUser)
        await this.hide()
        this.resolve({ data: true })
      }
    } catch (err) {
      console.log(err)
      this.resolve({ err: true })
      await this.hide()
    }
  }

  async prompt () {
    await this.show()
    const { promise, resolve } = Promise.withResolvers()
    this.resolve = resolve
    return promise
  }

  render () {
    const src = `pages/account.html?dev=${process.env.DEV ? 'true' : 'false'}`

    return this.html`
      <header>Account</header>

      <main>
        <iframe src="${src}" border=0></iframe>
      </main>
    `
  }
}

export default DialogAccount
export { DialogAccount }
