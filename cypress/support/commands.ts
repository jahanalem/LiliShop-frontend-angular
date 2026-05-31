/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

/// <reference types="cypress" />

Cypress.Commands.add('typeInAppInput', (formControlName: string, text: string) => {
  cy.get(`app-text-input[formControlName="${formControlName}"]`)
    .find('input')
    .type(text)
    .blur();
});

Cypress.Commands.add('handleMaterialDialog', (expectedTitle: string) => {
  cy.get('mat-dialog-container', { timeout: 5000 })
    .should('be.visible')
    .and('contain.text', expectedTitle);

  cy.get('mat-dialog-container').find('button').click();
});

Cypress.Commands.add('loginViaUI', (email: string, password: string) => {
  cy.typeInAppInput('email', email);
  cy.typeInAppInput('password', password);
  cy.get('button[type="submit"]').should('not.be.disabled').click();
});
