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
    if (event.source !== iframe.contentWindow) return

    const app = this.props.app

    if (!event.data.success) {
      console.error('Unsuccessful data returned', event)
      this.resolve(event.data)
      await this.hide()
      return
    }

    console.log('GOT RESPONSE FROM STRIPE PAGE', event.data)

    try {
      const res = await fetch('https://api.socketsupply.co/signup', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.data)
      })

      console.log('SIGNUP RESPONSE', res)

      if (res.ok) {
        const { data: dataUser } = await this.db.state.get('user')
        dataUser.buildKeys = await res.json()
        console.log('dataUser', dataUser)
        await this.db.state.put('user', dataUser)
        await this.hide()
      }
    } catch (err) {
      if (err.name === "AbortError") {
        this.resolve({ data: event.data })
        await this.hide()
      }
      console.log(err)
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
