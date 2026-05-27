import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { cleanup } from '@solidjs/testing-library'

// jsdom 29 ships HTMLDialogElement but stubs `showModal`/`close` to throw.
// Polyfill just enough that our `<dialog>`-based modal renders in tests.
if (typeof HTMLDialogElement !== 'undefined') {
  if (!HTMLDialogElement.prototype.showModal || HTMLDialogElement.prototype.showModal.toString().includes('Not implemented')) {
    HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    }
  }
  const originalClose = HTMLDialogElement.prototype.close
  if (!originalClose || originalClose.toString().includes('Not implemented')) {
    HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    }
  }
}

afterEach(() => cleanup())
