import { Tonic, components } from '../vendor.js'

components(Tonic)

class AppView extends Tonic {
  constructor () {
    super()

    const sharedKeys = {
      test: 'pk_test_51JpgUIFV3Il51eBDUO1s6JVOy9P3rFCkvX1Mbjvq4Qtkrj0ARg0CmXtYnpecsTyliVwvSJnEOOQXqUo0w48EKOP000oEdk14R2',
      live: 'pk_live_51JpgUIFV3Il51eBDWQworOndEE0S5T2HUqjowum8lPhSfpaboVz5iJlS1PfsWicfNtdUhTZhPSYtpJpZgI9Jc40800MkE0liSP'
    }

    const url = new URL(globalThis.location.href)
    const key = url.searchParams.get('dev') === 'true' ? sharedKeys.test : sharedKeys.live
    this.stripe = Stripe(key)
  }

  async show () {
    super.show()

    const coForm = this.querySelector('tonic-form')
    const elButton = Tonic.match(e.target, '#form-submit')
    elButton.loading(false)

    if (coForm) coForm.setValid()
  }

  async input (e) {
    const coForm = this.querySelector('tonic-form')
    const coSubmit = this.querySelector('#form-submit')

    if (!coForm) return

    const isValid = coForm.validate({ decorate: false })
    coSubmit.disabled = !isValid
  }

  async click (e) {
    const el = Tonic.match(e.target, '#form-submit')
    if (!el) return

    el.loading(true)

    const coForm = this.querySelector('#form-stripe')
    const result = await this.stripe.createToken(this.card, coForm.value)

    const data = {
      ...result,
      success: !result.error,
      email: coForm.value.email
    }

    window.parent.postMessage(data, '*')
  }

  async connected () {
    const elements = this.stripe.elements()

    const style = {
      style: {
        base: {
          fontFamily: 'monospace'
        }
      }
    }

    this.card = elements.create('card', style)
    this.card.mount('#card-element')
  }

  async render () {
    return this.html`
      <tonic-form id="form-stripe">
        <div id="card-element"></div>

        <tonic-input spellcheck="false" placeholder="Ace Quxx" label="Cardholder Name" data-key="name" required="true" error-message="First and last name required" id="cardholder-name">
        </tonic-input>
        <tonic-input spellcheck="false" placeholder="555 Broadway St." label="Address" data-key="address_line1" required="true" error-message="Address is required" id="cardholder-address">
        </tonic-input>
        <tonic-input label="City" placeholder="New York City" data-key="address_city" required="true" error-message="City is required" id="cardholder-city">
        </tonic-input>
        <tonic-input label="State/Provence" placeholder="New York" data-key="address_state" required="true" error-message="State or Province is required" id="cardholder-state">
        </tonic-input>
        <tonic-input label="Zip/Postal Code" placeholder="10012" data-key="address_zip" required="true" error-message="Zip or Postal Code is required" id="cardholder-zip">
        </tonic-input>
        <tonic-input label="Country" placeholder="United States" data-key="address_country" required="true" error-message="Country is required" id="cardholder-country">
        </tonic-input>
        <tonic-input label="Email" placeholder="quxx@gmail.com" data-key="email" required="true"  error-message="Email is required" id="cardholder-email">
        </tonic-input>

        <tonic-button disabled="true" width="100%" async="true" id="form-submit">Submit</tonic-button>

        <tonic-toaster-inline id="billing-info" title="How Billing Works" type="info">
          This frame only talks to api.stripe.com. We never see your sensitive credit card data. Stripe returns a token that we store at
          api.socketsupply.co, in a secure, encrypted database. You are only billed for builds that you authorize and only when they successfully complete.
        </tonic-toaster-inline>
      </tonic-form>
    `
  }
}

Tonic.add(AppView)

window.addEventListener('DOMContentLoaded', e => {
  document.body.append(new AppView())
})
