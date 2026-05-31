// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to type text into app-text-input component and blur the input field.
       */
      typeInAppInput(formControlName: string, text: string): Chainable<JQuery<HTMLInputElement>>;

      /**
       * Custom command to verify Material Dialog content and click its action button to close it.
       */
      handleMaterialDialog(expectedTitle: string): Chainable<JQuery<HTMLButtonElement>>;
      /**
       * Fills out the email and password fields, then submits the login form.
       */
      loginViaUI(email: string, password: string): Chainable<JQuery<HTMLButtonElement>>;
    }
  }
}
export {};
